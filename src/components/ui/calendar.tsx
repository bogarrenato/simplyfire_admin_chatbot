"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

/**
 * Generikus Calendar wrapper a react-day-picker v9-hez.
 *
 * A v9 a gyoker elemre automatikusan rateszi az `rdp-root` osztalyt,
 * a stilusozas a globals.css-ben tortenik (tema-tudatos, range-lathato).
 * NEM hasznalunk v8-as classNames kulcsokat (day_today / nav_button) —
 * azok v9-ben mar nem leteznek, ezert a regi verzioban nem is ervenyesultek.
 *
 * Hasznalhato mode="single" | "range" | "multiple" modokkal.
 */
export function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      animate
      showOutsideDays
      {...props}
      classNames={{
        ...(props.classNames ?? {}),
      }}
    />
  );
}
