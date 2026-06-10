/**
 * NUR Lingo — AI Dialogue Mode (Nurik)
 *
 * Server function: continues a dialogue dynamically using Lovable AI Gateway.
 * Client calls via useServerFn. System prompt keeps Nurik in-character and
 * scoped to the learner's target language + CEFR level.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Lang = z.enum(["en", "hy", "ru"]);
const Turn = z.object({
  role: z.enum(["user", "nurik"]),
  text: z.string().min(1).max(500),
});

const DialogueInput = z.object({
  sourceLanguage: Lang,
  targetLanguage: Lang,
  cefr: z.enum(["A1", "A2", "B1", "B2"]).default("A1"),
  scenario: z.string().min(1).max(200),
  history: z.array(Turn).max(20).default([]),
  userMessage: z.string().min(1).max(500),
});

const LANG_NAME: Record<z.infer<typeof Lang>, string> = {
  en: "English",
  hy: "Armenian (Eastern, standard orthography)",
  ru: "Russian",
};

function systemPrompt(input: z.infer<typeof DialogueInput>) {
  return `You are Nurik (Նուրիկ), the friendly pomegranate mascot of NUR Lingo, a multilingual learning app for Armenian, English and Russian.

You are roleplaying a conversation in ${LANG_NAME[input.targetLanguage]} at ${input.cefr} level.
Scenario: ${input.scenario}
The user's native language is ${LANG_NAME[input.sourceLanguage]}.

Rules:
- Reply ONLY in ${LANG_NAME[input.targetLanguage]}.
- Keep replies short (1-2 sentences) and natural for ${input.cefr}.
- Gently encourage the learner. Never break character.
- If the user wrote in their native language, answer in target language and softly model the equivalent.
- Return ONLY valid JSON, no prose, in this exact shape:
{
  "reply": "<your in-character reply in ${LANG_NAME[input.targetLanguage]}>",
  "translation": "<the reply translated into ${LANG_NAME[input.sourceLanguage]}>",
  "feedback": "<one short tip in ${LANG_NAME[input.sourceLanguage]}, or empty string>",
  "done": false
}
Set "done": true only when the scenario naturally concludes.`;
}

export interface DialogueResponse {
  reply: string;
  translation: string;
  feedback: string;
  done: boolean;
  hayqAward?: number;
}

export const continueDialogue = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DialogueInput.parse(data))
  .handler(async ({ data }): Promise<DialogueResponse> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: "(Nurik is offline — AI key not configured)",
        translation: "",
        feedback: "",
        done: false,
      };
    }

    const messages = [
      { role: "system", content: systemPrompt(data) },
      ...data.history.map((t) => ({
        role: t.role === "user" ? "user" : "assistant",
        content: t.text,
      })),
      { role: "user", content: data.userMessage },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted — please top up Lovable AI.");
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const json = await response.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";

    let parsed: DialogueResponse;
    try {
      const obj = JSON.parse(content.replace(/```json|```/g, "").trim());
      parsed = {
        reply: String(obj.reply ?? ""),
        translation: String(obj.translation ?? ""),
        feedback: String(obj.feedback ?? ""),
        done: Boolean(obj.done),
      };
    } catch {
      parsed = { reply: content.slice(0, 300), translation: "", feedback: "", done: false };
    }

    // Award 100 HAYQ on natural completion (client persists via wallet)
    if (parsed.done) parsed.hayqAward = 100;

    return parsed;
  });
