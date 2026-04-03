"use client";

import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { LayoutDashboard, Calendar, Flag, ClipboardList, Timer, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
}

export default function Sidebar({ currentView, setView }: SidebarProps) {
  const { data: session } = useSession();

  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: "today", icon: LayoutDashboard, label: "Daily Flow" },
    { id: "monthly", icon: Calendar, label: "Heatmap Matrix" },
    { id: "deadlines", icon: Flag, label: "Deadlines", href: "/deadlines" },
    { id: "today-tasks", icon: ClipboardList, label: "Today's Tasks", href: "/today-tasks" },
    { id: "pomodoro", icon: Timer, label: "Pomodoro", href: "/pomodoro" },
  ];

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion values for the cursor / fluid target
  const mouseX = useMotionValue(100);
  const mouseY = useMotionValue(200);

  // Multiple spring configs for a trailing fluid / liquid merging effect
  const springX1 = useSpring(mouseX, { stiffness: 80, damping: 15, mass: 1 });
  const springY1 = useSpring(mouseY, { stiffness: 80, damping: 15, mass: 1 });

  const springX2 = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 2 });
  const springY2 = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 2 });

  const springX3 = useSpring(mouseX, { stiffness: 30, damping: 25, mass: 3 });
  const springY3 = useSpring(mouseY, { stiffness: 30, damping: 25, mass: 3 });

  // Autonomous wandering when not hovered (smooth Lissajous curves)
  useEffect(() => {
    let animationFrameId: number;
    let time = Math.random() * 100; // Random starting point

    const animateFlow = () => {
      if (!isHovered && sidebarRef.current) {
        time += 0.012; // Speed of the autonomous flow
        const width = sidebarRef.current.clientWidth;
        const height = sidebarRef.current.clientHeight;
        
        // Complex smooth path
        const x = (Math.sin(time) * 0.35 + 0.5) * width;
        const y = (Math.cos(time * 0.7) * Math.sin(time * 0.5) * 0.35 + 0.5) * height;

        mouseX.set(x);
        mouseY.set(y);
      }
      animationFrameId = requestAnimationFrame(animateFlow);
    };

    animateFlow();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, mouseX, mouseY]);

  function handleMouseMove(e: React.MouseEvent) {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX.set(x);
      mouseY.set(y);
    }
  }

  return (
    <motion.aside 
      ref={sidebarRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed left-0 top-0 bottom-0 w-64 md:w-72 bg-[#030303] border-r border-white/5 z-50 flex flex-col justify-between py-10 overflow-hidden"
    >
{/* Massive Fluid Background Layer */}
      <svg className="hidden pointer-events-none absolute">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      {/* Autonomous flowing glowing liquid blobs container */}
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"    
        style={{ filter: "url(#gooey) drop-shadow(0 0 15px rgba(255,255,255,0.4))" }}
      >
        {/* Huge ambient mass blobs */}
        <motion.div
          animate={{ x: [0, 50, -20, 0], y: [0, 80, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-[-40px] w-32 h-32 bg-white rounded-full opacity-[0.4]"
        />
        <motion.div
          animate={{ x: [0, -60, 40, 0], y: [0, -100, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-0 w-40 h-48 bg-white rounded-full opacity-[0.3]"
        />
        <motion.div
          animate={{ x: [0, 80, -50, 0], y: [0, -40, 100, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-[-60px] w-36 h-36 bg-white rounded-full opacity-[0.3]"
        />

        {/* Mouse tracking fluid blobs */}
        <motion.div
          style={{ x: springX1, y: springY1, translateX: "-50%", translateY: "-50%" }}
          className="absolute top-0 left-0 w-16 h-16 bg-white rounded-full opacity-[0.5]"
        />
        <motion.div
          style={{ x: springX2, y: springY2, translateX: "-50%", translateY: "-50%" }}
          className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full opacity-[0.3]"
        />
        <motion.div
          style={{ x: springX3, y: springY3, translateX: "-50%", translateY: "-50%" }}
          className="absolute top-0 left-0 w-12 h-12 bg-white rounded-full opacity-[0.6]"
        />
      </div>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-3xl pointer-events-none" />

      {/* Main Content Layer */}
      <div className="flex flex-col h-full relative z-20">
        <div className="px-8 w-full">
          <div className="flex items-center gap-3 mb-16">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center">
               <div className="w-3 h-3 bg-zinc-300 rounded-sm animate-pulse" />
             </div>
             <h1 className="text-xl font-bold tracking-tighter text-white">
               FlowState
             </h1>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest pl-2 mb-4">Maps</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? pathname?.startsWith(item.href) : currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => (item.href ? router.push(item.href) : setView(item.id))}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative group",
                    isActive ? "text-white" : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10 transition-transform", isActive && "scale-110 text-white")} />
                  <span className="font-medium text-sm relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto px-8 w-full space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/5 relative overflow-hidden group mb-8">
             <div className="absolute inset-0 bg-white/5 blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
             <div className="relative z-10 flex flex-col gap-1">
               <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Operative</p>
               <p className="text-sm font-medium text-zinc-200 truncate">{session?.user?.name || "Initiate"}</p>
             </div>
          </div>

          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Disconnect</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}