export type ConversationStatus = "active" | "completed" | "archived";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  status: ConversationStatus;
}

export interface RemoteConversationShape extends Record<string, unknown> {
  id?: string;
  title?: string;
  messages?: RemoteMessageShape[];
  history?: RemoteMessageShape[];
  conversation?: RemoteMessageShape[];
  createdAt?: string;
  created_at?: string;
  lastMessageAt?: string;
  updated_at?: string;
  status?: string;
}

export interface RemoteMessageShape extends Record<string, unknown> {
  id?: string;
  content?: string;
  message?: string;
  timestamp?: string | number | Date;
  createdAt?: string | number | Date;
  created_at?: string | number | Date;
  sender?: string;
  role?: string;
}




