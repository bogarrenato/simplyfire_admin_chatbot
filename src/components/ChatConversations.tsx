"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import ChatModal from "./ChatModal";
import ChatConversationsSkeleton from "./ChatConversationsSkeleton";

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

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "EBHS Diploma Examination – requirements & registration",
    messages: [
      {
        id: "1-1",
        content: "What are the requirements for the EBHS Diploma Examination and how can I register?",
        sender: "user",
        timestamp: new Date("2025-10-31T09:00:00")
      },
      {
        id: "1-2",
        content: "The EBHS Diploma Examination information, including eligibility and registration steps, is available under Education → EBHS Diploma Examination. See details here: [EBHS Exam](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T09:00:20")
      }
    ],
    createdAt: new Date("2025-10-31T09:00:00"),
    lastMessageAt: new Date("2025-10-31T09:00:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "2",
    title: "FESSH Academy – Foundation vs Advanced course",
    messages: [
      {
        id: "2-1",
        content: "What is the difference between the Foundation and Advanced Academy courses?",
        sender: "user",
        timestamp: new Date("2025-10-31T09:15:00")
      },
      {
        id: "2-2",
        content: "Both are part of the FESSH Academy. The Foundation Course focuses on core principles, while the Advanced Course is designed for deeper, specialized topics. Check schedules and content under Education → FESSH Academy courses: [FESSH Academy](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T09:15:25")
      }
    ],
    createdAt: new Date("2025-10-31T09:15:00"),
    lastMessageAt: new Date("2025-10-31T09:15:25"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "3",
    title: "Online Self-Assessment Examination",
    messages: [
      {
        id: "3-1",
        content: "Is there an online self-assessment exam I can take?",
        sender: "user",
        timestamp: new Date("2025-10-31T09:30:00")
      },
      {
        id: "3-2",
        content: "Yes. The Online Self-Assessment Examination is available under Education. You can read about access, format and topics here: [Online Self-Assessment](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T09:30:20")
      }
    ],
    createdAt: new Date("2025-10-31T09:30:00"),
    lastMessageAt: new Date("2025-10-31T09:30:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "4",
    title: "Research Grants & Fellowship",
    messages: [
      {
        id: "4-1",
        content: "How do I apply for a FESSH research grant or fellowship?",
        sender: "user",
        timestamp: new Date("2025-10-31T09:45:00")
      },
      {
        id: "4-2",
        content: "Application details, eligibility and timelines for Research Grants and Fellowships are listed under Research. See: [Research Grants](https://fessh.com/) and [Research Fellowship](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T09:45:20")
      }
    ],
    createdAt: new Date("2025-10-31T09:45:00"),
    lastMessageAt: new Date("2025-10-31T09:45:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "5",
    title: "Hand Trauma Network / Accreditation",
    messages: [
      {
        id: "5-1",
        content: "Where can I find information about Hand Trauma Centers and accreditation?",
        sender: "user",
        timestamp: new Date("2025-10-31T10:00:00")
      },
      {
        id: "5-2",
        content: "See Clinical practice → Hand Trauma Network for accreditation criteria and centers. More here: [Hand Trauma Network](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T10:00:20")
      }
    ],
    createdAt: new Date("2025-10-31T10:00:00"),
    lastMessageAt: new Date("2025-10-31T10:00:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "6",
    title: "Patronage for events",
    messages: [
      {
        id: "6-1",
        content: "How can I request FESSH patronage for my event?",
        sender: "user",
        timestamp: new Date("2025-10-31T10:15:00")
      },
      {
        id: "6-2",
        content: "Guidelines and application information are under Meetings → Patronage. Please review requirements and submission process here: [Patronage](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T10:15:20")
      }
    ],
    createdAt: new Date("2025-10-31T10:15:00"),
    lastMessageAt: new Date("2025-10-31T10:15:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "7",
    title: "Travel Award",
    messages: [
      {
        id: "7-1",
        content: "Am I eligible for the FESSH Travel Award and how do I apply?",
        sender: "user",
        timestamp: new Date("2025-10-31T10:30:00")
      },
      {
        id: "7-2",
        content: "Travel Award details, including eligibility and deadlines, can be found under Education → Travel Award. Read more: [Travel Award](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T10:30:20")
      }
    ],
    createdAt: new Date("2025-10-31T10:30:00"),
    lastMessageAt: new Date("2025-10-31T10:30:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "8",
    title: "Contacts & Secretariat working hours",
    messages: [
      {
        id: "8-1",
        content: "How can I contact the FESSH Secretariat and what are the working hours?",
        sender: "user",
        timestamp: new Date("2025-10-31T10:45:00")
      },
      {
        id: "8-2",
        content: "You can reach the Secretariat at office@fessh.com, Monday–Friday 09:00–17:00. See Administration → Contacts for details: [Contacts](https://fessh.com/)",
        sender: "bot",
        timestamp: new Date("2025-10-31T10:45:25")
      }
    ],
    createdAt: new Date("2025-10-31T10:45:00"),
    lastMessageAt: new Date("2025-10-31T10:45:25"),
    messageCount: 2,
    status: "completed"
  }
];

const ChatConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Simulate API call delay
    const loadConversations = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      setConversations(mockConversations);
      setIsLoading(false);
    };

    loadConversations();
  }, []);

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
        return "Active";
      case "completed":
        return "Finished";
      case "archived":
        return "Archived";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return <ChatConversationsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chatbot conversations</h2>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {conversations.length} conversations
          </span>
        </div>
      </div>

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
                      <span>{conversation.messageCount} messages</span>
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
                  <span>User</span>
                </div>
                <p className="line-clamp-2">
                  {conversation.messages.find(m => m.sender === "user")?.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
