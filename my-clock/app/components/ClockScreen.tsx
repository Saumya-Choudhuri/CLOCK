"use client";

import { useEffect, useState } from "react";
function pad(num: number) {
    return num.toString().padStart(2, "0");
}

export default function ClockScreen() {
    const [now, setNow] = useState(new Date());
    useEffect(()=>{
        const id = setInterval(() => setNow(new Date()), 1000);
        return ()=> clearInterval(id);
    },[]);
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const dateString = now.toLocaleDateString(undefined, {weekday: "short", month: "short", day:"numeric", year: "numeric",});
     return (
     <div className="relative flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent_40%)]" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(56,189,248,0.08),transparent_45%)] blur-3xl" />
       <div className="relative text-center space-y-4">
         <div className="text-7xl md:text-8xl font-semibold tracking-tight">
           {hours}:{minutes}
           <span className="text-slate-400">:{seconds}</span>
         </div>
         <div className="text-lg text-slate-300">{dateString}</div>
       </div>
     </div>
   );

}