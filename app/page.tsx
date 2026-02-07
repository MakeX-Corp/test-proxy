export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-red-50 font-sans">
      <main className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg max-w-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          ⚠️ Middleware Not Running
        </h1>
        <p className="text-lg text-gray-700 text-center mb-4">
          If you see this page, the Next.js middleware is NOT executing.
        </p>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p className="font-semibold mb-2">Expected behavior:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Middleware should intercept all requests</li>
            <li>Requests should be proxied to the target URL</li>
            <li>You should see the proxied content, not this page</li>
          </ul>
        </div>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="font-semibold text-yellow-800 mb-2">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            <li>Check if middleware.ts exists in the root directory</li>
            <li>Check deployment logs for middleware errors</li>
            <li>Verify matcher config in middleware.ts</li>
            <li>Some platforms don't support Edge middleware</li>
            <li>Check the deployment platform supports Next.js middleware</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
