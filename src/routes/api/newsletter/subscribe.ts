import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Placeholder newsletter subscription endpoint.
 * Swap the in-memory list for Mailchimp / SendGrid / Supabase when ready.
 */
const bodySchema = z.object({
  email: z.string().trim().email().max(255),
});

// Module-scoped ephemeral store (per-worker instance, lost on reload).
const subscribers = new Set<string>();

export const Route = createFileRoute("/api/newsletter/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
        }
        subscribers.add(parsed.data.email);
        return Response.json({ ok: true });
      },
      GET: async () => Response.json({ ok: true, count: subscribers.size }),
    },
  },
});
