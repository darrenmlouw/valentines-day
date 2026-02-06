"use client";

import { useId, useMemo } from "react";

type Heart = {
  id: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  rotate: number;
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

function randomBetween(rng: () => number, min: number, max: number) {
  return rng() * (max - min) + min;
}

export function FloatingHearts({ count = 18 }: { count?: number }) {
  const reactId = useId();
  const seed = useMemo(() => fnv1a32(reactId), [reactId]);

  const hearts = useMemo<Heart[]>(() => {
    return Array.from({ length: count }).map((_, idx) => {
      const idxSeed = (seed + Math.imul(idx + 1, 0x9e3779b9)) >>> 0;
      const rng = mulberry32(idxSeed);
      return {
        id: `${reactId}-heart-${idx}`,
        left: randomBetween(rng, 0, 100),
        size: randomBetween(rng, 14, 34),
        delay: randomBetween(rng, 0, 3.5),
        duration: randomBetween(rng, 6, 12),
        opacity: randomBetween(rng, 0.35, 0.9),
        rotate: randomBetween(rng, -18, 18),
      };
    });
  }, [count, reactId, seed]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-[-60px] animate-float-heart select-none"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            opacity: h.opacity,
            transform: `rotate(${h.rotate}deg)`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  );
}
