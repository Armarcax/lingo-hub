import { defineMcp } from "@lovable.dev/mcp-js";
import translateTool from "./tools/translate";
import listTopicsTool from "./tools/list-topics";
import generateLessonTool from "./tools/generate-lesson";

export default defineMcp({
  name: "nur-lingo-mcp",
  title: "NUR Lingo MCP",
  version: "0.1.0",
  instructions:
    "NUR Lingo tools for Armenian ↔ English ↔ Russian learning. Use `translate_word` to translate individual words, `list_topics` to browse curriculum topics, and `generate_lesson` to produce a full lesson (vocabulary + exercises) for any (topic, source, target) combo.",
  tools: [translateTool, listTopicsTool, generateLessonTool],
});
