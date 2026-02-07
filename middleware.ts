import { NextResponse, type NextRequest } from "next/server";

const TARGET_URL = "https://dae95a96f1490567-makex.style.dev";

/**
 * Builds proxy headers for the request
 */
function buildProxyHeaders(
  request: NextRequest,
  targetHost: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "host": targetHost,
    "user-agent": request.headers.get("user-agent") || "Mozilla/5.0",
    "accept": request.headers.get("accept") || "*/*",
    "accept-language": request.headers.get("accept-language") || "en-US,en;q=0.9",
    "accept-encoding": "gzip, deflate, br",
  };

  // Forward cookies - important for authentication
  const cookie = request.headers.get("cookie");
  const testCookie = "test-cookie=manual-test-value";
  if (cookie) {
    headers["cookie"] = `${cookie}; ${testCookie}`;
  } else {
    headers["cookie"] = testCookie;
  }

  // Forward authorization header
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers["authorization"] = authorization;
  }

  // Forward important proxy headers
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const realIp = cfConnectingIp || xForwardedFor || request.headers.get("x-real-ip");

  if (realIp) {
    headers["x-forwarded-for"] = realIp;
    headers["x-real-ip"] = realIp;
  }

  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = request.headers.get("host") || targetHost;

  // Forward referer if present
  const referer = request.headers.get("referer");
  if (referer) {
    headers["referer"] = referer;
  }

  // Forward origin if present
  const origin = request.headers.get("origin");
  if (origin) {
    headers["origin"] = origin;
  }

  // Forward cache-control header
  const cacheControl = request.headers.get("cache-control");
  if (cacheControl) {
    headers["cache-control"] = cacheControl;
  }

  return headers;
}

/**
 * Handles proxy response and returns NextResponse
 */
async function handleProxyResponse(
  request: NextRequest,
  targetUrl: URL,
  headers: Record<string, string>
): Promise<NextResponse> {
  try {
    console.log("[Middleware] Fetching:", {
      url: targetUrl.toString(),
      method: request.method,
    });

    const proxyResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });

    const contentType = proxyResponse.headers.get("content-type") || "";
    console.log("[Middleware] Proxy response status:", proxyResponse.status, contentType);

    // Log response body for error responses
    if (proxyResponse.status >= 400) {
      console.log("[Middleware] ❌ ERROR - URL:", targetUrl.toString());
      console.log("[Middleware] ❌ ERROR - Status:", proxyResponse.status);
      const responseText = await proxyResponse.text();
      console.log("[Middleware] Error response body:", responseText.substring(0, 500));

      return new NextResponse(responseText, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: proxyResponse.headers,
      });
    }

    // Handle redirects
    if (proxyResponse.status >= 300 && proxyResponse.status < 400) {
      const location = proxyResponse.headers.get("location");
      if (location) {
        const redirectUrl = new URL(location, targetUrl);
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = redirectUrl.pathname;
        newUrl.search = redirectUrl.search;
        return NextResponse.redirect(newUrl, proxyResponse.status);
      }
    }

    // Create response with headers from target
    const responseHeaders = new Headers(proxyResponse.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    const response = new NextResponse(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });

    return response;
  } catch (error) {
    console.error("[Middleware] Proxy error:", error);
    return new NextResponse("Proxy Error", { status: 502 });
  }
}

async function proxyRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("=== MIDDLEWARE RUNNING ===");
  console.log("[Middleware] Request:", request.method, pathname);
  console.log("[Middleware] Host:", request.headers.get("host"));
  console.log("[Middleware] Full URL:", request.url);

  // Skip Next.js internal routes
  const isNextInternal = pathname.startsWith("/_next/static") ||
                         pathname.startsWith("/_next/image") ||
                         pathname === "/_next/webpack-hmr";

  if (isNextInternal) {
    console.log("[Middleware] Skipping Next.js internal route");
    return NextResponse.next();
  }

  // Build the target URL
  const targetUrl = new URL(TARGET_URL);
  targetUrl.pathname = pathname;
  targetUrl.search = request.nextUrl.search;

  console.log("[Middleware] Target URL:", targetUrl.toString());

  // Build headers
  const headers = buildProxyHeaders(request, targetUrl.host);

  return handleProxyResponse(request, targetUrl, headers);
}

export async function middleware(request: NextRequest) {
  return await proxyRequest(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals
     */
    "/",
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)",
  ],
};
