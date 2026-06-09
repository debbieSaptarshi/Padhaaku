export type StudyMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StudyBuddyResponse = {
  reply: string;
  mode: "offline" | "openai" | "anthropic";
  citations?: string[];
};
