'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

import { FloatingHearts } from '@/components/valentine/FloatingHearts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'intro' | 'question' | 'yes';

type Sparkle = {
  id: string;
  size: number;
  x0: number;
  x1: number;
  y1: number;
  delay: number;
  duration: number;
  opacity: number;
};

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetweenRng(rng: () => number, min: number, max: number) {
  return rng() * (max - min) + min;
}

function TypewriterReveal({
  text,
  reduceMotion,
}: {
  text: string;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return <>{text}</>;

  const chars = Array.from(text);
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.014,
        delayChildren: 0.08,
      },
    },
  };

  const char = {
    hidden: { opacity: 0, y: 4 },
    show: { opacity: 1, y: 0, transition: { duration: 0.14 } },
  };

  return (
    <motion.span
      className="typewriter"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {chars.map((c, i) => (
        <motion.span key={`${c}-${i}`} variants={char} className="inline-block">
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
      <span className="typewriter-caret" aria-hidden="true" />
    </motion.span>
  );
}

function ButtonSparkles({
  reduceMotion,
  count = 10,
}: {
  reduceMotion: boolean;
  count?: number;
}) {
  const reactId = useId();
  const seed = useMemo(() => fnv1a32(reactId), [reactId]);

  const sparkles = useMemo<Sparkle[]>(() => {
    if (reduceMotion) return [];

    return Array.from({ length: count }).map((_, idx) => {
      const rng = mulberry32((seed + Math.imul(idx + 1, 0x9e3779b9)) >>> 0);

      const x0 = randomBetweenRng(rng, -70, 70);
      const x1 = x0 + randomBetweenRng(rng, -18, 18);
      const y1 = -randomBetweenRng(rng, 34, 74);

      return {
        id: `${reactId}-sparkle-${idx}`,
        size: randomBetweenRng(rng, 3, 6),
        x0,
        x1,
        y1,
        delay: randomBetweenRng(rng, 0, 2.4),
        duration: randomBetweenRng(rng, 1.9, 3.2),
        opacity: randomBetweenRng(rng, 0.45, 0.9),
      };
    });
  }, [count, reactId, reduceMotion, seed]);

  if (sparkles.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
    >
      {sparkles.map((s) =>
        (() => {
          const style = {
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            '--sx0': `${s.x0}px`,
            '--sx1': `${s.x1}px`,
            '--sy1': `${s.y1}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          } as React.CSSProperties & Record<string, string | number>;

          return <span key={s.id} className="sparkle-dot" style={style} />;
        })(),
      )}
    </div>
  );
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ValentineApp({
  name = 'Mycala',
  showUnderline = false,
}: {
  name?: string;
  showUnderline?: boolean;
}) {
  const reduceMotion: boolean = Boolean(useReducedMotion());
  const [step, setStep] = useState<Step>('intro');
  const [questionEntered, setQuestionEntered] = useState(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [noSize, setNoSize] = useState<{ w: number; h: number } | null>(null);
  const [noReady, setNoReady] = useState(false);
  const [noLabel, setNoLabel] = useState<string>('No');
  const [notifyStatus, setNotifyStatus] = useState<
    'idle' | 'sending' | 'sent' | 'failed'
  >('idle');

  const appRef = useRef<HTMLDivElement | null>(null);
  const noAnchorRef = useRef<HTMLButtonElement | null>(null);
  const noButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastMoveAtRef = useRef<number>(0);
  const lastTauntRef = useRef<string>('');

  const introLines = useMemo(
    () => [
      'I made you a tiny website, just for you.',
      'Because you deserve something sweet (and a little cheesy).',
      'Take a deep breath… I have one question to ask.',
    ],
    [],
  );

  const introText = useMemo(() => introLines.join(' '), [introLines]);

  const noTaunts = useMemo(
    () => [
      'Nope 😌',
      'Nice try!',
      'Uh uh 🙅‍♀️',
      'Not a chance 😘',
      'Only “Yes” works 💘',
      'That button is broken 😇',
      'Try again, cutie',
      'Hehe… no',
      'Denied with love 💕',
      'Absolutely not (respectfully) 😇',
      'My lawyer says no',
      'No (but you’re adorable)',
      'Your tap has been declined 💳',
      'Error 404: No not found',
      'Ask again… sweeter 😘',
      'Nope. Next question.',
      'Smooooth… but no',
      'Not today, bestie',
      'I’m shy 🙈',
      'My finger slipped… to NO',
      'Try the other button 😏',
      'Only Yes-energy allowed ✨',
      'No is on vacation 🏝️',
      'No thanks, I’m glittery',
      'Nope (I giggled though)',
      'Wrong door 🚪',
      'Access denied 🔒',
      'I’m too cute to say no… so: no',
      'No, but like… hi',
      'That’s a no from me, dawg',
      'No? Never heard of her',
      'Please select: YES ✅',
      'Unclickable by design 😌',
      'You’re persistent… I like that',
      'Nice finger. Still no.',
      'Try again, my Valentine 😘',
      'My heart says… YES (so no)',
      'No button said: “run” 🏃‍♀️',
      'I’m allergic to “No” 😅',
      'Nope. I’m being dramatic 💅',
      'Let’s pretend you clicked YES',
      'Not gonna happen, cupcake',
      'I can’t… I’m too romantic',
      'No? In this economy?',
      'I’m busy being loved 💕',
      'Nope—kiss tax required',
      'This button only plays hide-and-seek',
      'Denied. Try YES for rewards',
    ],
    [],
  );

  const moveNoButton = useCallback(() => {
    // Always change the label on interaction (even if we throttle movement).
    if (noTaunts.length > 0) {
      let next = noTaunts[Math.floor(Math.random() * noTaunts.length)];
      if (noTaunts.length > 1 && next === lastTauntRef.current) {
        next = noTaunts[(noTaunts.indexOf(next) + 1) % noTaunts.length];
      }
      lastTauntRef.current = next;
      setNoLabel(next);
    }

    const now = Date.now();
    if (now - lastMoveAtRef.current < 80) return;
    lastMoveAtRef.current = now;

    // Viewport-bounded movement: No can roam anywhere but never off-screen.
    const padding = 14;
    const bw = noSize?.w ?? 144;
    const bh = noSize?.h ?? 44;

    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    if (!vw || !vh) return;

    const minX = padding + bw / 2;
    const maxX = Math.max(minX, vw - padding - bw / 2);
    const minY = padding + bh / 2;
    const maxY = Math.max(minY, vh - padding - bh / 2);

    const x = randomBetween(minX, maxX);
    const y = randomBetween(minY, maxY);

    setNoPos({ x, y });
  }, [noSize, noTaunts]);

  const celebrate = useCallback(() => {
    confetti({
      particleCount: 140,
      spread: 95,
      startVelocity: 45,
      scalar: 1.05,
      origin: { y: 0.75 },
      colors: ['#fb7185', '#f472b6', '#fda4af', '#fff'],
    });

    const end = Date.now() + 900;
    const tick = () => {
      confetti({
        particleCount: 3,
        spread: 70,
        startVelocity: 18,
        scalar: 0.9,
        origin: { x: Math.random(), y: randomBetween(0.2, 0.8) },
        colors: ['#fb7185', '#f472b6', '#fda4af'],
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const notifyYes = useCallback(async () => {
    setNotifyStatus('sending');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'valentine_yes',
          name,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        delivered?: boolean;
      } | null;

      if (!res.ok) throw new Error('notify_failed');
      if (!data?.delivered) throw new Error('notify_not_delivered');
      setNotifyStatus('sent');
    } catch {
      setNotifyStatus('failed');
    }
  }, [name]);

  useLayoutEffect(() => {
    if (step !== 'question') return;
    if (!questionEntered) return;

    const anchor = noAnchorRef.current;
    if (!anchor) return;

    const a = anchor.getBoundingClientRect();

    // Match the overlay No button size to the in-layout placeholder.
    const measuredW = Math.max(44, a.width);
    const measuredH = Math.max(32, a.height);
    setNoSize({ w: measuredW, h: measuredH });

    // Use fixed fallback size so we can place the overlay immediately.
    const padding = 14;
    const bw = measuredW || 144;
    const bh = measuredH || 44;

    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    if (!vw || !vh) return;

    const minX = padding + bw / 2;
    const maxX = Math.max(minX, vw - padding - bw / 2);
    const minY = padding + bh / 2;
    const maxY = Math.max(minY, vh - padding - bh / 2);

    const x = clamp(a.left + a.width / 2, minX, maxX);
    const y = clamp(a.top + a.height / 2, minY, maxY);
    setNoPos({ x, y });
    setNoReady(true);
  }, [questionEntered, step]);

  useEffect(() => {
    if (step === 'question') return;
    setNoReady(false);
  }, [step]);

  useEffect(() => {
    if (step === 'question') {
      setQuestionEntered(Boolean(reduceMotion));
      setNoLabel('No');
      lastTauntRef.current = '';
      return;
    }
    setQuestionEntered(false);
  }, [reduceMotion, step]);

  useEffect(() => {
    if (step !== 'question') return;

    setNoLabel('No');
    lastTauntRef.current = '';
    const onResize = () => {
      const anchor = noAnchorRef.current;
      const a = anchor?.getBoundingClientRect();
      const bw = Math.max(44, a?.width ?? noSize?.w ?? 144);
      const bh = Math.max(32, a?.height ?? noSize?.h ?? 44);
      const padding = 14;

      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      if (!vw || !vh) return;

      const minX = padding + bw / 2;
      const maxX = Math.max(minX, vw - padding - bw / 2);
      const minY = padding + bh / 2;
      const maxY = Math.max(minY, vh - padding - bh / 2);

      setNoSize({ w: bw, h: bh });

      setNoPos((p) => ({
        x: clamp(p.x, minX, maxX),
        y: clamp(p.y, minY, maxY),
      }));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [noSize, step]);

  useEffect(() => {
    if (step !== 'yes') return;
    celebrate();
    void notifyYes();
  }, [celebrate, notifyYes, step]);

  return (
    <div
      ref={appRef}
      className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.25),_transparent_60%),linear-gradient(135deg,_#7c3aed_0%,_#ec4899_45%,_#fb7185_100%)]"
    >
      <FloatingHearts count={24} />

      {step === 'question' && noReady && (
        <motion.div
          className="fixed z-30"
          initial={false}
          animate={{ left: noPos.x, top: noPos.y }}
          transition={{ type: 'spring', stiffness: 520, damping: 28 }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Button
            ref={noButtonRef}
            type="button"
            variant="secondary"
            className="touch-manipulation"
            style={{ width: noSize?.w, height: noSize?.h }}
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
            {noLabel}
          </Button>
        </motion.div>
      )}

      <div className="relative mx-auto flex min-h-[100dvh] max-w-3xl items-center justify-center px-4 py-10 [padding-bottom:calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-16">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full"
            >
              <div className="relative w-full">
                <Card className="border-white/15 glass-shimmer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-3xl sm:text-4xl md:text-5xl">
                        <span className="relative inline-block pb-2">
                          Hey {name}
                          {showUnderline && (
                            <motion.svg
                              aria-hidden="true"
                              className="absolute -bottom-0.5 left-0 h-3 w-full"
                              viewBox="0 0 120 12"
                              preserveAspectRatio="none"
                            >
                              <motion.path
                                d="M2 9 C 22 2, 40 11, 62 7 C 82 3, 98 11, 118 6"
                                fill="none"
                                stroke="rgba(255,255,255,0.85)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={
                                  reduceMotion
                                    ? { duration: 0 }
                                    : {
                                        duration: 0.9,
                                        ease: 'easeOut',
                                        delay: 0.15,
                                      }
                                }
                              />
                            </motion.svg>
                          )}
                        </span>
                      </CardTitle>

                      <motion.div
                        aria-hidden="true"
                        initial={{ scale: 0.7, rotate: 10, opacity: 0 }}
                        animate={{
                          scale: [0.7, 1.08, 1],
                          rotate: [10, -4, 0],
                          opacity: 1,
                        }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.55, ease: 'easeOut' }
                        }
                        className="shrink-0"
                      >
                        <motion.div
                          animate={
                            reduceMotion
                              ? undefined
                              : { y: [0, -8, 0], rotate: [-6, 6, -6] }
                          }
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="grid place-items-center rounded-2xl bg-white/10 px-3 py-2 sm:rounded-3xl sm:px-4 sm:py-3"
                        >
                          <span className="text-xl sm:text-2xl md:text-3xl">
                            💌
                          </span>
                        </motion.div>
                      </motion.div>
                    </div>

                    
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-2 text-white/80">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm leading-6">
                        A tiny note, with extra cute built in.
                      </p>
                    </div>

                    <p className="mt-3 max-w-prose text-base leading-7 text-white/85 break-words">
                      <TypewriterReveal
                        text={introText}
                        reduceMotion={reduceMotion}
                      />
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:w-auto">
                        <ButtonSparkles reduceMotion={reduceMotion} />
                        <Button
                          size="lg"
                          className="touch-manipulation w-full sm:w-auto"
                          onClick={() => setStep('question')}
                        >
                          Open my note
                        </Button>
                      </div>
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

          {step === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.35, ease: 'easeOut' }
              }
              onAnimationComplete={() => setQuestionEntered(true)}
              className="w-full"
            >
              <Card className="border-white/15">
                <CardHeader>
                  <CardTitle className="text-3xl sm:text-4xl">
                    {name}, will you be my Valentine?
                  </CardTitle>
                  
                </CardHeader>
                <CardContent>
                  <p className="mt-3 text-white/85">
                    {questionEntered ? (
                      <TypewriterReveal
                        text={`${name} ❤️ Being with you has genuinely made my life better in so many ways, and I’m really grateful for everything we share — the laughs, the support, and even the quiet moments. You mean a lot to me, and I’d love to make this Valentine’s Day ours. Will you be my Valentine?`}
                        reduceMotion={reduceMotion}
                      />
                    ) : (
                      <span className="opacity-0" aria-hidden="true">
                        {name} ❤️ Being with you has genuinely made my life better in so many ways, and I’m really grateful for everything we share — the laughs, the support, and even the quiet moments. You mean a lot to me, and I’d love to make this Valentine’s Day ours. Will you be my Valentine?
                      </span>
                    )}
                  </p>
                  <p className="mt-3 text-white/85">
                    Choose wisely (Very wisely)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-8 text-sm text-white/80">
                    <div className="relative w-full">
                      <ButtonSparkles reduceMotion={reduceMotion} count={12} />
                      <Button
                        variant="default"
                        className="touch-manipulation w-full text-lg sm:text-xl"
                        onClick={() => setStep('yes')}
                      >
                        Yes
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="touch-manipulation w-full text-lg sm:text-xl opacity-0 pointer-events-none select-none"
                      ref={noAnchorRef}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      No
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'yes' && (
            <motion.div
              key="yes"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
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
                    <p>
                      I’m so excited. I can’t wait to make this day special.
                    </p>
                    <p className="text-white/70">
                      {notifyStatus === 'sending' && 'Notifying you right now…'}
                      {notifyStatus === 'sent' && 'Notification sent. 💌'}
                      {notifyStatus === 'failed' &&
                        'Couldn’t send the notification, but the YES still counts.'}
                      {notifyStatus === 'idle' && ''}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-row gap-3">
                    <Button
                      variant="default"
                      className="touch-manipulation w-full"
                      onClick={() => celebrate()}
                    >
                      More confetti
                    </Button>
                    <Button
                      variant="outline"
                      className="touch-manipulation w-full"
                      onClick={() => {
                        setStep('intro');
                        setNotifyStatus('idle');
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
