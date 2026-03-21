import { useEffect, useRef, useState } from "react";
type IdleOptions = { timeoutMs?: number };
const DEFAULT_TIMEOUT = 30_000;
export function useIdleTimer({ timeoutMs = DEFAULT_TIMEOUT}: IdleOptions = {}){
    const [isIdle, setIsIdle] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const reset = () => {
        if(timerRef.current) clearTimeout(timerRef.current);
        setIsIdle(false);
        timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);

    };
    useEffect(() => {
        const onActivity = () => reset();

        window.addEventListener("mousemove", onActivity);
        window.addEventListener("mousedown", onActivity);
        window.addEventListener("keydown", onActivity);
        window.addEventListener("touchstart", onActivity);
        reset();

        return() => {
            ["mousemove", "mousedown", "keydown", "touchstart"].forEach((event) => window.removeEventListener(event, onActivity));
            if(timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeoutMs]);
    return{isIdle, reset};

}