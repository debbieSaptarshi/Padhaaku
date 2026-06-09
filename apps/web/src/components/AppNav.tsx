import Link from "next/link";

export function AppNav() {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      <Link
        href="/"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
      >
        Chat
      </Link>
      <Link
        href="/learn"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
      >
        Learn (active recall)
      </Link>
      <Link
        href="/practice"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
      >
        Practice
      </Link>
    </nav>
  );
}
