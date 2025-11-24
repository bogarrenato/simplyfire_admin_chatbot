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

// Új API válasz típus a főoldalhoz
export interface UsageStats {
  conversationCount: number;  // Párbeszédek száma
  messageCount: number;      // Üzenetek száma
}




