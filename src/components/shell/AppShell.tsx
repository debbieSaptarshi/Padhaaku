"use client";

import type { ReactNode } from "react";

import type { Feedback } from "@/lib/core/types";

import { HakuSidebar } from "@/components/haku/HakuSidebar";

import { NavRail } from "./NavRail";

export function AppShell({
  children,
  haku,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "explain";
  haku?: {
    active: boolean;
    topic: string | null;
    feedback: Feedback | null;
    loading: boolean;
    error: string | null;
    isEmpty: boolean;
    roundNumber: number;
    onCheck: () => void;
    onHoverItem: (id: string | null) => void;
    onRevise: () => void;
    modelAnswerFull?: string;
  };
}) {
  return (
    <div className={`app-shell app-shell-${variant}`}>
      <NavRail />
      <div className="app-main">{children}</div>
      <HakuSidebar
        active={haku?.active ?? false}
        topic={haku?.topic ?? null}
        feedback={haku?.feedback ?? null}
        loading={haku?.loading ?? false}
        error={haku?.error ?? null}
        isEmpty={haku?.isEmpty ?? true}
        roundNumber={haku?.roundNumber ?? 0}
        onCheck={haku?.onCheck ?? (() => {})}
        onHoverItem={haku?.onHoverItem ?? (() => {})}
        onRevise={haku?.onRevise ?? (() => {})}
        modelAnswerFull={haku?.modelAnswerFull}
      />
    </div>
  );
}
