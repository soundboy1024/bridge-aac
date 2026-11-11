/**
 * Public-demo guard. Wraps the real provider so strangers can't use up the
 * free-tier quota or hang the page:
 *  - a daily cap on real AI calls for the whole site (DEMO_AI_DAILY_LIMIT)
 *  - a per-visitor hourly cap (DEMO_AI_PER_IP_HOURLY)
 *  - a timeout on each AI call (DEMO_AI_TIMEOUT_MS)
 * When any of these trip, or the AI call fails, the answer comes from the mock
 * provider instead, and the response says so.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { Provider, TaskRequest } from "./provider.js";

type Ctx = { ip: string; servedBy?: string; fallbackReason?: string };
export const requestCtx = new AsyncLocalStorage<Ctx>();

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

export class DemoGuardProvider implements Provider {
  readonly name: string;
  readonly model?: string;
  private day = "";
  private dayCount = 0;
  private perIp = new Map<string, number[]>();
  private dailyLimit = num(process.env.DEMO_AI_DAILY_LIMIT, 40);
  private perIpHourly = num(process.env.DEMO_AI_PER_IP_HOURLY, 8);
  private timeoutMs = num(process.env.DEMO_AI_TIMEOUT_MS, 45000);

  constructor(private real: Provider, private mock: Provider) {
    this.name = real.name;
    this.model = (real as { model?: string }).model;
  }

  /** Remaining real-AI answers today, for the status endpoint. */
  remainingToday() {
    this.rollDay();
    return Math.max(0, this.dailyLimit - this.dayCount);
  }

  private rollDay() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.day) { this.day = today; this.dayCount = 0; }
  }

  private limitReason(ip: string): string | undefined {
    this.rollDay();
    if (this.dayCount >= this.dailyLimit) return "the demo's daily AI limit is used up";
    const hourAgo = Date.now() - 3600_000;
    const recent = (this.perIp.get(ip) ?? []).filter((t) => t > hourAgo);
    this.perIp.set(ip, recent);
    if (recent.length >= this.perIpHourly) return "you've reached this hour's AI limit";
    return undefined;
  }

  async run<T>(req: TaskRequest<T>): Promise<T> {
    const ctx = requestCtx.getStore();
    const ip = ctx?.ip ?? "unknown";
    const blocked = this.limitReason(ip);
    if (blocked) return this.fallback(req, ctx, blocked);
    this.dayCount++;
    this.perIp.get(ip)!.push(Date.now());
    try {
      const out = await Promise.race([
        this.real.run(req),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), this.timeoutMs)),
      ]);
      if (ctx) ctx.servedBy = this.real.name;
      return out;
    } catch (e) {
      console.warn(`AI call failed (${req.task}): ${(e as Error).message}. Using mock.`);
      return this.fallback(req, ctx, "the AI service is busy or out of quota");
    }
  }

  private fallback<T>(req: TaskRequest<T>, ctx: Ctx | undefined, reason: string) {
    if (ctx) { ctx.servedBy = "mock"; ctx.fallbackReason = reason; }
    return this.mock.run(req);
  }
}
