"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export default function DateRangePicker({ onDateRangeChange, className }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(undefined);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, "MMM dd", { locale: hu })} - ${format(endDate, "MMM dd, yyyy", { locale: hu })}`;
    } else if (startDate) {
      return format(startDate, "MMM dd, yyyy", { locale: hu });
    }
    return "Idő kiválasztása";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:max-w-[280px] justify-start text-left font-normal text-sm",
            !startDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] p-0 sm:w-auto sm:max-w-[95vw] md:max-w-[600px]" 
        align="start" 
        side="bottom"
      >
        <div className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {/* Mobile: Single column, Desktop: Two columns side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Kezdő dátum kiválasztása</h4>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  locale={hu}
                />
              </div>
              {startDate && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Végdátum kiválasztása</h4>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border w-full"
                    disabled={(date) => date < startDate}
                    locale={hu}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                Mégse
              </Button>
              <Button 
                size="sm" 
                onClick={handleApply} 
                disabled={!startDate || !endDate}
                className="w-full sm:w-auto"
              >
                Alkalmaz
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
