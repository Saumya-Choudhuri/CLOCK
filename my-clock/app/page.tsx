"use client";

import { useEffect, useState } from "react";
import ClockPanel from "./sections/ClockPanel";
import CounterPanel from "./sections/CounterPanel";
import AnalyticsPanel from "./sections/AnalyticsPanel";
import TasksPanel from "./sections/TasksPanel";
import { UserHeader } from "./components/UserHeader";
import { useAuth } from "./context/AuthContext";
import { useAuthModal } from "./context/AuthModalContext";
import { startRazorpayCheckout } from "./utils/razorpayCheckout";
import { PaymentModal } from "./components/PaymentModal";

type Tab = "clock" | "counter" | "analytics" | "tasks";
type ClockFont = "display" | "grotesk" | "sora" | "mono";
type TimeFormat = "12h" | "24h";

export default function Home() {
  const { user, userData, checkFreeTrial, checkPremiumAccess, activateMonthlyPremium } = useAuth();
  const { openLogin } = useAuthModal();
  const [tab, setTab] = useState<Tab>("clock");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundType, setBackgroundType] = useState<"image" | "video" | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.6);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [clockFont, setClockFont] = useState<ClockFont>("sora");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24h");
  const lockedTabs: Tab[] = ["counter", "tasks", "analytics"];
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const isTabLocked = (target: Tab) => {
    if (!lockedTabs.includes(target)) return false;
    if (!user) return true;
    return !checkFreeTrial() && !checkPremiumAccess();
  };

  const handleOpenPaymentModal = async () => {
    if (!user) return;
    setUpgradeError("");
    setUpgradeLoading(true);
    try {
      const orderData = await startRazorpayCheckout({
        uid: user.uid,
        email: user.email || undefined,
        username: userData?.username || undefined,
      });
      setRazorpayOrder(orderData);
      setShowPaymentModal(true);
    } catch (error: any) {
      setUpgradeError(error?.message || "Unable to start checkout.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, orderId: string) => {
    try {
      setUpgradeLoading(true);
      const response = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Payment verification failed.");
      }
      await activateMonthlyPremium();
      setShowPaymentModal(false);
      setRazorpayOrder(null);
    } catch (error: any) {
      setUpgradeError(error?.message || "Payment verification failed.");
    } finally {
      setUpgradeLoading(false);
    }
  };
  
  // Progress tracking
  const [currentProgressTask] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function handleBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    
    console.log("Background file set:", objectUrl, "Type:", isVideo ? "video" : "image");
    setBackgroundUrl(objectUrl);
    setBackgroundType(isVideo ? "video" : "image");
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_overlay_opacity");
      if (saved) {
        setOverlayOpacity(Number(saved));
      }
    } catch (error) {
      console.error("Failed to load overlay opacity:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_overlay_opacity", String(overlayOpacity));
    } catch (error) {
      console.error("Failed to save overlay opacity:", error);
    }
  }, [overlayOpacity]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_background_opacity");
      if (saved) {
        setBackgroundOpacity(Number(saved));
      }
    } catch (error) {
      console.error("Failed to load background opacity:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_background_opacity", String(backgroundOpacity));
    } catch (error) {
      console.error("Failed to save background opacity:", error);
    }
  }, [backgroundOpacity]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_theme");
      if (saved) {
        setTheme(saved as "light" | "dark");
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_theme", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    if (document.body) {
      document.body.dataset.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_font");
      if (saved) {
        setClockFont(saved as ClockFont);
      }
    } catch (error) {
      console.error("Failed to load clock font:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_font", clockFont);
    } catch (error) {
      console.error("Failed to save clock font:", error);
    }
  }, [clockFont]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("clock_time_format");
      if (saved === "12h" || saved === "24h") {
        setTimeFormat(saved);
      }
    } catch (error) {
      console.error("Failed to load time format:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("clock_time_format", timeFormat);
    } catch (error) {
      console.error("Failed to save time format:", error);
    }
  }, [timeFormat]);

  const renderLockedPanel = (title: string, message: string) => {
    const isTrialOver = user && !checkFreeTrial() && !checkPremiumAccess();

    return (
      <div className="panel-surface mx-auto max-w-md p-6 text-center space-y-4">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)]">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[color:var(--foreground)]">
            {isTrialOver ? `${title.replace("locked", "Expired")}` : title}
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            {isTrialOver
              ? "Your free trial has ended. Upgrade to Premium Pro to continue using this feature."
              : message}
          </p>
        </div>
        {isTrialOver ? (
          <button
            onClick={handleOpenPaymentModal}
            disabled={upgradeLoading}
            className="btn btn-primary px-5 py-2 text-sm"
          >
            {upgradeLoading ? "Loading..." : "Upgrade to Pro"}
          </button>
        ) : (
          <button onClick={openLogin} className="btn btn-primary px-5 py-2 text-sm">
            Sign in to unlock
          </button>
        )}
        {isTrialOver && upgradeError && (
          <p className="text-xs text-[color:var(--foreground)] mt-2 bg-[rgba(224,122,95,0.12)] border border-[rgba(224,122,95,0.35)] rounded-xl py-2 px-3">{upgradeError}</p>
        )}
      </div>
    );
  };

  return (
    <main
      className="min-h-screen premium-bg text-[color:var(--foreground)]"
      data-clock-font={clockFont}
    >
      <div className="ambient-orbs" aria-hidden="true" />
      <div className="relative z-10">
        <div className="banner-shell relative z-50">
          <header className="premium-header relative z-50 overflow-visible">
            <div className="app-shell py-10 md:py-12 flex flex-col gap-6">
              <div className="flex flex-wrap items-start gap-6">
                <div className="flex items-center gap-4 animate-rise stagger-1">
                  <div className="h-12 w-12 rounded-[16px] bg-[color:var(--foreground)] text-[color:var(--accent)] shadow-[0_10px_26px_rgba(13,15,18,0.25)] flex items-center justify-center">
                    <svg
                      viewBox="0 0 48 48"
                      className="h-7 w-7"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="17"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        opacity="0.55"
                      />
                      <path
                        d="M16 17h16L16 31h16"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[color:var(--muted)]">
                      Precision Studio
                    </p>
                    <h1 className="text-3xl md:text-4xl font-display title-glow">Zoned</h1>
                    <p className="text-sm text-[color:var(--muted)]">
                      Time, tasks, and focus in one calm system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="app-shell pb-2 relative z-40 banner-reveal">
            <div className="panel-surface px-4 py-3 md:px-6 md:py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-rise stagger-3">
              <nav className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="tab-pill"
                  data-active={tab === "clock"}
                  onClick={() => setTab("clock")}
                >
                  Zoned
                </button>

                <button
                  type="button"
                  className={`tab-pill ${isTabLocked("counter") ? "opacity-60" : ""}`}
                  data-active={tab === "counter"}
                  onClick={() => setTab("counter")}
                  aria-disabled={isTabLocked("counter")}
                  title={isTabLocked("counter") ? "Sign in to unlock" : undefined}
                >
                  Counter
                  {isTabLocked("counter") && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className={`tab-pill ${isTabLocked("tasks") ? "opacity-60" : ""}`}
                  data-active={tab === "tasks"}
                  onClick={() => setTab("tasks")}
                  aria-disabled={isTabLocked("tasks")}
                  title={isTabLocked("tasks") ? "Sign in to unlock" : undefined}
                >
                  Tasks
                  {isTabLocked("tasks") && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className={`tab-pill ${isTabLocked("analytics") ? "opacity-60" : ""}`}
                  data-active={tab === "analytics"}
                  onClick={() => setTab("analytics")}
                  aria-disabled={isTabLocked("analytics")}
                  title={isTabLocked("analytics") ? "Sign in to unlock" : undefined}
                >
                  Analytics
                  {isTabLocked("analytics") && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                    </svg>
                  )}
                </button>
              </nav>

              <div className="flex items-center justify-start md:justify-end gap-2">
                <UserHeader />
              </div>
            </div>
          </section>
        </div>

        <section className="app-shell pb-10 relative z-10">
          <div className="mt-6 md:mt-8">
            {tab === "clock" && (
              <div className="animate-fade">
                <ClockPanel
                  backgroundUrl={backgroundUrl}
                  backgroundType={backgroundType}
                  overlayOpacity={overlayOpacity}
                  backgroundOpacity={backgroundOpacity}
                  theme={theme}
                  onOpacityChange={setOverlayOpacity}
                  onBackgroundOpacityChange={setBackgroundOpacity}
                  onThemeChange={setTheme}
                  clockFont={clockFont}
                  onClockFontChange={setClockFont}
                  timeFormat={timeFormat}
                  onTimeFormatChange={setTimeFormat}
                  onBackgroundChange={handleBackgroundChange}
                />
              </div>
            )}
            {tab === "counter" && (
              <div className="animate-fade">
                {isTabLocked("counter")
                  ? renderLockedPanel(
                      "Counter locked",
                      "Sign in to track sessions and save focused work."
                    )
                  : (
                    <CounterPanel
                      backgroundUrl={backgroundUrl}
                      backgroundType={backgroundType}
                      overlayOpacity={overlayOpacity}
                      backgroundOpacity={backgroundOpacity}
                      theme={theme}
                      timeFormat={timeFormat}
                      onOpacityChange={setOverlayOpacity}
                      onBackgroundOpacityChange={setBackgroundOpacity}
                      onThemeChange={setTheme}
                      clockFont={clockFont}
                      onClockFontChange={setClockFont}
                      onBackgroundChange={handleBackgroundChange}
                      onGoToTasks={() => setTab("tasks")}
                      currentProgressTask={currentProgressTask}
                      onTaskSessionComplete={(duration) => {
                        if (currentProgressTask) {
                          window.localStorage.setItem(
                            "pending_session",
                            JSON.stringify({
                              taskId: currentProgressTask.id,
                              duration,
                            })
                          );
                        }
                      }}
                      isActive={tab === "counter"}
                    />
                  )}
              </div>
            )}
            {tab === "analytics" && (
              <div className="animate-fade">
                {isTabLocked("analytics")
                  ? renderLockedPanel(
                      "Analytics locked",
                      "Sign in to view performance trends and reports."
                    )
                  : <AnalyticsPanel />}
              </div>
            )}
            {tab === "tasks" && (
              <div className="animate-fade">
                {isTabLocked("tasks")
                  ? renderLockedPanel(
                      "Tasks locked",
                      "Sign in to manage tasks and keep them synced."
                    )
                  : <TasksPanel />}
              </div>
            )}
          </div>
        </section>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRazorpayOrder(null);
          setUpgradeError("");
        }}
        onPaymentSuccess={handlePaymentSuccess}
        loading={upgradeLoading}
        error={upgradeError}
        orderId={razorpayOrder?.orderId}
        keyId={razorpayOrder?.keyId}
        userEmail={razorpayOrder?.userEmail}
        userName={razorpayOrder?.userName}
      />
    </main>
  );
}