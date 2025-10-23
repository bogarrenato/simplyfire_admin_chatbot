"use client";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, User, Bot, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

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

interface ChatModalProps {
  conversation: Conversation;
  onClose: () => void;
}

const ChatModal = ({ conversation, onClose }: ChatModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when modal opens
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200); // Wait for animation to complete
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">
                {conversation.title}
              </DialogTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(conversation.createdAt, "MMM dd, yyyy HH:mm", { locale: hu })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{conversation.messageCount} üzenet</span>
                </div>
                <Badge className={getStatusColor(conversation.status)}>
                  {getStatusText(conversation.status)}
                </Badge>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 mt-4">
          <div className="space-y-4 pr-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-muted mr-12"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      {message.sender === "user" ? (
                        <User className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <Bot className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender === "user" ? "Felhasználó" : "Chatbot"}
                        </span>
                        <span className="text-xs opacity-70">
                          {format(message.timestamp, "HH:mm", { locale: hu })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 mt-4 pt-4 border-t">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                Beszélgetés kezdete: {format(conversation.createdAt, "MMM dd, yyyy HH:mm", { locale: hu })}
              </span>
              <span>
                Utolsó üzenet: {format(conversation.lastMessageAt, "MMM dd, yyyy HH:mm", { locale: hu })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
