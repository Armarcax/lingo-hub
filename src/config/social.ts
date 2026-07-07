/**
 * NUR Lingo — Social media configuration.
 * Update these URLs in one place to change every reference across the app.
 */

export const SOCIAL_LINKS = {
  email: "contact@nurlingo.com",
  instagram: "https://instagram.com/nurlingo",
  facebook: "https://facebook.com/nurlingo",
  youtube: "https://youtube.com/@nurlingo",
  tiktok: "https://tiktok.com/@nurlingo",
  twitter: "https://twitter.com/nurlingo",
  linkedin: "https://linkedin.com/company/nurlingo",
  telegram: "https://t.me/nurlingo",
  spotify: "https://spotify.com/artist/nurlingo",
  website: "https://nurlingo.com",
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;

export const SOCIAL_ITEMS: { key: SocialKey; label: string; href: string }[] = [
  { key: "instagram", label: "Instagram", href: SOCIAL_LINKS.instagram },
  { key: "facebook",  label: "Facebook",  href: SOCIAL_LINKS.facebook  },
  { key: "youtube",   label: "YouTube",   href: SOCIAL_LINKS.youtube   },
  { key: "tiktok",    label: "TikTok",    href: SOCIAL_LINKS.tiktok    },
  { key: "twitter",   label: "Twitter",   href: SOCIAL_LINKS.twitter   },
  { key: "linkedin",  label: "LinkedIn",  href: SOCIAL_LINKS.linkedin  },
  { key: "telegram",  label: "Telegram",  href: SOCIAL_LINKS.telegram  },
  { key: "spotify",   label: "Spotify",   href: SOCIAL_LINKS.spotify   },
  { key: "email",     label: "Email",     href: `mailto:${SOCIAL_LINKS.email}` },
];
