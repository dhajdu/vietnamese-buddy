// app/app/loading.tsx: paints the moment a tab is tapped, and lets Link prefetch
// the shell, while the page's queries run.
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-8 sm:px-6 sm:pt-12" aria-busy="true">
      <span className="sr-only" role="status">Loading…</span>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded-pill bg-sand motion-safe:animate-pulse" />
        <div className="h-9 w-2/3 rounded-card bg-sand motion-safe:animate-pulse" />
      </div>
      {[0, 1, 2].map(i => <div key={i} className="card h-16 motion-safe:animate-pulse" />)}
    </div>
  )
}
