import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { TOPICS } from "@/lib/curriculum/topics";

export default defineTool({
  name: "list_topics",
  title: "List curriculum topics",
  description:
    "List every NUR Lingo curriculum topic (module) with its icon and trilingual titles (en/hy/ru).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const topics = TOPICS.map((t) => ({
      id: t.id,
      icon: t.icon,
      title: t.title,
      wordCount: t.words.length,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(topics, null, 2) }],
      structuredContent: { topics },
    };
  },
});
