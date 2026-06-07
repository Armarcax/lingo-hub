import { createFileRoute } from "@tanstack/react-router";
import { fullValidationWithAI } from "@/lib/ai/evaluator";

export const Route = createFileRoute("/api/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();

          if (body.legacy) {
            const correct =
              body.userAnswer.trim().toLowerCase() ===
              body.expectedAnswer.trim().toLowerCase();
            return Response.json({
              accepted: correct,
              score: correct ? 1.0 : 0,
              layer: "exact_match",
              feedback: correct ? "Correct!" : "Try again",
            });
          } else {
            const aiResult = await fullValidationWithAI({
              userAnswer: body.userAnswer,
              expectedAnswer: body.expectedAnswer,
              sourceSentence: body.englishOriginal,
              sourceLanguage: body.sourceLanguage || "en",
              targetLanguage: body.targetLanguage || "hy",
              allValidForms: body.allValidAnswers,
            });

            return Response.json(aiResult);
          }
        } catch (error) {
          console.error("[NUR Lingo API Error]:", error);
          return Response.json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
