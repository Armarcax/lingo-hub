import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Bell, Clock, Coins, TrendingUp, CheckCircle, Zap, Leaf, Heart } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import {
  buyStreakFreeze,
  buyHeartRefill,
  syncHearts,
  type UserRewards,
} from "@/lib/rewards/seeds";
import Nuri, { NuriSpeech, type NuriMood } from "@/components/Nuri";
import {
  getNotificationTime,
  saveNotificationTime,
  requestNotificationPermission,
  getNotificationPermissionState,
} from "@/lib/notifications";

export const Route = createFileRoute("/garden")({
  head: () => ({
    meta: [
      { title: "Garden — NUR Lingo" },
      { name: "description", content: "Spend HAYQ on streak freezes, heart refills, and reminders." },
      { property: "og:title", content: "NUR Lingo Garden" },
      { property: "og:description", content: "Spend HAYQ in Nuri's greenhouse to keep your streak alive." },
    ],
  }),
  component: GardenPage,
});

interface ShopItem {
  id: "streak-freeze" | "heart-refill";
  name: string;
  description: string;
  price: number;
  maxOwned: number;
  owned: number;
  badge: string;
  bgGradient: string;
}

function GardenPage() {
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [notifTime, setNotifTime] = useState("09:00");
  const [notifState, setNotifState] = useState<NotificationPermission>("default");
  const [nuriMood, setNuriMood] = useState<NuriMood>("happy");

  useEffect(() => {
    setRewards(syncHearts());
    setNotifTime(getNotificationTime());
    setNotifState(getNotificationPermissionState());
  }, []);

  const showMessage = (text: string, type: "success" | "error" | "info" = "info") => {
    setMessage(text);
    setMessageType(type);
    setNuriMood(type === "success" ? "excited" : type === "error" ? "sad" : "happy");
    setTimeout(() => {
      setMessage("");
      setNuriMood("happy");
    }, 3000);
  };

  if (!rewards) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="opacity-60">Loading garden...</p>
      </div>
    );
  }

  const shopItems: ShopItem[] = [
    {
      id: "streak-freeze",
      name: "Streak Freeze",
      description: "Պահպանիր քո streak-ը, եթե մոռանաս սովորել",
      price: 50,
      maxOwned: 2,
      owned: rewards.streakFreeze,
      badge: "🛡️",
      bgGradient: "from-blue-500/20 to-blue-600/10",
    },
    {
      id: "heart-refill",
      name: "Heart Refill",
      description: "Անմիջապես վերականգնիր բոլոր 3 սրտերը",
      price: 100,
      maxOwned: 3,
      owned: rewards.hearts,
      badge: "❤️",
      bgGradient: "from-red-500/20 to-red-600/10",
    },
  ];

  const handleBuy = (id: ShopItem["id"]) => {
    const res = id === "streak-freeze" ? buyStreakFreeze() : buyHeartRefill();
    if (res.success) {
      setRewards(res.rewards);
      showMessage(
        id === "streak-freeze" ? "🛡️ Streak Freeze purchased!" : "❤️ Hearts refilled!",
        "success",
      );
    } else {
      showMessage(res.error ?? "Failed to purchase", "error");
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifState(granted ? "granted" : "denied");
    showMessage(
      granted ? "🔔 Notifications enabled!" : "⚠️ Allow notifications in your browser settings.",
      granted ? "success" : "error",
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl">
              🌿
            </div>
            <div>
              <h1 className="text-lg font-bold">Garden Shop</h1>
              <p className="text-[10px] opacity-60 uppercase tracking-wider">Nuri's Greenhouse</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-yellow-500/10 flex items-center gap-1.5 border border-yellow-500/20">
              <Coins size={14} className="text-yellow-500" />
              <span className="text-sm font-bold">{rewards.totalHAYQ}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Nuri mood={nuriMood} size={120} glow={nuriMood === "excited"} />
          <NuriSpeech
            text={
              nuriMood === "excited"
                ? "Հիանալի գնում! 🌟"
                : nuriMood === "sad"
                ? "Մի տխրիր, ավելի շատ HAYQ վաստակիր! 💪"
                : "Բարի գալուստ իմ այգի: Ծախսիր HAYQ-ն օգտակար բաների վրա! 🌿"
            }
            mood={nuriMood}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard icon={<Zap size={16} />} value={rewards.streak} label="Streak" color="text-amber-500" />
          <StatCard icon={<Coins size={16} />} value={rewards.totalHAYQ} label="HAYQ" color="text-yellow-500" />
          <StatCard icon={<Leaf size={16} />} value={rewards.totalSeeds} label="Սերմեր" color="text-emerald-500" />
        </div>

        <div className="space-y-4">
          {shopItems.map((item, index) => {
            const isMaxed = item.owned >= item.maxOwned;
            const canAfford = rewards.totalHAYQ >= item.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl p-5 border border-border/50 bg-gradient-to-br ${item.bgGradient} backdrop-blur-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-background/40">
                    {item.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{item.name}</h3>
                      {isMaxed && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          MAX
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-70">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm opacity-70">
                      <span className="flex items-center gap-1">
                        <Coins size={14} className="text-yellow-500" /> {item.price}
                      </span>
                      <span>
                        📦 {item.owned}/{item.maxOwned}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id)}
                    disabled={isMaxed || !canAfford}
                    className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition"
                  >
                    {isMaxed ? "✅" : `${item.price} 🪙`}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-2xl p-5 mt-6 border border-border/50 bg-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold">Daily Reminders</h3>
              <p className="text-sm opacity-70">Ստացիր օրական հիշեցումներ՝ չմոռանալու համար:</p>

              {notifState !== "granted" ? (
                <button
                  onClick={handleEnableNotifications}
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2"
                >
                  <Bell size={16} /> Միացնել ծանուցումները
                </button>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="flex items-center gap-2 text-sm opacity-70">
                    <Clock size={16} /> Հիշեցման ժամը
                  </span>
                  <input
                    type="time"
                    value={notifTime}
                    onChange={(e) => {
                      setNotifTime(e.target.value);
                      saveNotificationTime(e.target.value);
                      showMessage("⏰ Notification time updated!", "success");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-background border border-border font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle size={14} /> Ակտիվ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl max-w-sm text-center backdrop-blur-xl border ${
                messageType === "success"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-100"
                  : messageType === "error"
                  ? "bg-red-500/20 border-red-500/40 text-red-100"
                  : "bg-blue-500/20 border-blue-500/40 text-blue-100"
              }`}
            >
              <p className="text-sm font-medium">{message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl p-3 text-center border border-border/50 bg-background/40">
      <div className={`flex items-center justify-center gap-1 ${color}`}>
        {icon}
        <span className="text-lg font-bold text-foreground">{value}</span>
      </div>
      <p className="text-[10px] opacity-60 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
