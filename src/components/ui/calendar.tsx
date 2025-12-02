"use client";

import { DayPicker, DateRange } from "react-day-picker";
import type { Locale } from "date-fns";
import "react-day-picker/style.css";

interface CalendarProps {
  selected?: DateRange | undefined;
  onSelect?: (range: DateRange | undefined) => void;
  locale?: Locale;
}

export function Calendar({ selected, onSelect, locale }: CalendarProps) {
  return (
    <div className="rdp-root">
      <DayPicker
        animate
        mode="range"
        selected={selected}
        onSelect={onSelect}
        locale={locale}
        footer={
          selected?.from ? (
            selected.to ? (
              <>
                {selected.from.toLocaleDateString()} - {selected.to.toLocaleDateString()}
              </>
            ) : (
              <>Selected: {selected.from.toLocaleDateString()}</>
            )
          ) : (
            "Pick a range."
          )
        }
        classNames={{
          day_today: "bg-accent !text-foreground dark:!text-white",
          nav_button: "!text-foreground dark:!text-white hover:opacity-100 [&_svg]:!text-foreground dark:[&_svg]:!text-white [&_svg_path]:!stroke-foreground dark:[&_svg_path]:!stroke-white",
        }}
      />
    </div>
  );
}
