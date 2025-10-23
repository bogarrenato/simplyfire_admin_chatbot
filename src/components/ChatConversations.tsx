"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, User, Bot } from "lucide-react";
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
    title: "Segítség a React komponensekkel",
    messages: [
      {
        id: "1-1",
        content: "Szia! Segítenél nekem a React komponensek létrehozásában?",
        sender: "user",
        timestamp: new Date("2024-01-15T10:30:00")
      },
      {
        id: "1-2",
        content: "Természetesen! Örülök, hogy segíthetek a React komponensek létrehozásában. Milyen típusú komponenst szeretnél létrehozni?",
        sender: "bot",
        timestamp: new Date("2024-01-15T10:30:15")
      },
      {
        id: "1-3",
        content: "Egy egyszerű gomb komponenst szeretnék, ami különböző színekben jelenhet meg.",
        sender: "user",
        timestamp: new Date("2024-01-15T10:31:00")
      },
      {
        id: "1-4",
        content: "Remek! Íme egy példa egy egyszerű gomb komponensre TypeScript-sel:\n\n```tsx\ninterface ButtonProps {\n  children: React.ReactNode;\n  variant?: 'primary' | 'secondary';\n  onClick?: () => void;\n}\n\nexport const Button: React.FC<ButtonProps> = ({ \n  children, \n  variant = 'primary', \n  onClick \n}) => {\n  return (\n    <button \n      className={`px-4 py-2 rounded ${\n        variant === 'primary' \n          ? 'bg-blue-500 text-white' \n          : 'bg-gray-500 text-white'\n      }`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n```",
        sender: "bot",
        timestamp: new Date("2024-01-15T10:31:30")
      }
    ],
    createdAt: new Date("2024-01-15T10:30:00"),
    lastMessageAt: new Date("2024-01-15T10:31:30"),
    messageCount: 4,
    status: "completed"
  },
  {
    id: "2",
    title: "CSS Grid layout problémák",
    messages: [
      {
        id: "2-1",
        content: "Nem tudom, hogyan kell beállítani a CSS Grid-et, hogy 3 oszlopban jelenjenek meg az elemek.",
        sender: "user",
        timestamp: new Date("2024-01-14T14:20:00")
      },
      {
        id: "2-2",
        content: "A CSS Grid nagyszerű választás! Íme egy egyszerű példa 3 oszlopos elrendezésre:\n\n```css\n.grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}\n```\n\nEz létrehoz egy 3 oszlopos rácsot, ahol minden oszlop egyenlő szélességű (1fr), és 1rem távolság van közöttük.",
        sender: "bot",
        timestamp: new Date("2024-01-14T14:20:30")
      },
      {
        id: "2-3",
        content: "Köszönöm! És hogyan tudom beállítani, hogy mobil nézeten csak 1 oszlop legyen?",
        sender: "user",
        timestamp: new Date("2024-01-14T14:21:00")
      },
      {
        id: "2-4",
        content: "Erre a CSS media query-ket használhatod:\n\n```css\n.grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}\n\n@media (max-width: 768px) {\n  .grid-container {\n    grid-template-columns: 1fr;\n  }\n}\n```\n\nEz azt jelenti, hogy 768px alatt csak 1 oszlop lesz látható.",
        sender: "bot",
        timestamp: new Date("2024-01-14T14:21:30")
      }
    ],
    createdAt: new Date("2024-01-14T14:20:00"),
    lastMessageAt: new Date("2024-01-14T14:21:30"),
    messageCount: 4,
    status: "completed"
  },
  {
    id: "3",
    title: "JavaScript async/await használata",
    messages: [
      {
        id: "3-1",
        content: "Mi a különbség a Promise és az async/await között?",
        sender: "user",
        timestamp: new Date("2024-01-13T09:15:00")
      },
      {
        id: "3-2",
        content: "A Promise és az async/await ugyanazt a célt szolgálják, de az async/await szintaktikailag egyszerűbb. Íme egy összehasonlítás:\n\n**Promise használata:**\n```javascript\nfetch('/api/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n```\n\n**async/await használata:**\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error(error);\n  }\n}\n```",
        sender: "bot",
        timestamp: new Date("2024-01-13T09:15:30")
      }
    ],
    createdAt: new Date("2024-01-13T09:15:00"),
    lastMessageAt: new Date("2024-01-13T09:15:30"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "4",
    title: "TypeScript interface vs type",
    messages: [
      {
        id: "4-1",
        content: "Mikor használjam az interface-t és mikor a type-ot TypeScript-ben?",
        sender: "user",
        timestamp: new Date("2024-01-12T16:45:00")
      },
      {
        id: "4-2",
        content: "Jó kérdés! Általában ezeket a szabályokat követem:\n\n**Interface-t használj:**\n- Objektumok típusainak definiálásához\n- Amikor kiterjeszteni szeretnéd a típust\n- API-k és komponens props-okhoz\n\n**Type-ot használj:**\n- Union típusokhoz (string | number)\n- Primitív típusok aliasaihoz\n- Komplex típus kombinációkhoz\n\nPélda:\n```typescript\n// Interface - objektumokhoz\ninterface User {\n  id: number;\n  name: string;\n}\n\n// Type - union típusokhoz\ntype Status = 'loading' | 'success' | 'error';\n```",
        sender: "bot",
        timestamp: new Date("2024-01-12T16:45:30")
      }
    ],
    createdAt: new Date("2024-01-12T16:45:00"),
    lastMessageAt: new Date("2024-01-12T16:45:30"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "5",
    title: "Next.js routing kérdések",
    messages: [
      {
        id: "5-1",
        content: "Hogyan kell beállítani a dinamikus routing-ot Next.js-ben?",
        sender: "user",
        timestamp: new Date("2024-01-11T11:30:00")
      },
      {
        id: "5-2",
        content: "A Next.js dinamikus routing-ja nagyon egyszerű! Íme a lépések:\n\n1. **Fájl struktúra:** Hozz létre egy `[id].tsx` fájlt a `pages` vagy `app` mappában\n\n2. **App Router (Next.js 13+):**\n```typescript\n// app/posts/[id]/page.tsx\nexport default function Post({ params }: { params: { id: string } }) {\n  return <div>Post ID: {params.id}</div>;\n}\n```\n\n3. **Pages Router:**\n```typescript\n// pages/posts/[id].tsx\nexport default function Post({ query }: { query: { id: string } }) {\n  return <div>Post ID: {query.id}</div>;\n}\n```",
        sender: "bot",
        timestamp: new Date("2024-01-11T11:30:30")
      }
    ],
    createdAt: new Date("2024-01-11T11:30:00"),
    lastMessageAt: new Date("2024-01-11T11:30:30"),
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
