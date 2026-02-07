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

  // Add test cookies (multiple cookies in one header, separated by semicolon)
  headers["cookie"] = "sb-jwprfyoaguefutuobcfn-auth-token.0=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWpJM1lUQm1ZbVEwTFRrMlpqZ3ROR0ZpTXkxaE9EZGlMV0k0WmpNelpHWTVaamRoWlNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMMnAzY0hKbWVXOWhaM1ZsWm5WMGRXOWlZMlp1TG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lKa05EWXlPRE5sWVMwME1HRXpMVFEyT1RFdE9EWmhOQzFoTW1RMllXRmxOakJqTUdJaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemN3TkRNeE16WTBMQ0pwWVhRaU9qRTNOekEwTWpjM05qUXNJbVZ0WVdsc0lqb2lkR0Z1YldGNWEyVnFjbWwzWVd3eU9FQm5iV0ZwYkM1amIyMGlMQ0p3YUc5dVpTSTZJaUlzSW1Gd2NGOXRaWFJoWkdGMFlTSTZleUp3Y205MmFXUmxjaUk2SW1kdmIyZHNaU0lzSW5CeWIzWnBaR1Z5Y3lJNld5Sm5iMjluYkdVaVhYMHNJblZ6WlhKZmJXVjBZV1JoZEdFaU9uc2lZWFpoZEdGeVgzVnliQ0k2SW1oMGRIQnpPaTh2YkdnekxtZHZiMmRzWlhWelpYSmpiMjUwWlc1MExtTnZiUzloTDBGRFp6aHZZMHhzV1U1bVlrZEpORk5UYldOR1JYbElMVmQwTVY5VGRYSTJOMVpWZW5sbFJtRlJVMTh5Y1U5U05ITnlOazFRTVROTlBYTTVOaTFqSWl3aVpXMWhhV3dpT2lKMFlXNXRZWGxyWldweWFYZGhiREk0UUdkdFlXbHNMbU52YlNJc0ltVnRZV2xzWDNabGNtbG1hV1ZrSWpwMGNuVmxMQ0ptZFd4c1gyNWhiV1VpT2lKMFlXNXRZWGtnYTJWcWNtbDNZV3dpTENKcGMzTWlPaUpvZEhSd2N6b3ZMMkZqWTI5MWJuUnpMbWR2YjJkc1pTNWpiMjBpTENKdVlXMWxJam9pZEdGdWJXRjVJR3RsYW5KcGQyRnNJaXdpY0dodmJtVmZkbVZ5YVdacFpXUWlPbVpoYkhObExDSndhV04wZFhKbElqb2lhSFIwY0hNNkx5OXNhRE11WjI5dloyeGxkWE5sY21OdmJuUmxiblF1WTI5dEwyRXZRVU5uT0c5alRHeFpUbVppUjBrMFUxTnRZMFpGZVVndFYzUXhYMU4xY2pZM1ZsVjZlV1ZHWVZGVFh6SnhUMUkwYzNJMlRWQXhNMDA5Y3prMkxXTWlMQ0p3Y205MmFXUmxjbDlwWkNJNklqRXdOREEwTlRJeU5qWTBNRGcwTmpJNU1qRTNOaUlzSW5OMVlpSTZJakV3TkRBME5USXlOalkwTURnME5qSTVNakUzTmlKOUxDSnliMnhsSWpvaVlYVjBhR1Z1ZEdsallYUmxaQ0lzSW1GaGJDSTZJbUZoYkRFaUxDSmhiWElpT2x0N0ltMWxkR2h2WkNJNkltOWhkWFJvSWl3aWRHbHRaWE4wWVcxd0lqb3hOemN3TkRJM056WTBmVjBzSW5ObGMzTnBiMjVmYVdRaU9pSm1OREE0TXpVM01DMDJNbU00TFRRNE1XTXRPRFE0T1MweU9HRTBPR1UyT1Rkak9XVWlMQ0pwYzE5aGJtOXVlVzF2ZFhNaU9tWmhiSE5sZlEuR1o5NWw1d25FZzUtOGhZMWVWZjE3TXlfN2tWclNuVU1IWVRGV2g5V3JJNTF4LUh1U0FRckQ5UGxFRjByekZ1RWU4cHE1RnRlSHB2NjMtQXlhaTEzRFEiLCJ0b2tlbl90eXBlIjoiYmVhcmVyIiwiZXhwaXJlc19pbiI6MzYwMCwiZXhwaXJlc19hdCI6MTc3MDQzMTM2NCwicmVmcmVzaF90b2tlbiI6Im1kYWVmaHdzbWY3eSIsInVzZXIiOnsiaWQiOiJkNDYyODNlYS00MGEzLTQ2OTEtODZhNC1hMmQ2YWFlNjBjMGIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJlbWFpbCI6InRhbm1heWtlanJpd2FsMjhAZ21haWwuY29tIiwiZW1haWxfY29uZmlybWVkX2F0IjoiMjAyNi0wMS0yOVQyMjo1OToxNS45ODM1NTVaIiwicGhvbmUiOiIiLCJjb25maXJtZWRfYXQiOiIyMDI2LTAxLTI5VDIyOjU5OjE1Ljk4MzU1NVoiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTAyLTA3VDAxOjI5OjI0LjIzOTk3OTE0NVoiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMbFlOZmJHSTRTU21jRkV5SC1XdDFfU3VyNjdWVXp5ZUZhUVNfMnFPUjRzcjZNUDEzTT1zOTYtYyIsImVtYWlsIjoidGFubWF5a2Vqcml3YWwyOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoidGFubWF5IGtlanJpd2FsIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6InRhbm1heSBrZWpyaXdhbCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xsWU5mYkdJNFNTbWNGRXlILVd0MV9TdXI2N1ZVenllRmFRU18ycU9SNHNyNk1QMTNNPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDQwNDUyMjY2NDA4NDYyOTIxNzYiLCJzdWIiOiIxMDQwNDUyMjY2NDA4NDYyOTIxNzYifSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiJhM; sb-jwprfyoaguefutuobcfn-auth-token.1=WIzODM1ZS0yN2JiLTRkMjQtYjk1ZS05MGJkYzY3YmM1NmIiLCJpZCI6IjEwNDA0NTIyNjY0MDg0NjI5MjE3NiIsInVzZXJfaWQiOiJkNDYyODNlYS00MGEzLTQ2OTEtODZhNC1hMmQ2YWFlNjBjMGIiLCJpZGVudGl0eV9kYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMbFlOZmJHSTRTU21jRkV5SC1XdDFfU3VyNjdWVXp5ZUZhUVNfMnFPUjRzcjZNUDEzTT1zOTYtYyIsImVtYWlsIjoidGFubWF5a2Vqcml3YWwyOEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoidGFubWF5IGtlanJpd2FsIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6InRhbm1heSBrZWpyaXdhbCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xsWU5mYkdJNFNTbWNGRXlILVd0MV9TdXI2N1ZVenllRmFRU18ycU9SNHNyNk1QMTNNPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDQwNDUyMjY2NDA4NDYyOTIxNzYiLCJzdWIiOiIxMDQwNDUyMjY2NDA4NDYyOTIxNzYifSwicHJvdmlkZXIiOiJnb29nbGUiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTAxLTI5VDIyOjU5OjE1Ljk3OTc0M1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wMS0yOVQyMjo1OToxNS45Nzk4WiIsInVwZGF0ZWRfYXQiOiIyMDI2LTAyLTA3VDAxOjI5OjIzLjgyNjM0OVoiLCJlbWFpbCI6InRhbm1heWtlanJpd2FsMjhAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wMS0yOVQyMjo1OToxNS45NzY0MzFaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDItMDdUMDE6Mjk6MjQuMjQyODE4WiIsImlzX2Fub255bW91cyI6ZmFsc2V9LCJwcm92aWRlcl90b2tlbiI6InlhMjkuYTBBVU1XZ19MRkZmZWxLcUJ2YUotUUExek9STHVLTmt6ajZpZHZSRG03OWV0Rk9hU3FFRERPZWlfRkpSLWFoT0kySzRtMEdHS3J1TnpyOEdmZ3dkcUZzN3NIVzFvb3hXQWtCMzBFQVhVbXJ2Zm9icjFzOUZmZWU2ckFWM3NfeGZ3QmJDOENzWjFRZWpkQ19RZ2pDck1HaHM4U2k5bmtvcDNDOE1aUDVpMkJRbjhudlljcHVGQ3QzUDJtMl9zeWpsRjA1SVJqRk1NYUNnWUtBYlVTQVJVU0ZRSEdYMk1peGlJREZLZENpcGdWTmNHWnh1b1hNdzAyMDYiLCJwcm92aWRlcl9yZWZyZXNoX3Rva2VuIjoiMS8vMDVVSEVtV2V0dzdDMkNnWUlBUkFBR0FVU053Ri1MOUlyR05nZjBYLXBwa1hPcVpiS3B5OWRzYjEyajRtbkNjQV9xUW8yMUVfZkZYYjY0cS1WMEdka1p6Q0hZSTVPM29aUVZBMCJ9; test-cookie=manual-test-value; test-cookie2=manual-test-value2;"

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
