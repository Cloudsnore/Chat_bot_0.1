import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { z } from 'zod';

/* =========================
   SYSTEM PROMPT
========================= */
const SYSTEM_PROMPT = `
You are UpliftMate — a grounded, thoughtful workplace wellness assistant.

Your goal is to help users think through stress, burnout, and workplace challenges in a calm, practical, and human way.

## Core Behavior
- Sound like a normal, emotionally intelligent person — not a therapist, not a motivational speaker.
- Be supportive, but do not overdo empathy.
- Keep responses concise and natural.
- Avoid dramatic, poetic, or overly soft language.
- Do not use phrases like "you're not alone", "you’ve got this", or anything that sounds scripted.

## Tone Guidelines
- Acknowledge the feeling briefly, then move forward.
- Prefer clarity over comfort.
- It's okay to sound neutral if the situation calls for it.
- Light warmth is good. Over-enthusiasm is not.

## Style Rules
- No exaggerated sympathy ("Oh no…", "That must be so hard…")
- No pet names ("buddy", "friend", "honey")
- No forced humor
- No long monologues
- Avoid repeating what the user already said

## Response Structure
1. Brief acknowledgment (max 1 line)
2. A simple observation or reframing
3. One useful question OR suggestion

## Hard Constraint
Keep responses under 120 words unless explicitly needed.

## CRITICAL SAFETY INSTRUCTION
If user expresses self-harm or danger:
- Switch to serious tone
- Encourage real help
- MUST append: [CRISIS_TRIGGER]
`;

/* =========================
   VALIDATION
========================= */
const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().optional(),
      parts: z.any().optional(),
    })
  ),
});

/* =========================
   RATE LIMITING
========================= */
const rateLimitMap = new Map();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 60000;
  const max = 20;

  const user = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - user.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  if (user.count >= max) return false;

  user.count++;
  rateLimitMap.set(ip, user);
  return true;
}

/* =========================
   NORMALIZE MESSAGES
========================= */
function normalizeMessages(messages: any[]) {
  if (!Array.isArray(messages)) return [];

  return messages.map((msg) => {
    if (!msg) return { role: "user", content: "" };

    if (typeof msg.content === "string") {
      return { role: msg.role || "user", content: msg.content };
    }

    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        .map((p: any) => (p?.type === "text" ? p.text : ""))
        .join("");

      return { role: msg.role || "user", content: text };
    }

    return { role: msg.role || "user", content: "" };
  });
}

/* =========================
   ERROR CLASSIFIER
========================= */
function isRetryableError(err: any) {
  const msg = err?.message?.toLowerCase() || "";

  return (
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("overloaded")
  );
}

/* =========================
   MODEL CHAIN
========================= */
const MODELS = [
  () => google('gemini-2.5-flash'),
  () => google('gemini-1.5-flash'),
  () => groq('llama-3.3-70b-versatile'),
  () => groq('llama-3.1-8b-instant'),
];

/* =========================
   TRY MODELS (FIXED)
========================= */
async function tryModels(messages: any[]) {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }

  let lastError;

  for (const getModel of MODELS) {
    const model = getModel();

    try {
      console.log("Trying model:", model.modelId);

      const result = await streamText({
        model,
        system: SYSTEM_PROMPT,
        messages, // ✅ FIXED (no convertToModelMessages)
      });

      console.log("Success with:", model.modelId);
      return result;

    } catch (err: any) {
      console.error("Failed:", model.modelId, err?.message);
      lastError = err;

      if (!isRetryableError(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

/* =========================
   MAIN HANDLER
========================= */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!checkRateLimit(ip)) {
      return new Response("Too many requests", { status: 429 });
    }

    const body = await req.json();

    console.log("RAW BODY:", JSON.stringify(body, null, 2));

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation failed:", parsed.error);
      return new Response("Invalid request", { status: 400 });
    }

    const messages = parsed.data?.messages ?? [];

    const cleanMessages = normalizeMessages(messages);

    console.log("CLEAN MESSAGES:", cleanMessages);

    const result = await tryModels(cleanMessages);

    return result.toUIMessageStreamResponse();

  } catch (err) {
    console.error("Server error:", err);
    return new Response("AI service unavailable", { status: 500 });
  }
}