import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { translate } from "@/lib/translation/provider";

const Lang = z.enum(["en", "hy", "ru"]);

export default defineTool({
  name: "translate_word",
  title: "Translate a word",
  description:
    "Translate a single word or short phrase between English (en), Armenian (hy), and Russian (ru) using the NUR Lingo dictionary.",
  inputSchema: {
    text: z.string().min(1).describe("Word or short phrase to translate."),
    source: Lang.describe("Source language code: en | hy | ru."),
    target: Lang.describe("Target language code: en | hy | ru."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ text, source, target }) => {
    const result = await translate(text, source, target);
    if (!result) {
      return {
        content: [{ type: "text", text: `No dictionary entry for "${text}" (${source} → ${target}).` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: result }],
      structuredContent: { source, target, input: text, translation: result },
    };
  },
});
