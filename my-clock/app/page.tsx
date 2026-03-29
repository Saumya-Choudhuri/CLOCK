"use client";

import { useMemo, useState } from "react";
import ClockPanel from "./sections/ClockPanel";
import CounterPanel from "./sections/CounterPanel";
import ProgressPanel from "./sections/ProgressPanel";

type Tab = "clock" | "counter" | "progress";

export default function Home() {
  const [tab, setTab] = useState<Tab>("clock");

  const title = useMemo(() => {
    if (tab === "clock") return "Clock";
    if (tab === "counter") return "Counter / Timer";
    return "Progress Tracker";
  }, [tab]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold">{title}</h1>

        <div className="mt-4 flex gap-2">
          <button
            className={`px-3 py-2 rounded border ${
              tab === "clock" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("clock")}
          >
            Clock
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "counter" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("counter")}
          >
            Counter
          </button>

          <button
            className={`px-3 py-2 rounded border ${
              tab === "progress" ? "bg-slate-900 text-white" : "bg-white"
            }`}
            onClick={() => setTab("progress")}
          >
            Progress
          </button>
        </div>
      </header>

      <section className="p-6">
        {tab === "clock" && <ClockPanel />}
        {tab === "counter" && <CounterPanel />}
        {tab === "progress" && <ProgressPanel />}
      </section>
    </main>
  );
}