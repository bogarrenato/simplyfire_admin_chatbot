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




