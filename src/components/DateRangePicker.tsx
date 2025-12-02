"use client";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export default function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const today = new Date();
  // Alapértelmezett érték: mai nap kezdete és vége
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [open, setOpen] = useState(false);

  // Alapértelmezett érték küldése a szülő komponensnek komponens mountolásakor
  useEffect(() => {
    onDateRangeChange(today, today);
  }, []); // Üres dependency array = csak egyszer fut le mountoláskor

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    // Ne záródjon be automatikusan, csak az OK gombbal
  };

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      onDateRangeChange(dateRange.from, dateRange.to);
      setOpen(false);
    }
  };

  // Gomb szövegének formázása
  const getButtonText = () => {
    if (!dateRange?.from) {
      return "Válassz dátumot";
    }
    if (dateRange.from && dateRange.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        // Ugyanaz a dátum
        return format(dateRange.from, "PPP", { locale: hu });
      } else {
        // Különböző dátumok
        return `${format(dateRange.from, "PPP", { locale: hu })} - ${format(dateRange.to, "PPP", { locale: hu })}`;
      }
    } else {
      // Csak kezdő dátum van kiválasztva
      return `Válassz végső dátumot: ${format(dateRange.from, "PPP", { locale: hu })}`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full">
          <CalendarIcon />
          {getButtonText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto max-w-[95vw] sm:max-w-[350px]" align="start" side="bottom">
        <Calendar
          selected={dateRange}
          onSelect={handleDateRangeSelect}
          locale={hu}
        />
        <div className="p-3 border-t flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={!dateRange?.from || !dateRange?.to}
            size="sm"
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
