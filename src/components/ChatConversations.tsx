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

const CHATS_ENDPOINT = "https://simplyfire.ai:5001/api/noilezer/chats";

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Online jegyvásárlás és kedvezmények",
    messages: [
      {
        id: "1-1",
        content: "Hogyan tudok online jegyet venni az Aqua-Palace Élményfürdőbe?",
        sender: "user",
        timestamp: new Date("2025-10-29T10:10:00")
      },
      {
        id: "1-2",
        content: "Az online jegyvásárlás elérhető a SF oldalán, az Online jegyvásárlás menüpontban. Online vásárlás esetén kedvezményt biztosítunk a belépőjegyek árjegyzéki árából. Részletek az árak oldalon az alábbi linkre kattintva érhetők el: ÁRAK – https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-29T10:10:20")
      },
    ],
    createdAt: new Date("2025-10-29T10:10:00"),
    lastMessageAt: new Date("2025-10-29T10:10:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "2",
    title: "Árak és belépőjegy csomagok",
    messages: [
      {
        id: "2-1",
        content: "Mennyibe kerül a családi jegy?",
        sender: "user",
        timestamp: new Date("2025-10-29T11:00:00")
      },
      {
        id: "2-2",
        content: "A konkrét árak a SF Árak oldalán találhatók, a Belépőjegy csomagok szekcióban. Az árak szezonálisan és szolgáltatásonként eltérhetnek (Gyógyfürdő, Aqua-Palace, Strand, Aquapark, Prémium Zóna). Részletek az árak oldalon az alábbi linkre kattintva érhetők el: ÁRAK – https://hungarospa.hu/jegyarak/",
        sender: "bot",
        timestamp: new Date("2025-10-29T11:00:20")
      },
      {
        id: "2-3",
        content: "Van kombinált jegy Aqua-Palace + Gyógyfürdőre?",
        sender: "user",
        timestamp: new Date("2025-10-29T11:00:40")
      },
      {
        id: "2-4",
        content: "Igen, elérhető Aqua-Palace extra belépőjegy csomag, amely kedvezményes kombinációt kínál. Részletek az árak oldalon: [ÁRAK](https://hungarospa.hu/jegyarak/)",
        sender: "bot",
        timestamp: new Date("2025-10-29T11:01:00")
      }
    ],
    createdAt: new Date("2025-10-29T11:00:00"),
    lastMessageAt: new Date("2025-10-29T11:01:00"),
    messageCount: 4,
    status: "completed"
  },
  {
    id: "3",
    title: "Nyitvatartás és szezonális egységek",
    messages: [
      {
        id: "3-1",
        content: "Nyitva van most az Aquapark?",
        sender: "user",
        timestamp: new Date("2025-10-29T12:15:00")
      },
      {
        id: "3-2",
        content: "Az Aquapark jelenleg zárva. Egész évben nyitva: Aqua-Palace Élményfürdő, Gyógyfürdő, Árpád Uszoda. A Strand szezonálisan üzemel. Aktuális nyitvatartás: https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-29T12:15:20")
      }
    ],
    createdAt: new Date("2025-10-29T12:15:00"),
    lastMessageAt: new Date("2025-10-29T12:15:20"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "4",
    title: "Fizetési módok és kedvezmények",
    messages: [
      {
        id: "4-1",
        content: "Milyen fizetési módokat fogadnak el a pénztáraknál?",
        sender: "user",
        timestamp: new Date("2025-10-29T13:05:00")
      },
      {
        id: "4-2",
        content: "A részletes információk a Fizetési módok menüpontban találhatók. Itt tájékozódhat a készpénz, bankkártya és egyéb elfogadott fizetési megoldásokról.",
        sender: "bot",
        timestamp: new Date("2025-10-29T13:05:20")
      },
      {
        id: "4-3",
        content: "Vannak szezonális akciók vagy kedvezmények?",
        sender: "user",
        timestamp: new Date("2025-10-29T13:05:40")
      },
      {
        id: "4-4",
        content: "Igen, az Akciók oldalon rendszeresen frissülő ajánlatok érhetők el (például online jegyvásárlási kedvezmény, kombinált csomagok). Részletek: https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-29T13:05:55")
      }
    ],
    createdAt: new Date("2025-10-29T13:05:00"),
    lastMessageAt: new Date("2025-10-29T13:05:55"),
    messageCount: 4,
    status: "completed"
  },
  {
    id: "5",
    title: "SF Medical Center – labor akció",
    messages: [
      {
        id: "5-1",
        content: "Van most kedvezmény a laborvizsgálatokra a Medical Centerben?",
        sender: "user",
        timestamp: new Date("2025-10-30T09:00:00")
      },
      {
        id: "5-2",
        content: "Igen. Nyitási akció keretében minden laborcsomag 10% kedvezménnyel érhető el a SF Medical Center vérvételi pontján. További részletek: https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-30T09:00:25")
      }
    ],
    createdAt: new Date("2025-10-30T09:00:00"),
    lastMessageAt: new Date("2025-10-30T09:00:25"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "6",
    title: "Gyógykúra és szolgáltatások",
    messages: [
      {
        id: "6-1",
        content: "Mit tartalmaz a Gyógykúra élményfürdőzéssel akció?",
        sender: "user",
        timestamp: new Date("2025-10-30T09:20:00")
      },
      {
        id: "6-2",
        content: "A Hajdúszoboszlói Gyógyfürdő gyógykúra szolgáltatásai mellé az akció időtartama alatt élményfürdő belépő jár. A részletes feltételek és időtartam az Akciók oldalon található: https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-30T09:20:25")
      }
    ],
    createdAt: new Date("2025-10-30T09:20:00"),
    lastMessageAt: new Date("2025-10-30T09:20:25"),
    messageCount: 2,
    status: "completed"
  },
  {
    id: "7",
    title: "Parkolás és megközelítés",
    messages: [
      {
        id: "7-1",
        content: "Hol tudok parkolni és hogyan lehet a komplexumot megközelíteni?",
        sender: "user",
        timestamp: new Date("2025-10-30T09:40:00")
      },
      {
        id: "7-2",
        content: "A Parkolás és Megközelítés információk a honlapon találhatók, térképekkel és gyakorlati tudnivalókkal. Kérjük, ellenőrizze az aktuális részleteket indulás előtt: https://hungarospa.hu/",
        sender: "bot",
        timestamp: new Date("2025-10-30T09:40:20")
      }
    ],
    createdAt: new Date("2025-10-30T09:40:00"),
    lastMessageAt: new Date("2025-10-30T09:40:20"),
    messageCount: 2,
    status: "completed"
  }
];

const ChatConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const remoteConversations = await fetchConversations(controller.signal);
        if (remoteConversations.length === 0) {
          setError("Nem érkezett beszélgetés adat, a mintapéldák láthatók.");
          setConversations(mockConversations);
        } else {
          setConversations(remoteConversations);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        const message =
          (err as Error)?.message ?? "Ismeretlen hiba történt a beszélgetések betöltése közben.";
        console.error("Failed to load chats:", err);
        setError(message);
        setConversations(mockConversations);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadConversations();
    return () => controller.abort();
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

const fetchConversations = async (signal?: AbortSignal): Promise<Conversation[]> => {
  const response = await fetch(CHATS_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
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
  } catch (parseError) {
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

const extractConversationArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.chats)) return obj.chats;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
  }
  return [];
};

const extractMessages = (rawMessages: unknown): Message[] => {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages.map((msg, index) => {
    const content = ensureString((msg as any)?.content ?? (msg as any)?.message ?? "", "");
    const timestamp =
      parseDate((msg as any)?.timestamp ?? (msg as any)?.createdAt ?? (msg as any)?.created_at) ??
      new Date();
    const senderRaw = ensureString((msg as any)?.sender ?? (msg as any)?.role, "user").toLowerCase();

    return {
      id: ensureString((msg as any)?.id, `message-${index}`),
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

const normalizeStatus = (status: unknown): Conversation["status"] => {
  if (typeof status !== "string") return "completed";
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return "active";
  if (normalized.includes("archiv")) return "archived";
  return "completed";
};
