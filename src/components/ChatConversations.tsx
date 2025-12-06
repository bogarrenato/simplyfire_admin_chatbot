"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import ChatModal from "./ChatModal";
import ChatConversationsSkeleton from "./ChatConversationsSkeleton";
import { Button } from "@/components/ui/button";
import { fetchConversationsPage } from "@/services/chat-service";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  status: "active" | "completed" | "archived";
}

// Próba beszélgetés generálása hiba vagy üres válasz esetén
const createFallbackConversation = (): Conversation => {
  const now = new Date();
  return {
    id: "fallback-1",
    title: "próba cím",
    messages: [
      {
        id: "fallback-1-1",
        content: "",
        sender: "user",
        timestamp: now
      }
    ],
    createdAt: now,
    lastMessageAt: now,
    messageCount: 1,
    status: "completed"
  };
};

const ChatConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchConversationsPage(1, controller.signal);
        if (response.conversations.length === 0) {
          setError("Nem érkezett beszélgetés adat.");
          setConversations([createFallbackConversation()]);
        } else {
          setConversations(response.conversations);
          setCurrentPage(response.currentPage);
          setTotalPages(response.totalPages);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        const message =
          (err as Error)?.message ?? "Ismeretlen hiba történt a beszélgetések betöltése közben.";
        console.error("Failed to load chats:", err);
        setError(message);
        setConversations([createFallbackConversation()]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadConversations();
    return () => controller.abort();
  }, []);

  const loadMoreConversations = async () => {
    if (currentPage >= totalPages || isLoadingMore) return;

    setIsLoadingMore(true);
    const controller = new AbortController();

    try {
      const nextPage = currentPage + 1;
      const response = await fetchConversationsPage(nextPage, controller.signal);
      setConversations((prev) => [...prev, ...response.conversations]);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("Failed to load more chats:", err);
      setError("Nem sikerült betölteni a további beszélgetéseket.");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMore(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktív";
      case "completed":
        return "Befejezett";
      case "archived":
        return "Archivált";
      default:
        return "Ismeretlen";
    }
  };

  if (isLoading) {
    return <ChatConversationsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chatbot Beszélgetések</h2>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {conversations.length} beszélgetés
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {conversations.map((conversation) => (
          <Card 
            key={conversation.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{conversation.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(conversation.lastMessageAt, "MMM dd, HH:mm", { locale: hu })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{conversation.messageCount} üzenet</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(conversation.status)}>
                    {getStatusText(conversation.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4" />
                  <span>Felhasználó</span>
                </div>
                <p className="line-clamp-2">
                  {conversation.messages.find(m => m.sender === "user")?.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentPage < totalPages && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMoreConversations}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? "Betöltés..." : `Továbbiak betöltése (${currentPage}/${totalPages})`}
          </Button>
        </div>
      )}

      {selectedConversation && (
        <ChatModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
};

export default ChatConversations;
