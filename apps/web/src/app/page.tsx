import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="home-page">
        <header className="home-hero">
          <p className="home-eyebrow">Padhaaku</p>
          <h1>Your study buddy for any topic</h1>
          <p className="home-lead">
            <strong>Haku</strong> coaches you in the sidebar — whether you&apos;re
            explaining a concept yourself or asking a quick question.
          </p>
        </header>

        <div className="home-cards">
          <Link href="/explain" className="home-card home-card-primary">
            <span className="home-card-icon">✦</span>
            <h2>Explain</h2>
            <p>
              Active recall on a mind map or text. Haku checks your understanding
              and nudges you — never just the answer.
            </p>
            <span className="home-card-cta">Start explaining →</span>
          </Link>

          <Link href="/ask" className="home-card">
            <span className="home-card-icon">?</span>
            <h2>Ask</h2>
            <p>
              Quick structured explanations when you need an overview before you
              dive in.
            </p>
            <span className="home-card-cta">Ask Haku →</span>
          </Link>

          <Link href="/practice" className="home-card">
            <span className="home-card-icon">⚡</span>
            <h2>Practice</h2>
            <p>
              STEM problem sets with multiple choice and open-ended questions,
              KaTeX math, and stepwise coaching from the Practice Coach agent.
            </p>
            <span className="home-card-cta">Start practicing →</span>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
