import { formatISO, parseISO } from "date-fns";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import type { UsageBucket, UsageMetrics, UsageStats, DailyUsage } from "@/types/usage";

const USAGE_API_BASE_URL = process.env.NEXT_PUBLIC_USAGE_API_BASE_URL || "https://simplyfire.ai/api/noilezer/usage";

type UnknownRecord = Record<string, unknown>;
type BucketCandidate = UnknownRecord & {
  label?: unknown;
  interval?: unknown;
  start?: unknown;
  from?: unknown;
  end?: unknown;
  to?: unknown;
  count?: unknown;
  questions?: unknown;
  total?: unknown;
  value?: unknown;
};

export const fetchUsageMetrics = async (
  from: Date,
  to: Date,
  signal?: AbortSignal
): Promise<UsageMetrics> => {
  const params = new URLSearchParams({
    from: formatISO(from, { representation: "date" }),
    to: formatISO(to, { representation: "date" }),
  });

  const response = await fetch(`${USAGE_API_BASE_URL}?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include", // Send session cookies
    cache: "no-store",
    signal,
  });

  if (response.status === 401) {
    // Authentication required - trigger login modal
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth:required");
      window.dispatchEvent(event);
    }
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    throw new Error(`Usage API responded with ${response.status}`);
  }

  const payload = await response.json();
  return normalizeUsagePayload(payload);
};

const normalizeUsagePayload = (payload: unknown): UsageMetrics => {
  const record = isRecord(payload) ? payload : {};
  const buckets = extractBuckets(record);

  const totalQuestions =
    readNumber(record.totalQuestions) ??
    readNumber(record.total) ??
    buckets.reduce((acc, bucket) => acc + bucket.count, 0);

  const avgQuestions =
    readNumber(record.avgQuestions) ??
    readNumber(record.averageQuestions) ??
    (buckets.length ? Math.round(totalQuestions / buckets.length) : 0);

  const peakBucket = buckets.reduce(
    (acc, bucket) => (bucket.count > acc.count ? bucket : acc),
    { label: "N/A", count: 0 }
  );

  const peakQuestions =
    readNumber(record.peakQuestions) ?? peakBucket.count;
  const peakDay =
    readString(record.peakDay) ?? peakBucket.label ?? "n/a";

  return {
    totalQuestions,
    avgQuestions,
    peakDay,
    peakQuestions,
    buckets,
  };
};

const extractBuckets = (payload: unknown): UsageBucket[] => {
  const record = isRecord(payload) ? payload : {};
  const candidateLists: unknown[] = [
    record.buckets,
    record.data,
    record.usage,
  ];

  if (Array.isArray(payload)) {
    candidateLists.push(payload);
  }

  const source =
    candidateLists.find((list): list is BucketCandidate[] => Array.isArray(list)) ?? [];

  return source
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const startLabel = readString(entry.start) ?? readString(entry.from);
      const endLabel = readString(entry.end) ?? readString(entry.to);
      const label =
        readString(entry.label) ??
        readString(entry.interval) ??
        buildRangeLabel(startLabel ?? undefined, endLabel ?? undefined);
      const count =
        readNumber(entry.count) ??
        readNumber(entry.questions) ??
        readNumber(entry.total) ??
        readNumber(entry.value) ??
        0;
      if (!label) return null;
      return { label, count };
    })
    .filter((entry): entry is UsageBucket => Boolean(entry));
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
};

const readString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const buildRangeLabel = (start?: string, end?: string): string | null => {
  try {
    if (start && end) {
      return `${format(new Date(start), "MMM dd", { locale: hu })} - ${format(
        new Date(end),
        "MMM dd",
        { locale: hu }
      )}`;
    }
    if (start) {
      return format(new Date(start), "MMM dd", { locale: hu });
    }
    if (end) {
      return format(new Date(end), "MMM dd", { locale: hu });
    }
    return null;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

/**
 * Lekéri a főoldalhoz szükséges statisztikákat (Párbeszédek és Üzenetek száma)
 * @param from Opcionális kezdő dátum az intervallumhoz
 * @param to Opcionális vég dátum az intervallumhoz
 * @param signal Opcionális AbortSignal a kérés megszakításához
 * @returns UsageStats objektum conversationCount (Párbeszédek) és messageCount (Üzenetek) értékekkel
 */
export const fetchUsageStats = async (
  from?: Date,
  to?: Date,
  signal?: AbortSignal
): Promise<UsageStats> => {
  // Query paraméterek összeállítása
  const params = new URLSearchParams();
  if (from) {
    params.append("from", formatISO(from, { representation: "date" }));
  }
  if (to) {
    params.append("to", formatISO(to, { representation: "date" }));
  }

  const url = params.toString() 
    ? `${USAGE_API_BASE_URL}?${params.toString()}`
    : USAGE_API_BASE_URL;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include", // Send session cookies
    cache: "no-store",
    signal,
  });

  if (response.status === 401) {
    // Authentication required - trigger login modal
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth:required");
      window.dispatchEvent(event);
    }
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    throw new Error(`Usage Stats API responded with ${response.status}`);
  }

  const payload = await response.json();
  
  // Normalizáljuk a választ, hogy biztosan tartalmazza a conversationCount és messageCount mezőket
  const record = isRecord(payload) ? payload : {};
  
  const conversationCount = readNumber(record.conversationCount) ?? 0;
  const messageCount = readNumber(record.messageCount) ?? 0;

  // Feldolgozzuk a napi bontású adatokat
  const dailyData: DailyUsage[] = [];
  
  // Végigmegyünk a rekord kulcsain és kinyerjük a dátumokat
  Object.keys(record).forEach((key) => {
    // Kihagyjuk az összesített mezőket
    if (key === "conversationCount" || key === "messageCount") {
      return;
    }
    
    // Ellenőrizzük, hogy dátum formátumú-e (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(key)) {
      const dayRecord = record[key];
      if (isRecord(dayRecord)) {
        const conversations = readNumber(dayRecord.new) ?? 0;
        const messages = readNumber(dayRecord.total) ?? 0;
        
        dailyData.push({
          date: key,
          conversations,
          messages,
        });
      }
    }
  });
  
  // Rendezzük dátum szerint növekvő sorrendben
  dailyData.sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  return {
    conversationCount,
    messageCount,
    dailyData,
  };
};




