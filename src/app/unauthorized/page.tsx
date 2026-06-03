export default function Unauthorized() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-4 max-w-md p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-xl">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-zinc-400">
          Your current IP address is not authorized to access this office account. Please connect from an approved network.
        </p>
        <div className="pt-6">
          <a href="/api/auth/signout" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}
