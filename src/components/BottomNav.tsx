import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";

export default function BottomNav() {
  const pathname = useLocation().pathname;

  const navItems = [
    { label: "Home", to: "/" as const, icon: "🏠" },
    { label: "World", to: "/world" as const, icon: "🌍" },
    { label: "Dict", to: "/dictionary" as const, icon: "📖" },
    { label: "Garden", to: "/garden" as const, icon: "🌿" },
    { label: "Setup", to: "/onboarding" as const, icon: "⚙️" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-background/85 backdrop-blur-xl border-t border-border/50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className="relative group">
              <div className="flex flex-col items-center gap-1">
                <span className={`text-2xl transition-transform ${isActive ? "scale-125" : "group-hover:scale-110 opacity-50"}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-foreground" : "text-foreground/40"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
