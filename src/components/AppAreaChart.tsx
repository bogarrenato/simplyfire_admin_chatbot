"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import DateRangePicker from "./DateRangePicker";
import { subDays, parseISO, format } from "date-fns";
import { hu } from "date-fns/locale";
import type { UsageStats } from "@/types/usage";
import { fetchUsageStats } from "@/services/usage-service";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const AppAreaChart = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const controller = new AbortController();
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsageStats(
          startDate,
          endDate,
          controller.signal
        );
        setStats(data);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load usage stats", err);
        setError(
          "Nem sikerült betölteni az üzenetek adatait. Próbáld újra később."
        );
        setStats(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadStats();
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
  ];

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    handleDateRangeChange(start, end);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
        <h1 className="text-lg font-medium">Üzenetek száma</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.days}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRange(range.days)}
                className="text-xs flex-1 sm:flex-initial min-w-0"
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="w-full sm:w-auto">
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </div>
        </div>
      </div>

      {loading ? (
        <StatsSkeleton />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : stats ? (
        <div className="space-y-4">
          {/* Összesített szám */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">
                {stats.messageCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Összes üzenet</p>
            </div>
          </div>
          
          {/* Napi bontású grafikon */}
          {stats.dailyData && stats.dailyData.length > 0 && (
            <div className="mt-6">
              <ChartContainer
                config={{
                  messages: {
                    label: "Üzenetek",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <AreaChart
                  data={stats.dailyData.map((day) => ({
                    date: format(parseISO(day.date), "MMM dd", { locale: hu }),
                    messages: day.messages,
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-messages)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-messages)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--color-messages)"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const StatsSkeleton = () => (
  <div className="flex items-center justify-center">
    <div className="text-center space-y-2">
      <Skeleton className="mx-auto h-12 w-32" />
      <Skeleton className="mx-auto h-4 w-24" />
    </div>
  </div>
);

export default AppAreaChart;
