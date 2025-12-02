"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import DateRangePicker from "./DateRangePicker";
import { subDays } from "date-fns";
import type { UsageStats } from "@/types/usage";
import { fetchUsageStats } from "@/services/usage-service";

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
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">
              {stats.messageCount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Összes üzenet</p>
          </div>
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
