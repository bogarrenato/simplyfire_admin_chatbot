import type {
  Conversation,
  RemoteConversationShape,
  RemoteMessageShape,
  Message,
  ConversationStatus,
} from "@/types/chat";

const CHATS_ENDPOINT = "https://simplyfire.ai:5001/api/noilezer/chats";

export const fetchConversations = async (
  signal?: AbortSignal
): Promise<Conversation[]> => {
  const response = await fetch(CHATS_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(rawBody || `Sikertelen válasz: ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error(
      `Nem sikerült feldolgozni a beszélgetés adatokat. Válasz: ${rawBody.slice(0, 200)}`
    );
  }

  return normalizeConversations(payload);
};

const normalizeConversations = (payload: unknown): Conversation[] => {
  const candidates = extractConversationArray(payload);

  return candidates.map((chat, index) => {
    const messages = extractMessages(chat?.messages ?? chat?.history ?? chat?.conversation);
    const createdAt =
      parseDate(chat?.createdAt ?? chat?.created_at ?? messages[0]?.timestamp) ?? new Date();
    const lastMessageAt =
      parseDate(chat?.lastMessageAt ?? chat?.updated_at ?? messages[messages.length - 1]?.timestamp) ??
      createdAt;

    return {
      id: ensureString(chat?.id, `chat-${index}`),
      title: ensureString(chat?.title, `Beszélgetés ${index + 1}`),
      messages,
      createdAt,
      lastMessageAt,
      messageCount: messages.length,
      status: normalizeStatus(chat?.status),
    };
  });
};

const extractConversationArray = (payload: unknown): RemoteConversationShape[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRemoteConversation);
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const candidates = ["chats", "data", "items"] as const;
    for (const key of candidates) {
      const maybeList = obj[key];
      if (Array.isArray(maybeList)) {
        return maybeList.filter(isRemoteConversation);
      }
    }
  }
  return [];
};

const extractMessages = (rawMessages: RemoteMessageShape[] | undefined): Message[] => {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages.map((msg, index) => {
    const content = ensureString(msg.content ?? msg.message ?? "", "");
    const timestamp =
      parseDate(msg.timestamp ?? msg.createdAt ?? msg.created_at) ??
      new Date();
    const senderRaw = ensureString(msg.sender ?? msg.role, "user").toLowerCase();

    return {
      id: ensureString(msg.id, `message-${index}`),
      content,
      sender: senderRaw === "bot" || senderRaw === "assistant" ? "bot" : "user",
      timestamp,
    };
  });
};

const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
};

const normalizeStatus = (status: unknown): ConversationStatus => {
  if (typeof status !== "string") return "completed";
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return "active";
  if (normalized.includes("archiv")) return "archived";
  return "completed";
};

const isRemoteConversation = (value: unknown): value is RemoteConversationShape =>
  typeof value === "object" && value !== null;




