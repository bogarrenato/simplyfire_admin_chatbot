"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DateRangePicker from "./DateRangePicker";
import { formatISO, subDays } from "date-fns";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

type ChartDataPoint = {
  label: string;
  questions: number;
};

interface UsageMetrics {
  totalQuestions: number;
  avgQuestions: number;
  peakDay: string;
  peakQuestions: number;
  buckets: Array<{ label: string; count: number }>;
}

const USAGE_API_BASE_URL =
  "https://simplyfire.ai:5001/api/noilezer/usage";

const chartConfig = {
  questions: {
    label: "Kérdezések",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppBarChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const controller = new AbortController();
    const loadUsage = async () => {
      setLoading(true);
      setError(null);
      try {
        const metrics = await fetchUsageMetrics(startDate, endDate, controller.signal);
        setStats(metrics);
        setChartData(
          metrics.buckets.map((bucket) => ({
            label: bucket.label,
            questions: bucket.count,
          }))
        );
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load usage metrics", err);
        setError("Nem sikerült betölteni a kérdezések adatait. Próbáld újra később.");
        setStats(null);
        setChartData([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadUsage();
    return () => controller.abort();
  }, [startDate, endDate]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    const normalizedStart = start <= end ? start : end;
    const normalizedEnd = end >= start ? end : start;
    setStartDate(normalizedStart);
    setEndDate(normalizedEnd);
  };

  const quickRanges = [
    { label: "Elmúlt 7 nap", days: 7 },
    { label: "Elmúlt 30 nap", days: 30 },
    { label: "Elmúlt 90 nap", days: 90 },
    { label: "Elmúlt év", days: 365 },
  ];

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    handleDateRangeChange(start, end);
  };

  const showPlaceholder = loading && chartData.length === 0;
  const hasData = chartData.length > 0;
  const formattedPeakLabel = useMemo(() => {
    if (!stats) return "";
    return stats.peakDay;
  }, [stats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap">
        <h1 className="text-lg font-medium">Kérdezések száma</h1>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.days}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRange(range.days)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </div>
        </div>
      </div>

      {showPlaceholder ? (
        <>
          <StatsSkeleton />
          <ChartSkeleton />
        </>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.totalQuestions.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Összes kérdés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.avgQuestions.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Átlagos kérdések
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.peakQuestions.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Csúcs nap ({formattedPeakLabel})
                </p>
              </div>
            </div>
          )}

          {hasData ? (
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <YAxis tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="questions"
                  fill="var(--color-questions)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 text-sm text-muted-foreground">
              Nincs adat az adott időszakra.
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
};

const fetchUsageMetrics = async (
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
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Usage API responded with ${response.status}`);
  }

  const payload = await response.json();
  return normalizeUsagePayload(payload);
};

const normalizeUsagePayload = (payload: unknown): UsageMetrics => {
  const buckets = extractBuckets(payload);
  const totalQuestions =
    readNumber((payload as any)?.totalQuestions) ??
    readNumber((payload as any)?.total) ??
    buckets.reduce((acc, bucket) => acc + bucket.count, 0);

  const avgQuestions =
    readNumber((payload as any)?.avgQuestions) ??
    readNumber((payload as any)?.averageQuestions) ??
    (buckets.length ? Math.round(totalQuestions / buckets.length) : 0);

  const peakBucket = buckets.reduce(
    (acc, bucket) => (bucket.count > acc.count ? bucket : acc),
    { label: "N/A", count: 0 }
  );

  const peakQuestions =
    readNumber((payload as any)?.peakQuestions) ?? peakBucket.count;
  const peakDay =
    readString((payload as any)?.peakDay) ?? peakBucket.label ?? "n/a";

  return {
    totalQuestions,
    avgQuestions,
    peakDay,
    peakQuestions,
    buckets,
  };
};

const extractBuckets = (payload: any): Array<{ label: string; count: number }> => {
  const candidateLists = [
    payload?.buckets,
    payload?.data,
    payload?.usage,
    Array.isArray(payload) ? payload : null,
  ];

  const source = candidateLists.find(Array.isArray) ?? [];
  return source
    .map((entry: any) => {
      if (typeof entry !== "object" || entry === null) return null;
      const label =
        readString(entry.label) ??
        readString(entry.interval) ??
        buildRangeLabel(entry.start ?? entry.from, entry.end ?? entry.to);
      const count =
        readNumber(entry.count) ??
        readNumber(entry.questions) ??
        readNumber(entry.total) ??
        readNumber(entry.value) ??
        0;
      if (!label) return null;
      return { label, count };
    })
    .filter((entry): entry is { label: string; count: number } => Boolean(entry));
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

const StatsSkeleton = () => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    {[0, 1, 2].map((index) => (
      <div key={index} className="text-center space-y-2">
        <Skeleton className="mx-auto h-7 w-16" />
        <Skeleton className="mx-auto h-4 w-24" />
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="flex min-h-[220px] items-end justify-between gap-4 rounded-lg border border-dashed border-muted-foreground/20 p-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        className="h-[160px] w-full rounded-sm"
        style={{ animationDelay: `${index * 150}ms` }}
      />
    ))}
  </div>
);

export default AppBarChart;
