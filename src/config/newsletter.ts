export const NEWSLETTER_CONFIG = {
  endpoint: "/api/newsletter/subscribe",
  successMessage: "Thank you for subscribing!",
  errorMessage: "Something went wrong. Please try again.",
  placeholder: "Enter your email address...",
  buttonText: "Subscribe",
  storageKey: "nur_newsletter_subscribers_v1",
} as const;
