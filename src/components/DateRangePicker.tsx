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
    return "Dátum intervallum kiválasztása";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !startDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Kezdő dátum kiválasztása</h4>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </div>
            {startDate && (
              <div>
                <h4 className="font-medium text-sm mb-2">Végdátum kiválasztása</h4>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  disabled={(date) => date < startDate}
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Mégse
              </Button>
              <Button onClick={handleApply} disabled={!startDate || !endDate}>
                Alkalmaz
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
