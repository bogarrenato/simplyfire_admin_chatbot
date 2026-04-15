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
  startDate?: Date;
  endDate?: Date;
  className?: string;
}

export default function DateRangePicker({ 
  onDateRangeChange, 
  startDate: externalStartDate,
  endDate: externalEndDate 
}: DateRangePickerProps) {
  const today = new Date();
  const initialStartDate = externalStartDate || today;
  const initialEndDate = externalEndDate || today;
  
  // Alapértelmezett érték: külső prop-ból vagy mai nap
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStartDate,
    to: initialEndDate,
  });
  const [open, setOpen] = useState(false);

  // Szinkronizáljuk a külső dátum változásokat
  useEffect(() => {
    if (externalStartDate && externalEndDate) {
      setDateRange({
        from: externalStartDate,
        to: externalEndDate,
      });
    }
  }, [externalStartDate, externalEndDate]);

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
          mode="range"
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
