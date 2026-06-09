"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/shell/AppShell";
import PracticeScreen from "@/components/exam/PracticeScreen";

import "@/styles/practice.css";
import "katex/dist/katex.min.css";

export default function PracticePage() {
  const router = useRouter();

  return (
    <AppShell variant="explain">
      <div className="practice-theme">
        <PracticeScreen onExit={() => router.push("/")} />
      </div>
    </AppShell>
  );
}
