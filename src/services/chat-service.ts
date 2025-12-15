import type { Conversation, Message, ConversationStatus } from "@/types/chat";

const MESSAGES_API_BASE_URL = process.env.MESSAGES_API_BASE_URL || "https://simplyfire.ai:5001/api/noilezer/chats";

export interface ChatsResponse {
  // Newest format: array of objects with { id, data, date } - date is ISO string
  // Older format: array of JSON strings, each representing a conversation
  // Legacy format: array of objects with { id, data: "JSON string" }
  // Very old format: single JSON string
  data: Array<{ id: string; data: string; date?: string }> | string[] | Array<{ id: string; data: string }> | string;
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
  const response = await fetch(`${MESSAGES_API_BASE_URL}?page=${page}`, {
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
    const dataArray = record.data;
    
    // Check the format of array elements
    if (dataArray.length > 0) {
      const firstElement = dataArray[0];
      
      // NEWEST FORMAT: array of objects with { id, data, date? }
      // Example: [{ id: "1733160123456789", data: "[{...}]", date: "2024-12-01T12:34:56.789" }, ...]
      if (typeof firstElement === "object" && firstElement !== null && "id" in firstElement && "data" in firstElement) {
        const chatArray = record.data as Array<{ id?: string; data?: string; date?: string }>;
        
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

          if (Array.isArray(messagesData) && messagesData.length > 0) {
            // Use date from API if available, otherwise parse from id
            let chatTimestamp: Date | undefined;
            
            if (chatObj.date) {
              // Parse ISO date string from API
              chatTimestamp = new Date(chatObj.date);
              if (isNaN(chatTimestamp.getTime())) {
                // If parsing fails, fall back to parsing from id
                chatTimestamp = parseTimestampFromChatId(chatObj.id);
              }
            } else {
              // Parse timestamp from chatId (filename is a timestamp)
              chatTimestamp = parseTimestampFromChatId(chatObj.id);
            }
            
            const messages = messagesData.map((msg, msgIndex) => 
              normalizeMessage(msg, msgIndex, chatTimestamp)
            );
            
            if (messages.length > 0) {
              const conversation = createConversationFromMessages(
                messages,
                page,
                allConversations.length,
                chatObj.id || `chat-${chatIndex}`,
                chatTimestamp
              );
              allConversations.push(conversation);
            }
          }
        });
      }
      // OLDER FORMAT: array of JSON strings
      else if (typeof firstElement === "string") {
        // FORMAT: data is an array of JSON strings, each representing a conversation
        // Example: ["[{...}]", "[{...}]", ...]
        dataArray.forEach((chatDataString, chatIndex) => {
          if (typeof chatDataString !== "string") return;
          
          let messagesData: unknown[] = [];

          try {
            messagesData = JSON.parse(chatDataString);
          } catch (err) {
            console.error(`Failed to parse chat data at index ${chatIndex}:`, err);
            return; // Skip this chat if parsing fails
          }

          // Each string represents a single conversation with multiple messages
          if (Array.isArray(messagesData) && messagesData.length > 0) {
            // Generate a chat ID from index and page
            const chatId = `chat-${page}-${chatIndex}`;
            
            // Try to extract timestamp from first message or use current time
            const firstMessage = messagesData[0];
            let chatTimestamp: Date | undefined;
            
            if (firstMessage && typeof firstMessage === "object") {
              const msgRecord = firstMessage as Record<string, unknown>;
              if (msgRecord.timestamp) {
                chatTimestamp = new Date(msgRecord.timestamp as string | number);
              }
            }
            
            if (!chatTimestamp || isNaN(chatTimestamp.getTime())) {
              chatTimestamp = new Date(); // Fallback to current time
            }
            
            const messages = messagesData.map((msg, msgIndex) => 
              normalizeMessage(msg, msgIndex, chatTimestamp)
            );
            
            if (messages.length > 0) {
              const conversation = createConversationFromMessages(
                messages,
                page,
                allConversations.length,
                chatId,
                chatTimestamp
              );
              allConversations.push(conversation);
            }
          }
        });
      }
    }
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

  // Parse timestamp from chatId for legacy format
  const chatTimestamp = parseTimestampFromChatId(chatId);

  messages.forEach((msg, index) => {
    const message = normalizeMessage(msg, index, chatTimestamp);

    // If this is a user message and we have previous messages, start a new conversation
    if (message.sender === "user" && currentMessages.length > 0) {
      conversations.push(
        createConversationFromMessages(
          currentMessages,
          page,
          conversations.length,
          chatId,
          chatTimestamp
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
        chatId,
        chatTimestamp
      )
    );
  }

  return conversations;
};

const createConversationFromMessages = (
  messages: Message[],
  page: number,
  index: number,
  chatId?: string,
  chatTimestamp?: Date
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

  // Use chatTimestamp if available, otherwise use message timestamps
  const createdAt = chatTimestamp || firstMessage.timestamp;
  const lastMessageAt = chatTimestamp || lastMessage.timestamp;

  return {
    id,
    title: title.length > 50 ? `${title}...` : title,
    messages,
    createdAt,
    lastMessageAt,
    messageCount: messages.length,
    status: "completed" as ConversationStatus,
  };
};

/**
 * Parses timestamp from chatId (filename).
 * Backend format: str(time.time()).replace('.', '') 
 * Example: time.time() = 1733160123.456789 -> "1733160123456789"
 * This is seconds (10 digits) + fractional seconds (variable digits) concatenated.
 * 
 * Python time.time() returns seconds since epoch as a float.
 * The fractional part represents microseconds/milliseconds.
 */
const parseTimestampFromChatId = (chatId?: string): Date | undefined => {
  if (!chatId) return undefined;
  
  // Try to parse as number
  const numericId = parseInt(chatId, 10);
  if (isNaN(numericId)) return undefined;
  
  const length = chatId.length;
  
  // If it's exactly 10 digits, it's seconds (no fractional part)
  if (length === 10) {
    return new Date(numericId * 1000);
  }
  
  // If it's 13 digits, it's seconds (10) + milliseconds (3)
  if (length === 13) {
    const seconds = parseInt(chatId.substring(0, 10), 10);
    const milliseconds = parseInt(chatId.substring(10, 13), 10);
    return new Date(seconds * 1000 + milliseconds);
  }
  
  // If it's 16 digits, it's seconds (10) + microseconds (6)
  // Convert microseconds to milliseconds by dividing by 1000
  if (length === 16) {
    const seconds = parseInt(chatId.substring(0, 10), 10);
    const microseconds = parseInt(chatId.substring(10, 16), 10);
    return new Date(seconds * 1000 + Math.floor(microseconds / 1000));
  }
  
  // If it's longer than 13 digits, try to extract seconds + fractional part
  if (length > 13) {
    const seconds = parseInt(chatId.substring(0, 10), 10);
    const fractionalPart = parseInt(chatId.substring(10), 10);
    // Assume the fractional part is in microseconds, convert to milliseconds
    const fractionalLength = length - 10;
    const divisor = Math.pow(10, fractionalLength - 3); // Convert to milliseconds
    const milliseconds = Math.floor(fractionalPart / divisor);
    return new Date(seconds * 1000 + milliseconds);
  }
  
  // If it's between 11-12 digits, treat as seconds + partial milliseconds
  if (length > 10 && length < 13) {
    const seconds = parseInt(chatId.substring(0, 10), 10);
    const partialMs = parseInt(chatId.substring(10), 10);
    // Scale up to milliseconds (e.g., 2 digits -> multiply by 10, 1 digit -> multiply by 100)
    const milliseconds = partialMs * Math.pow(10, 13 - length);
    return new Date(seconds * 1000 + milliseconds);
  }
  
  // If it's less than 10 digits, might be a different format
  // Try as milliseconds directly if it looks like a millisecond timestamp
  if (numericId > 1000000000000) {
    return new Date(numericId);
  }
  
  // Default: try as seconds
  return new Date(numericId * 1000);
};

const normalizeMessage = (
  msg: unknown, 
  index: number, 
  conversationTimestamp?: Date
): Message => {
  const record =
    msg && typeof msg === "object" ? (msg as Record<string, unknown>) : {};

  const content = typeof record.content === "string" ? record.content : "";
  const role =
    typeof record.role === "string" ? record.role.toLowerCase() : "user";

  // Convert role to sender: "user" -> "user", "system" -> "bot"
  const sender: "user" | "bot" = role === "system" ? "bot" : "user";

  // Use conversation timestamp if available, otherwise use current time
  const timestamp = conversationTimestamp || new Date();

  return {
    id: `message-${index}`,
    content,
    sender,
    timestamp,
  };
};

// Legacy function for backward compatibility
export const fetchConversations = async (
  signal?: AbortSignal
): Promise<Conversation[]> => {
  const response = await fetchConversationsPage(1, signal);
  return response.conversations;
};
