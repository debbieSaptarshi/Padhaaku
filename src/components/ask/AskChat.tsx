"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { ChatMessage } from "@/components/ChatMessage";
import { AppShell } from "@/components/shell/AppShell";
import type { StudyMessage } from "@/lib/study-buddy";

const starterPrompts = [
  "What is photosynthesis?",
  "Explain recursion simply",
  "Help me understand supply and demand",
];

export function AskChat() {
  const [messages, setMessages] = useState<StudyMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm Haku. Ask about any topic and I'll break it down. For deeper learning, try **Explain** and tell me what *you* think first.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"offline" | "openai" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading],
  );

  async function sendMessage(text: string) {
    const question = text.trim();
    if (!question || isLoading) return;

    const nextMessages: StudyMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          history: messages,
          context: { mode: "ask" },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Something went wrong");
      }

      const payload = (await response.json()) as {
        reply: string;
        mode: "offline" | "openai";
        suggestExplain?: boolean;
        explainTopic?: string;
      };

      setMode(payload.mode);
      let reply = payload.reply;
      if (payload.suggestExplain && payload.explainTopic) {
        reply += `\n\n_Tip: Try explaining **${payload.explainTopic}** yourself in [Explain mode](/explain) — you'll remember it better._`;
      }

      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to reach Haku",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <AppShell>
      <main className="ask-page mx-auto flex h-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Ask Haku
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Quick explanations
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Want to own the idea?{" "}
            <Link href="/explain" className="font-medium text-accent hover:underline">
              Switch to Explain
            </Link>
            .
          </p>
          {mode && (
            <p className="mt-2 inline-flex rounded-full bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
              {mode === "openai" ? "OpenAI" : "Offline guide"}
            </p>
          )}
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <ChatMessage key={`${message.role}-${index}`} message={message} />
            ))}
            {isLoading && (
              <div className="text-sm text-slate-500">Haku is thinking...</div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:border-accent hover:bg-accentSoft"
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Haku about any topic..."
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-white disabled:bg-slate-300"
              >
                Ask
              </button>
            </form>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
