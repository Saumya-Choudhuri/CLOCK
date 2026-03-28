"use client";

import ClockScreen from "./components/ClockScreen";
import { useIdleTimer } from "./hooks/useIdleTimer";

export default function Home(){
  const { isIdle } = useIdleTimer({ timeoutMs: 30_000});

  return(
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-8">
        <h1 className="text-2xl front-bold">Dashboard</h1>
        <p className="text-slate-600 mt-2">

        </p>
      </div>

      {isIdle && (
        <div className="fixed inset-0 z-50">
          <ClockScreen />
        </div>
      )}
    </main>
  );
}