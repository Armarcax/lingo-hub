import { SOCIAL_ITEMS, SOCIAL_LINKS } from "@/config/social";
import { NewsletterForm } from "@/components/Newsletter/NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">NUR Lingo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Armenian-first multilingual learning with AI, dialogues, and HAYQ rewards.
          </p>
          <a
            href={SOCIAL_LINKS.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            nurlingo.com
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Follow us</h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SOCIAL_ITEMS.map((s) => (
              <li key={s.key}>
                <a
                  href={s.href}
                  target={s.key === "email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Stay updated</h4>
          <p className="mt-2 text-xs text-muted-foreground">
            Get lesson drops, new dialogues, and HAYQ events in your inbox.
          </p>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NUR Lingo. All rights reserved.
      </div>
    </footer>
  );
}
