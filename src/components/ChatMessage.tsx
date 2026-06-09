import type { StudyMessage } from "@/lib/study-buddy";

function renderMarkdownLine(line: string, index: number) {
  if (line.startsWith("## ")) {
    return <h2 key={index}>{line.replace(/^##\s+/, "")}</h2>;
  }

  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <p key={index}>
        <strong>{line.slice(2, -2)}</strong>
      </p>
    );
  }

  if (line.startsWith("- ")) {
    return <li key={index}>{line.replace(/^- /, "")}</li>;
  }

  if (/^\d+\.\s/.test(line)) {
    return <li key={index}>{line.replace(/^\d+\.\s/, "")}</li>;
  }

  if (line.startsWith("_") && line.endsWith("_")) {
    return (
      <p key={index}>
        <em>{line.slice(1, -1)}</em>
      </p>
    );
  }

  if (!line.trim()) {
    return <div key={index} className="h-2" />;
  }

  return <p key={index}>{line}</p>;
}

export function ChatMessage({ message }: { message: StudyMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-accent text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-6">{message.content}</p>
        ) : (
          <div className="prose-study space-y-1">
            {message.content
              .split("\n")
              .map((line, index) => renderMarkdownLine(line, index))}
          </div>
        )}
      </div>
    </div>
  );
}
