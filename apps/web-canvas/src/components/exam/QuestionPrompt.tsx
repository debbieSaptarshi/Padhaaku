import { useMemo } from "react";
import katex from "katex";

function renderLatex(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false });
  } catch {
    return tex;
  }
}

function parseMixedText(text: string): Array<{ type: "text" | "math"; value: string }> {
  const parts: Array<{ type: "text" | "math"; value: string }> = [];
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "math", value: match[1] ?? match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts;
}

export default function QuestionPrompt({ text }: { text: string }) {
  const html = useMemo(() => {
    const parts = parseMixedText(text);
    return parts
      .map((p) =>
        p.type === "math"
          ? renderLatex(p.value)
          : p.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      )
      .join("");
  }, [text]);

  return (
    <p
      className="question-prompt-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathText({ text }: { text: string }) {
  const html = useMemo(() => {
    const parts = parseMixedText(text);
    return parts
      .map((p) =>
        p.type === "math"
          ? renderLatex(p.value)
          : p.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      )
      .join("");
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
