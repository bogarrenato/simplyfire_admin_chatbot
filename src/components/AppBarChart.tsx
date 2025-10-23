"use client";
import { useState, useEffect } from "react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import DateRangePicker from "./DateRangePicker";
import { generateRevenueData, generateRevenueStats, type ChartData } from "@/lib/data-generator";
import { format, subDays } from "date-fns";

const chartConfig = {
  questions: {
    label: "Kérdezések",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppBarChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    generateData(startDate, endDate);
  }, []);

  const generateData = async (start: Date, end: Date) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = generateRevenueData(start, end);
    const statistics = generateRevenueStats(data);
    setChartData(data);
    setStats(statistics);
    setLoading(false);
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    generateData(start, end);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Kérdezések száma</h1>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
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
          </div>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalQuestions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Összes kérdés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.avgQuestions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Átlagos kérdések</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.peakQuestions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Csúcs nap ({stats.peakDay})</p>
              </div>
            </div>
          )}
          
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="questions" fill="var(--color-questions)" radius={4} />
            </BarChart>
          </ChartContainer>
        </>
      )}
    </div>
  );
};

export default AppBarChart;
