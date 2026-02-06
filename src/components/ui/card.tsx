import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.015] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.35)]",
        "backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-white/[0.025]",
        "ring-1 ring-inset ring-white/10",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-6 sm:px-7 sm:pt-7", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-balance text-2xl font-bold tracking-tight text-white", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-6 sm:px-7 sm:pb-7", className)} {...props} />;
}
