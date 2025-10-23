import { format, eachDayOfInterval, subDays, addDays } from "date-fns";
import { hu } from "date-fns/locale";

export interface RevenueData {
  month: string;
  desktop: number;
  mobile: number;
  date: string;
}

export interface ChartData {
  month: string;
  questions: number;
}

// Generate dummy questions data based on date range
export function generateRevenueData(startDate: Date, endDate: Date): ChartData[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const data: ChartData[] = [];
  
  // Calculate date range in days
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 7) {
    // Last 7 days: daily breakdown
    days.forEach(day => {
      const questions = Math.floor(Math.random() * 50) + 10; // 10-60 questions per day
      data.push({
        month: format(day, "MMM dd", { locale: hu }),
        questions: questions
      });
    });
  } else if (totalDays <= 30) {
    // Last 30 days: daily breakdown
    days.forEach(day => {
      const questions = Math.floor(Math.random() * 50) + 10; // 10-60 questions per day
      data.push({
        month: format(day, "MMM dd", { locale: hu }),
        questions: questions
      });
    });
  } else if (totalDays <= 90) {
    // Last 90 days: 10-day intervals
    const intervalDays = 10;
    for (let i = 0; i < days.length; i += intervalDays) {
      const intervalEnd = Math.min(i + intervalDays, days.length);
      const intervalStart = days[i];
      const intervalEndDate = days[intervalEnd - 1];
      
      let totalQuestions = 0;
      for (let j = i; j < intervalEnd; j++) {
        totalQuestions += Math.floor(Math.random() * 50) + 10;
      }
      
      data.push({
        month: `${format(intervalStart, "MMM dd", { locale: hu })} - ${format(intervalEndDate, "MMM dd", { locale: hu })}`,
        questions: totalQuestions
      });
    }
  } else {
    // Full year: monthly breakdown
    const monthlyData: { [key: string]: { questions: number; count: number } } = {};
    
    days.forEach(day => {
      const monthKey = format(day, "MMMM", { locale: hu });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { questions: 0, count: 0 };
      }
      
      const questions = Math.floor(Math.random() * 50) + 10;
      monthlyData[monthKey].questions += questions;
      monthlyData[monthKey].count += 1;
    });
    
    Object.entries(monthlyData).forEach(([month, monthData]) => {
      data.push({
        month,
        questions: Math.round(monthData.questions / monthData.count)
      });
    });
  }
  
  return data;
}

// Generate daily revenue data
export function generateDailyRevenueData(startDate: Date, endDate: Date): RevenueData[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map(day => {
    const baseRevenue = 50 + Math.random() * 200;
    const desktopRevenue = baseRevenue + (Math.random() * 100 - 50);
    const mobileRevenue = baseRevenue * 0.6 + (Math.random() * 50 - 25);
    
    return {
      month: format(day, "MMM dd"),
      desktop: Math.max(0, Math.round(desktopRevenue)),
      mobile: Math.max(0, Math.round(mobileRevenue)),
      date: format(day, "yyyy-MM-dd")
    };
  });
}

// Generate summary statistics
export function generateRevenueStats(data: ChartData[]) {
  const totalQuestions = data.reduce((sum, item) => sum + item.questions, 0);
  const avgQuestions = Math.round(totalQuestions / data.length);
  
  const peakDay = data.reduce((peak, item) => {
    return item.questions > peak.total ? { month: item.month, total: item.questions } : peak;
  }, { month: "", total: 0 });
  
  return {
    totalQuestions,
    avgQuestions,
    peakDay: peakDay.month,
    peakQuestions: peakDay.total
  };
}
