/**
 * NUR Lingo — Notifications System
 * Handles web push registration and localized notification content.
 */

import { LangCode } from "./i18n/index";

export const NOTIFICATION_CONTENT: Record<LangCode, { title: string; body: string }> = {
  hy: {
    title: "Նուռիկ 🍎",
    body: "Նուռիկը սպասում է քեզ: Սովորե՞նք հայերեն:",
  },
  ru: {
    title: "Нурик 🍎",
    body: "Нурик ждёт тебя! Не теряй серию 🔥",
  },
  en: {
    title: "Nuri 🍎",
    body: "Nuri misses you! Keep your streak alive 🍎",
  },
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
}

export function saveNotificationTime(time: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("nur_notification_time", time);
  }
}

export function getNotificationTime(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("nur_notification_time") || "09:00";
  }
  return "09:00";
}
