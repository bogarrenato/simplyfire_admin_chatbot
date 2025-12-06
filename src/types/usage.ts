export interface UsageBucket {
  label: string;
  count: number;
}

export interface UsageMetrics {
  totalQuestions: number;
  avgQuestions: number;
  peakDay: string;
  peakQuestions: number;
  buckets: UsageBucket[];
}

// Napi bontású adat egy dátumhoz
export interface DailyUsage {
  date: string;  // Dátum ISO formátumban (pl. "2025-11-17")
  conversations: number;  // Új beszélgetések száma aznap
  messages: number;  // Üzenetek száma aznap
}

// Új API válasz típus a főoldalhoz
export interface UsageStats {
  conversationCount: number;  // Összes párbeszédek száma
  messageCount: number;      // Összes üzenetek száma
  dailyData: DailyUsage[];    // Napi bontású adatok
}




