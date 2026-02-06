"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";

import { FloatingHearts } from "@/components/valentine/FloatingHearts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "intro" | "question" | "yes";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ValentineApp({ name = "Mycala" }: { name?: string }) {
  const [step, setStep] = useState<Step>("intro");
  const [noPos, setNoPos] = useState<{ x: number; y: number }>({ x: 62, y: 62 });
  const [noTaunt, setNoTaunt] = useState<string>("");
  const [notifyStatus, setNotifyStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  const dodgeAreaRef = useRef<HTMLDivElement | null>(null);
  const lastMoveAtRef = useRef<number>(0);

  const introLines = useMemo(
    () => [
      "I made you a tiny website, just for you.",
      "Because you deserve something sweet (and a little cheesy).",
      "Take a deep breath… I have one question to ask.",
    ],
    [],
  );

  const taunts = useMemo(
    () => [
      "Nope 😌",
      "Nice try!",
      "Uh uh.",
      "That one doesn't work.",
      "Only one right answer…",
    ],
    [],
  );

  const moveNoButton = useCallback(() => {
    const now = Date.now();
    if (now - lastMoveAtRef.current < 80) return;
    lastMoveAtRef.current = now;

    const area = dodgeAreaRef.current;
    if (!area) {
      setNoPos({ x: randomBetween(20, 80), y: randomBetween(35, 85) });
      return;
    }

    const rect = area.getBoundingClientRect();
    const padding = 16;

    const xPx = randomBetween(padding, Math.max(padding, rect.width - padding));
    const yPx = randomBetween(padding, Math.max(padding, rect.height - padding));

    const x = clamp((xPx / rect.width) * 100, 8, 86);
    const y = clamp((yPx / rect.height) * 100, 20, 86);

    setNoPos({ x, y });
    setNoTaunt(taunts[Math.floor(Math.random() * taunts.length)]);
  }, [taunts]);

  const celebrate = useCallback(() => {
    confetti({
      particleCount: 140,
      spread: 95,
      startVelocity: 45,
      scalar: 1.05,
      origin: { y: 0.75 },
      colors: ["#fb7185", "#f472b6", "#fda4af", "#fff"],
    });

    const end = Date.now() + 900;
    const tick = () => {
      confetti({
        particleCount: 3,
        spread: 70,
        startVelocity: 18,
        scalar: 0.9,
        origin: { x: Math.random(), y: randomBetween(0.2, 0.8) },
        colors: ["#fb7185", "#f472b6", "#fda4af"],
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const notifyYes = useCallback(async () => {
    setNotifyStatus("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "valentine_yes",
          name,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { delivered?: boolean }
        | null;

      if (!res.ok) throw new Error("notify_failed");
      if (!data?.delivered) throw new Error("notify_not_delivered");
      setNotifyStatus("sent");
    } catch {
      setNotifyStatus("failed");
    }
  }, [name]);

  useEffect(() => {
    if (step !== "question") return;
    const t = window.setTimeout(() => moveNoButton(), 450);
    return () => window.clearTimeout(t);
  }, [moveNoButton, step]);

  useEffect(() => {
    if (step !== "yes") return;
    celebrate();
    void notifyYes();
  }, [celebrate, notifyYes, step]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.25),_transparent_60%),linear-gradient(135deg,_#7c3aed_0%,_#ec4899_45%,_#fb7185_100%)]">
      <FloatingHearts count={24} />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-3xl items-center justify-center px-4 py-10 [padding-bottom:calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-16">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full"
            >
              <div className="relative w-full">
                <Card className="border-white/15">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-3xl sm:text-4xl md:text-5xl">Hey {name}</CardTitle>

                      <motion.div
                        aria-hidden="true"
                        initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="shrink-0"
                      >
                        <motion.div
                          animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="grid place-items-center rounded-2xl bg-white/10 px-3 py-2 sm:rounded-3xl sm:px-4 sm:py-3"
                        >
                          <span className="text-xl sm:text-2xl md:text-3xl">💌</span>
                        </motion.div>
                      </motion.div>
                    </div>

                    <p className="mt-3 max-w-prose text-base leading-7 text-white/85">
                      {introLines.join(" ")}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="mt-3 flex items-center gap-2 text-white/80">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm leading-6">A tiny note, with extra cute built in.</p>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        size="lg"
                        className="touch-manipulation w-full sm:w-auto"
                        onClick={() => setStep("question")}
                      >
                        Open my note
                      </Button>
                      <p className="text-center text-xs leading-5 text-white/70 sm:text-right">
                        (Made with love. Tap the button.)
                      </p>
                    </div>

                  </CardContent>
                </Card>

                <span className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] bg-white/10 blur-xl opacity-60" />
              </div>
            </motion.div>
          )}

          {step === "question" && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full"
            >
              <Card className="border-white/15">
                <CardHeader>
                  <CardTitle className="text-3xl sm:text-4xl">
                    {name}, will you be my Valentine?
                  </CardTitle>
                  <p className="mt-3 text-white/85">Choose wisely. (Very wisely.)</p>
                </CardHeader>
                <CardContent>
                  <div
                    ref={dodgeAreaRef}
                    className="relative mt-6 h-[260px] w-full overflow-hidden rounded-3xl border border-white/15 bg-black/10 sm:h-[240px]"
                  >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Button
                        size="lg"
                        onClick={() => setStep("yes")}
                        className="touch-manipulation shadow-[0_18px_60px_-18px_rgba(255,255,255,0.35)]"
                      >
                        Yes
                      </Button>
                    </div>

                    <motion.div
                      className="absolute"
                      animate={{ left: `${noPos.x}%`, top: `${noPos.y}%` }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                      style={{ transform: "translate(-50%, -50%)" }}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="touch-manipulation"
                        onPointerEnter={moveNoButton}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          moveNoButton();
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          moveNoButton();
                        }}
                        onFocus={moveNoButton}
                        onClick={(e) => {
                          e.preventDefault();
                          moveNoButton();
                        }}
                      >
                        No
                      </Button>
                    </motion.div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center text-xs text-white/70">
                      {noTaunt ? noTaunt : "(Try pressing No. I dare you.)"}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      className="touch-manipulation"
                      onClick={() => setStep("intro")}
                    >
                      Back
                    </Button>
                    <span className="text-xs text-white/70">❤</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "yes" && (
            <motion.div
              key="yes"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full"
            >
              <Card className="border-white/15">
                <CardHeader>
                  <CardTitle className="text-3xl sm:text-4xl">YAY!!!</CardTitle>
                  <p className="mt-3 text-white/85">
                    Officially the cutest Valentine ever: {name}.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 grid gap-3 text-white/85">
                    <p>I’m so excited. I can’t wait to make this day special.</p>
                    <p className="text-white/70">
                      {notifyStatus === "sending" && "Notifying you right now…"}
                      {notifyStatus === "sent" && "Notification sent. 💌"}
                      {notifyStatus === "failed" &&
                        "Couldn’t send the notification, but the YES still counts."}
                      {notifyStatus === "idle" && ""}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="touch-manipulation"
                      onClick={() => celebrate()}
                    >
                      More confetti
                    </Button>
                    <Button
                      variant="ghost"
                      className="touch-manipulation"
                      onClick={() => {
                        setStep("intro");
                        setNotifyStatus("idle");
                      }}
                    >
                      Replay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
