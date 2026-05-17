"use client";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
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
  endDate: externalEndDate,
}: DateRangePickerProps) {
  const today = new Date();
  const initialStartDate = externalStartDate || today;
  const initialEndDate = externalEndDate || today;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStartDate,
    to: initialEndDate,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (externalStartDate && externalEndDate) {
      setDateRange({ from: externalStartDate, to: externalEndDate });
    }
  }, [externalStartDate, externalEndDate]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      onDateRangeChange(dateRange.from, dateRange.to);
      setOpen(false);
    }
  };

  const fmt = (d: Date) => format(d, "yyyy. MMM d.", { locale: hu });

  // A trigger gomb szovege
  const getButtonText = () => {
    if (dateRange?.from && dateRange?.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        return fmt(dateRange.from);
      }
      return `${fmt(dateRange.from)} – ${fmt(dateRange.to)}`;
    }
    if (dateRange?.from) return `${fmt(dateRange.from)} – …`;
    return "Válassz időszakot";
  };

  // A popover tetejen megjeleno allapot-jelzo: pontosan mutatja mi tortenik
  const getStatus = (): { label: string; hint: string } => {
    if (!dateRange?.from) {
      return { label: "1/2 — Kezdő dátum", hint: "Kattints a kezdő napra" };
    }
    if (dateRange.from && !dateRange.to) {
      return {
        label: "2/2 — Záró dátum",
        hint: `Kezdő: ${fmt(dateRange.from)} · most a záró napot válaszd`,
      };
    }
    const days =
      dateRange.from && dateRange.to
        ? differenceInCalendarDays(dateRange.to, dateRange.from) + 1
        : 0;
    return {
      label: `${fmt(dateRange.from!)} – ${fmt(dateRange.to!)}`,
      hint: `${days} nap kiválasztva · "Alkalmaz" a megerősítéshez`,
    };
  };

  const status = getStatus();
  const rangeComplete = Boolean(dateRange?.from && dateRange?.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 font-normal">
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">{getButtonText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto max-w-[95vw] overflow-hidden"
        align="start"
        side="bottom"
      >
        {/* Allapot fejlec — mindig latszik mi a teendo / mi van kivalasztva */}
        <div className="px-4 py-3 border-b bg-muted/40">
          <div className="text-sm font-semibold text-foreground">
            {status.label}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {status.hint}
          </div>
        </div>

        <div className="p-2">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            locale={hu}
            numberOfMonths={1}
            defaultMonth={dateRange?.from}
          />
        </div>

        <div className="px-3 py-3 border-t flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange(undefined)}
            disabled={!dateRange?.from}
          >
            Törlés
          </Button>
          <Button onClick={handleConfirm} disabled={!rangeComplete} size="sm">
            Alkalmaz
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
