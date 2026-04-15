"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

/**
 * Generikus Calendar wrapper — továbbadja a DayPicker összes propsát.
 * Használható mode="single", mode="range" és mode="multiple" módokkal egyaránt.
 *
 * A korábbi verzió hardkódolva range módban volt, ami a single mode-ot használó
 * hívóknál (pl. TodoList.tsx) TypeScript hibát okozott.
 */
export function Calendar(props: DayPickerProps) {
  return (
    <div className="rdp-root">
      <DayPicker
        animate
        {...props}
        classNames={{
          day_today: "bg-accent !text-foreground dark:!text-white",
          nav_button:
            "!text-foreground dark:!text-white hover:opacity-100 [&_svg]:!text-foreground dark:[&_svg]:!text-white [&_svg_path]:!stroke-foreground dark:[&_svg_path]:!stroke-white",
          ...(props.classNames ?? {}),
        }}
      />
    </div>
  );
}
