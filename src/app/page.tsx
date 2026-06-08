"use client";

import { FormEvent, useMemo, useState } from "react";

import { ChatMessage } from "@/components/ChatMessage";
import type { StudyMessage } from "@/lib/study-buddy";

const starterPrompts = [
  "What is photosynthesis?",
  "Explain recursion simply",
  "Help me understand supply and demand",
];

export default function HomePage() {
  const [messages, setMessages] = useState<StudyMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Padhaaku — your study buddy. Ask about any topic and I'll break it down with definitions, key ideas, examples, and practice prompts.",
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
    if (!question || isLoading) {
      return;
    }

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
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Something went wrong");
      }

      const payload = (await response.json()) as {
        reply: string;
        mode: "offline" | "openai";
      };

      setMode(payload.mode);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: payload.reply },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to reach Padhaaku";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Padhaaku
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Your study buddy for any topic
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Ask a question, get a structured explanation, and follow up until the
          idea clicks.
        </p>
        {mode && (
          <p className="mt-4 inline-flex rounded-full bg-accentSoft px-3 py-1 text-xs font-medium text-accent">
            Mode: {mode === "openai" ? "OpenAI" : "Offline study guide"}
          </p>
        )}
      </header>

      <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {messages.map((message, index) => (
            <ChatMessage key={`${message.role}-${index}`} message={message} />
          ))}
          {isLoading && (
            <div className="text-sm text-slate-500">Padhaaku is thinking...</div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:border-accent hover:bg-accentSoft hover:text-accent"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Padhaaku about any topic..."
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-accent transition focus:ring-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ask
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
