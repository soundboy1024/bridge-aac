/**
 * LLM provider abstraction.
 *
 * Modules never talk to a model directly. They describe a *task* (name, system
 * prompt, user prompt, zod output schema) and the provider returns a validated
 * object. Two implementations:
 *
 *  - ClaudeProvider: real calls via the official Anthropic SDK using structured
 *    outputs (messages.parse + zodOutputFormat). System prompt is cached.
 *  - GroqProvider: OpenAI-compatible chat completions on api.groq.com with
 *    response_format=json_schema, validated by zod, one retry on mismatch.
 *  - MockProvider: deterministic, rule-based outputs so the whole system runs,
 *    demos, and tests without an API key. Each module registers its own mock.
 *
 * Selection: `createProvider()` picks Claude when ANTHROPIC_API_KEY (or an
 * `ant auth login` profile via ANTHROPIC_AUTH_TOKEN) is present, else Groq
 * when GROQ_API_KEY is present, else Mock. Force with
 * BRIDGE_PROVIDER=mock|claude|groq.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export interface TaskRequest<T> {
  task: string; // stable id, e.g. "interpret", "compose"
  system: string; // stable across calls for the same profile → cacheable
  prompt: string; // volatile, per-call
  schema: z.ZodType<T>;
  effort?: "low" | "medium" | "high";
  /** Mock providers get the raw structured input so they can be rule-based. */
  mockInput?: unknown;
}

export interface Provider {
  readonly name: string;
  run<T>(req: TaskRequest<T>): Promise<T>;
}

export const DEFAULT_MODEL = process.env.BRIDGE_MODEL ?? "claude-opus-5";
export const DEFAULT_GROQ_MODEL = process.env.BRIDGE_MODEL ?? "openai/gpt-oss-120b";

export class ClaudeProvider implements Provider {
  readonly name = "claude";
  private client: Anthropic;
  constructor(client?: Anthropic) {
    this.client = client ?? new Anthropic();
  }
  async run<T>(req: TaskRequest<T>): Promise<T> {
    const response = await this.client.messages.parse({
      model: DEFAULT_MODEL,
      max_tokens: 8000,
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: req.prompt }],
      thinking: { type: "adaptive" },
      output_config: { effort: req.effort ?? "medium", format: zodOutputFormat(req.schema) },
    });
    if (response.stop_reason === "refusal") {
      throw new Error(`Model declined task "${req.task}": ${response.stop_details?.explanation ?? "no explanation"}`);
    }
    if (!response.parsed_output) throw new Error(`Structured output failed to parse for task "${req.task}"`);
    return response.parsed_output as T;
  }
}

export class GroqProvider implements Provider {
  readonly name = "groq";
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  constructor(opts: { apiKey?: string; model?: string; baseUrl?: string } = {}) {
    this.apiKey = opts.apiKey ?? process.env.GROQ_API_KEY ?? "";
    if (!this.apiKey) throw new Error("GroqProvider: GROQ_API_KEY is not set");
    this.model = opts.model ?? DEFAULT_GROQ_MODEL;
    this.baseUrl = opts.baseUrl ?? process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  }
  private static lastCallAt = 0;
  /** POST with pacing (GROQ_MIN_GAP_MS between calls) and 429 backoff honoring retry-after. */
  private async post(body: Record<string, unknown>, task: string): Promise<any> {
    const gap = Number(process.env.GROQ_MIN_GAP_MS ?? 4000);
    for (let tries = 0; tries < 6; tries++) {
      const wait = GroqProvider.lastCallAt + gap - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      GroqProvider.lastCallAt = Date.now();
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        const ra = Number(res.headers.get("retry-after"));
        const ms = (Number.isFinite(ra) && ra > 0 ? ra : 15 * (tries + 1)) * 1000;
        console.error(`  groq 429 on "${task}", waiting ${Math.round(ms / 1000)}s`);
        await res.text();
        await new Promise((r) => setTimeout(r, ms));
        continue;
      }
      if (!res.ok) throw new Error(`Groq ${res.status} on task "${task}": ${(await res.text()).slice(0, 500)}`);
      return res.json();
    }
    throw new Error(`Groq: still rate-limited on task "${task}" after retries`);
  }
  async run<T>(req: TaskRequest<T>): Promise<T> {
    const schema = z.toJSONSchema(req.schema as z.ZodType, { io: "output", unrepresentable: "any" });
    delete (schema as any).$schema;
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: req.system },
      { role: "user", content: req.prompt },
    ];
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const body: Record<string, unknown> = {
        model: this.model,
        messages,
        temperature: 0.3,
        // Groq counts max_completion_tokens against the per-minute TPM budget up front,
        // so keep this small: the free tier is 8k TPM and our outputs are ~300-800 tokens.
        max_completion_tokens: Number(process.env.GROQ_MAX_TOKENS ?? 2000),
        response_format: { type: "json_schema", json_schema: { name: req.task, strict: false, schema } },
      };
      if (this.model.startsWith("openai/gpt-oss")) body.reasoning_effort = req.effort === "high" ? "medium" : "low";
      const data = await this.post(body, req.task);
      const content: string = data.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = req.schema.safeParse(JSON.parse(content));
        if (parsed.success) return parsed.data;
        lastErr = parsed.error;
        messages.push({ role: "assistant", content }, { role: "user", content: `Your JSON did not match the schema. Fix exactly these problems and return the full object again:
${z.prettifyError(parsed.error)}` });
      } catch (e) {
        lastErr = e;
        messages.push({ role: "assistant", content }, { role: "user", content: "That was not valid JSON. Return only the JSON object." });
      }
    }
    throw new Error(`Groq structured output failed for task "${req.task}" after retry: ${String(lastErr).slice(0, 400)}`);
  }
}

export type MockHandler = (input: any, req: TaskRequest<any>) => unknown;

export class MockProvider implements Provider {
  readonly name = "mock";
  private handlers = new Map<string, MockHandler>();
  register(task: string, handler: MockHandler): this {
    this.handlers.set(task, handler);
    return this;
  }
  async run<T>(req: TaskRequest<T>): Promise<T> {
    const h = this.handlers.get(req.task);
    if (!h) throw new Error(`MockProvider: no handler registered for task "${req.task}"`);
    const out = h(req.mockInput, req);
    return req.schema.parse(out);
  }
}

export function hasClaudeCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let singleton: Provider | undefined;
export function createProvider(mock: MockProvider): Provider {
  if (singleton) return singleton;
  const forced = process.env.BRIDGE_PROVIDER;
  if (forced === "mock") singleton = mock;
  else if (forced === "claude" || (!forced && hasClaudeCredentials())) singleton = new ClaudeProvider();
  else if (forced === "groq" || (!forced && process.env.GROQ_API_KEY)) singleton = new GroqProvider();
  else singleton = mock;
  return singleton;
}
export function resetProvider() {
  singleton = undefined;
}
