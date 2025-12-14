"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import DateRangePicker from "./DateRangePicker";
import { subDays, parseISO, format } from "date-fns";
import { hu } from "date-fns/locale";
import type { UsageStats } from "@/types/usage";
import { fetchUsageStats } from "@/services/usage-service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const AppBarChart = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeQuickRange, setActiveQuickRange] = useState<number | null>(30); // Alapértelmezetten 30 nap aktív

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
          "Nem sikerült betölteni a párbeszédek adatait. Próbáld újra később."
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
    
    // Ellenőrizzük, hogy egy quick range-e az új dátum
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const startDateOnly = new Date(normalizedStart);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(normalizedEnd);
    endDateOnly.setHours(23, 59, 59, 999);
    
    // Számoljuk ki a napok számát (inkluzív)
    const diffDays = Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Ellenőrizzük, hogy a végdátum ma van-e (nap szinten)
    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);
    const endDateOnlyCheck = new Date(normalizedEnd);
    endDateOnlyCheck.setHours(0, 0, 0, 0);
    const isToday = endDateOnlyCheck.getTime() === todayOnly.getTime();
    
    // Ellenőrizzük, hogy a kezdő dátum is megfelelő-e
    const expectedStart7 = subDays(todayOnly, 6);
    expectedStart7.setHours(0, 0, 0, 0);
    const expectedStart30 = subDays(todayOnly, 29);
    expectedStart30.setHours(0, 0, 0, 0);
    
    const startMatches7 = startDateOnly.getTime() === expectedStart7.getTime();
    const startMatches30 = startDateOnly.getTime() === expectedStart30.getTime();
    
    if (diffDays === 7 && isToday && startMatches7) {
      setActiveQuickRange(7);
    } else if (diffDays === 30 && isToday && startMatches30) {
      setActiveQuickRange(30);
    } else {
      setActiveQuickRange(null); // Egyedi dátum választás
    }
  };

  const quickRanges = [
    { label: "Elmúlt 7 nap", days: 7 },
    { label: "Elmúlt 30 nap", days: 30 },
  ];

  const handleQuickRange = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // Végig a nap végéig
    const start = subDays(end, days - 1);
    start.setHours(0, 0, 0, 0); // A nap elejétől
    setStartDate(start);
    setEndDate(end);
    setActiveQuickRange(days); // Aktívvá tesszük a quick range gombot
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
        <h1 className="text-lg font-medium">Párbeszédek száma</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.days}
                variant={activeQuickRange === range.days ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRange(range.days)}
                className="text-xs flex-1 sm:flex-initial min-w-0"
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="w-full sm:w-auto">
            <DateRangePicker 
              onDateRangeChange={handleDateRangeChange}
              startDate={startDate}
              endDate={endDate}
            />
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
                {stats.conversationCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Összes párbeszéd
              </p>
            </div>
          </div>
          
          {/* Napi bontású grafikon */}
          {stats.dailyData && stats.dailyData.length > 0 && (
            <div className="mt-6">
              <ChartContainer
                config={{
                  conversations: {
                    label: "Párbeszédek",
                    theme: {
                      light: "oklch(0.15 0.1 41.116)",
                      dark: "hsl(0 0% 90%)",
                    },
                  },
                }}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={stats.dailyData.map((day) => ({
                    date: format(parseISO(day.date), "MMM dd", { locale: hu }),
                    conversations: day.conversations,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
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
                  <Bar
                    dataKey="conversations"
                    fill="var(--color-conversations)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
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

export default AppBarChart;
