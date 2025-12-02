import type { Conversation, Message, ConversationStatus } from "@/types/chat";

const CHATS_ENDPOINT = "https://simplyfire.ai:5001/api/noilezer/chats";

export interface ChatsResponse {
  data: Array<{ id: string; data: string }> | string; // Array of chat objects (new format) or JSON string (legacy)
  page: number;
  total_pages: number;
  total_chats?: number;
  page_size?: number;
}

export interface ChatPageResponse {
  conversations: Conversation[];
  currentPage: number;
  totalPages: number;
}

export const fetchConversationsPage = async (
  page: number = 1,
  signal?: AbortSignal
): Promise<ChatPageResponse> => {
  const response = await fetch(`${CHATS_ENDPOINT}?page=${page}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include", // Send session cookies
    cache: "no-store",
    signal,
  });

  const rawBody = await response.text();

  if (response.status === 401) {
    // Authentication required - trigger login modal
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth:required");
      window.dispatchEvent(event);
    }
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    throw new Error(rawBody || `Sikertelen válasz: ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error(
      `Nem sikerült feldolgozni a beszélgetés adatokat. Válasz: ${rawBody.slice(
        0,
        200
      )}`
    );
  }

  return normalizeChatsResponse(payload, page);
};

const normalizeChatsResponse = (
  payload: unknown,
  page: number
): ChatPageResponse => {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  let allConversations: Conversation[] = [];

  // Check if data is an array (new format) or a string (legacy format)
  if (Array.isArray(record.data)) {
    // New format: data is an array of chat objects, each with { id, data: "JSON string" }
    const chatArray = record.data as Array<{ id?: string; data?: string }>;
    
    // Process each chat object in the array
    chatArray.forEach((chatObj, chatIndex) => {
      if (!chatObj || typeof chatObj !== "object") return;
      
      const chatDataString = typeof chatObj.data === "string" ? chatObj.data : "[]";
      let messagesData: unknown[] = [];

      try {
        messagesData = JSON.parse(chatDataString);
      } catch (err) {
        console.error(`Failed to parse chat data at index ${chatIndex}:`, err);
        return; // Skip this chat if parsing fails
      }

      // Each chat file represents a single conversation
      // Convert all messages in this chat file to a single conversation
      if (Array.isArray(messagesData) && messagesData.length > 0) {
        const messages = messagesData.map((msg, msgIndex) => 
          normalizeMessage(msg, msgIndex)
        );
        
        if (messages.length > 0) {
          const conversation = createConversationFromMessages(
            messages,
            page,
            allConversations.length,
            chatObj.id || `chat-${chatIndex}`
          );
          allConversations.push(conversation);
        }
      }
    });
  } else if (typeof record.data === "string") {
    // Legacy format: data is a single JSON string containing all messages
    const dataString = record.data;
    let messagesData: unknown[] = [];

    try {
      messagesData = JSON.parse(dataString);
    } catch (err) {
      console.error("Failed to parse data field:", err);
      messagesData = [];
    }

    // Convert messages array to conversations
    allConversations = normalizeMessagesToConversations(messagesData, page);
  } else {
    // Unknown format, return empty
    console.warn("Unknown data format in API response:", record.data);
  }

  const totalPages =
    typeof record.total_pages === "number" ? record.total_pages : 1;

  return {
    conversations: allConversations,
    currentPage: page,
    totalPages,
  };
};

const normalizeMessagesToConversations = (
  messages: unknown[],
  page: number,
  chatId?: string
): Conversation[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // Group messages into conversations (each conversation starts with a user message)
  const conversations: Conversation[] = [];
  let currentMessages: Message[] = [];

  messages.forEach((msg, index) => {
    const message = normalizeMessage(msg, index);

    // If this is a user message and we have previous messages, start a new conversation
    if (message.sender === "user" && currentMessages.length > 0) {
      conversations.push(
        createConversationFromMessages(
          currentMessages,
          page,
          conversations.length,
          chatId
        )
      );
      currentMessages = [];
    }

    currentMessages.push(message);
  });

  // Add the last conversation
  if (currentMessages.length > 0) {
    conversations.push(
      createConversationFromMessages(
        currentMessages,
        page,
        conversations.length,
        chatId
      )
    );
  }

  return conversations;
};

const createConversationFromMessages = (
  messages: Message[],
  page: number,
  index: number,
  chatId?: string
): Conversation => {
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  // Generate title from first user message
  const firstUserMessage = messages.find((m) => m.sender === "user");
  const title =
    firstUserMessage?.content.slice(0, 50) ||
    `Beszélgetés ${page}-${index + 1}`;

  // Use chatId if provided, otherwise generate a unique ID
  const id = chatId 
    ? `${chatId}-conv-${index}` 
    : `conversation-${page}-${index}`;

  return {
    id,
    title: title.length > 50 ? `${title}...` : title,
    messages,
    createdAt: firstMessage.timestamp,
    lastMessageAt: lastMessage.timestamp,
    messageCount: messages.length,
    status: "completed" as ConversationStatus,
  };
};

const normalizeMessage = (msg: unknown, index: number): Message => {
  const record =
    msg && typeof msg === "object" ? (msg as Record<string, unknown>) : {};

  const content = typeof record.content === "string" ? record.content : "";
  const role =
    typeof record.role === "string" ? record.role.toLowerCase() : "user";

  // Convert role to sender: "user" -> "user", "system" -> "bot"
  const sender: "user" | "bot" = role === "system" ? "bot" : "user";

  return {
    id: `message-${index}`,
    content,
    sender,
    timestamp: new Date(), // API doesn't provide timestamp, use current time
  };
};

// Legacy function for backward compatibility
export const fetchConversations = async (
  signal?: AbortSignal
): Promise<Conversation[]> => {
  const response = await fetchConversationsPage(1, signal);
  return response.conversations;
};
