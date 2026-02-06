import { NextResponse } from "next/server";

type NotifyBody = {
  event?: string;
  name?: string;
  timestamp?: string;
};

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function toErrorInfo(err: unknown) {
  if (!(err instanceof Error)) return { message: String(err) };

  const anyErr = err as Error & { cause?: unknown };
  let cause: unknown = anyErr.cause;
  if (cause && cause instanceof Error) {
    cause = { name: cause.name, message: cause.message };
  }

  return {
    name: err.name,
    message: err.message,
    cause,
  };
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

async function proxyAwareFetch(
  url: string,
  init: RequestInit,
  opts: { debugEnabled: boolean },
): Promise<{ resp: Response; debug?: unknown }> {
  const proxyUrl = firstEnv([
    "HTTPS_PROXY",
    "https_proxy",
    "HTTP_PROXY",
    "http_proxy",
    "ALL_PROXY",
    "all_proxy",
  ]);

  const noProxy = firstEnv(["NO_PROXY", "no_proxy"]);

  // In production (e.g. Vercel) we rely on normal fetch.
  if (!proxyUrl || process.env.NODE_ENV === "production") {
    return { resp: await fetch(url, init) };
  }

  try {
    // Only a single endpoint is called here; simple support is enough.
    // If NO_PROXY is set, the proxy behavior may still differ by environment.
    const undici = await import("undici");
    const dispatcher = new undici.ProxyAgent(proxyUrl);
    const resp = await undici.fetch(url, {
      ...(init as unknown as Record<string, unknown>),
      dispatcher,
    } as never);

    return {
      resp: resp as unknown as Response,
      debug: opts.debugEnabled
        ? {
            proxy: {
              enabled: true,
              url: proxyUrl,
              noProxy: noProxy || undefined,
            },
          }
        : undefined,
    };
  } catch (err) {
    // Fall back to normal fetch; return error details for dev diagnostics.
    const fallback = await fetch(url, init);
    return {
      resp: fallback,
      debug: opts.debugEnabled
        ? {
            proxy: {
              enabled: true,
              url: proxyUrl,
              noProxy: noProxy || undefined,
              undiciError: toErrorInfo(err),
            },
          }
        : undefined,
    };
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as NotifyBody;

  const name = safeString(body.name) || "Mycala";
  const event = safeString(body.event) || "valentine_yes";
  const timestamp = safeString(body.timestamp) || new Date().toISOString();

  const text = `Valentine response: YES ✅\nName: ${name}\nEvent: ${event}\nTime: ${timestamp}`;

  const webhookEnv = process.env.DISCORD_WEBHOOK_URL
    ? "DISCORD_WEBHOOK_URL"
    : process.env.NOTIFY_WEBHOOK_URL
      ? "NOTIFY_WEBHOOK_URL"
      : null;

  const webhookUrl =
    (webhookEnv === "DISCORD_WEBHOOK_URL"
      ? process.env.DISCORD_WEBHOOK_URL
      : webhookEnv === "NOTIFY_WEBHOOK_URL"
        ? process.env.NOTIFY_WEBHOOK_URL
        : "") || "";

  if (!webhookUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_configured",
        message:
          "No webhook configured. Set DISCORD_WEBHOOK_URL (or NOTIFY_WEBHOOK_URL).",
        configured: false,
      },
      { status: 400 },
    );
  }

  const results: Record<string, "sent" | "skipped" | "failed"> = {
    webhook: "skipped",
  };

  const debugEnabled = process.env.NODE_ENV !== "production";
  let debug: unknown;

  try {
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
    const { resp, debug: proxyDebug } = await proxyAwareFetch(
      webhookUrl,
      {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isDiscord ? { content: text } : { text }),
      },
      { debugEnabled },
    );

    if (debugEnabled && proxyDebug) {
      debug = {
        ...(typeof debug === "object" && debug ? (debug as object) : null),
        ...(proxyDebug as object),
      };
    }

    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => "");
      console.error("[notify] webhook failed", {
        status: resp.status,
        statusText: resp.statusText,
        body: bodyText.slice(0, 500),
      });
      if (debugEnabled) {
        debug = {
          webhookEnv,
          isDiscord,
          status: resp.status,
          statusText: resp.statusText,
          bodyPreview: bodyText.slice(0, 500),
          ...(typeof debug === "object" && debug ? (debug as object) : null),
        };
      }
      results.webhook = "failed";
    } else {
      results.webhook = "sent";
    }
  } catch (err) {
    const errorInfo = toErrorInfo(err);
    console.error("[notify] webhook error", errorInfo);
    if (debugEnabled) {
      debug = {
        webhookEnv,
        error: errorInfo,
      };
    }
    results.webhook = "failed";
  }

  const delivered = results.webhook === "sent";
  return NextResponse.json({
    ok: delivered,
    delivered,
    results,
    error: delivered ? undefined : "webhook_failed",
    configured: true,
    ...(debugEnabled ? { debug } : null),
  });
}
