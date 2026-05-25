"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

interface ClockScreenProps {
  theme?: "light" | "dark";
  timeFormat?: "12h" | "24h";
}

export default function ClockScreen({ theme = "light", timeFormat = "24h" }: ClockScreenProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    setNow(new Date()); // set initial time only on client
    return () => clearInterval(t);
  }, []);

  const timeDisplay = useMemo(() => {
    if (!now) {
      return { time: "--:--:--", period: "" };
    }

    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    if (timeFormat === "12h") {
      const displayHours = ((h + 11) % 12) + 1;
      const period = h >= 12 ? "PM" : "AM";
      return { time: `${pad(displayHours)}:${pad(m)}:${pad(s)}`, period };
    }

    return { time: `${pad(h)}:${pad(m)}:${pad(s)}`, period: "" };
  }, [now, timeFormat]);

  const date = useMemo(() => {
    if (!now) return "Loading date...";
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  const timeColor = theme === "light" ? "var(--clock-ink)" : "var(--clock-ink-inverse)";
  const dateColor = theme === "light" ? "var(--clock-subtle)" : "var(--clock-subtle-inverse)";

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="text-7xl md:text-8xl clock-font font-semibold tabular-nums time-glow"
          style={{
            color: timeColor,
          }}
        >
          {timeDisplay.time}
          {timeDisplay.period && (
            <span className="ml-3 text-base md:text-lg uppercase tracking-[0.25em]">
              {timeDisplay.period}
            </span>
          )}
        </div>
        <div
          className="mt-4 text-xs uppercase tracking-[0.25em]"
          style={{
            color: dateColor,
          }}
        >
          {date}
        </div>
      </div>
    </div>
  );
}