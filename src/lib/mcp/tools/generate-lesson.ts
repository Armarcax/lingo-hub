import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { TOPICS } from "@/lib/curriculum/topics";
import { buildLesson } from "@/lib/curriculum/builder";

const Lang = z.enum(["en", "hy", "ru"]);

export default defineTool({
  name: "generate_lesson",
  title: "Generate a lesson",
  description:
    "Generate a NUR Lingo lesson (vocabulary + phrases + exercises) for a given topic and language pair.",
  inputSchema: {
    topicId: z
      .string()
      .describe("Topic id from list_topics (e.g. 'food_dining', 'family')."),
    source: Lang.describe("Learner's native language code (en | hy | ru)."),
    target: Lang.describe("Language being learned (en | hy | ru)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ topicId, source, target }) => {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) {
      return {
        content: [{ type: "text", text: `Unknown topic '${topicId}'. Use list_topics.` }],
        isError: true,
      };
    }
    const lesson = buildLesson(topic, source, target, 0);
    return {
      content: [{ type: "text", text: JSON.stringify(lesson, null, 2) }],
      structuredContent: { lesson },
    };
  },
});
