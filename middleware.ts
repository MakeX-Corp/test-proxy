import { NextResponse, type NextRequest } from "next/server";

// All requests (both vercel.app and *.makex.app) proxy to this target
const TARGET_URL = "https://d218db8e030759c9-makex.style.dev";

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

  // Add test cookie
  headers["cookie"] = "test-cookie=manual-test-value";

  // Add custom test headers
  headers["X-Proxy-Source"] = "nextjs-middleware-proxy";

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
    console.log("\n[Middleware] ===== SENDING REQUEST =====");
    console.log("[Middleware] Target URL:", targetUrl.toString());
    console.log("[Middleware] Method:", request.method);
    console.log("[Middleware] Headers being sent to target:");
    console.log("  - cookie:", headers["cookie"]);
    console.log("  - X-Proxy-Source:", headers["X-Proxy-Source"]);
    console.log("  - authorization:", headers["authorization"]);
    console.log("[Middleware] All headers:", JSON.stringify(headers, null, 2));

    const proxyResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });

    console.log("[Middleware] ===== RESPONSE RECEIVED =====");

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

    // For Vercel Edge runtime, buffer all static assets
    // This fixes issues with CSS, images, and fonts not loading
    const shouldBuffer = contentType.includes("image/") ||
                         contentType.includes("font/") ||
                         contentType.includes("css") ||
                         contentType.includes("javascript") ||
                         contentType.includes("octet-stream");

    if (shouldBuffer) {
      console.log("[Middleware] Buffering asset:", contentType);
      const buffer = await proxyResponse.arrayBuffer();

      // Set proper cache headers for static assets
      responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

      return new NextResponse(buffer, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: responseHeaders,
      });
    }

    // For HTML and other text content, use body stream
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
  const hostname = request.headers.get("host") || "";

  console.log("\n========================================");
  console.log("=== MIDDLEWARE INTERCEPTED REQUEST ===");
  console.log("========================================");
  console.log("[Middleware] Method:", request.method);
  console.log("[Middleware] Path:", pathname);
  console.log("[Middleware] Full URL:", request.url);
  console.log("[Middleware] Host:", hostname);

  // Build the target URL - ALL domains proxy to same target
  const targetUrl = new URL(TARGET_URL);
  targetUrl.pathname = pathname;
  targetUrl.search = request.nextUrl.search;

  console.log("[Middleware] Will proxy to:", targetUrl.toString());

  // Build headers
  const headers = buildProxyHeaders(request, targetUrl.host);

  console.log("[Middleware] Custom headers added:");
  console.log("  - cookie:", headers["cookie"]);
  console.log("  - X-Proxy-Source:", headers["X-Proxy-Source"]);

  return handleProxyResponse(request, targetUrl, headers);
}

export async function middleware(request: NextRequest) {
  return await proxyRequest(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals
     * Use simpler pattern that works better on Vercel
     */
    "/(.*)",
  ],
};
