"use client";

import { motion } from "framer-motion";

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#030303] pointer-events-none overflow-hidden">
      {/* Gooey Filter Definition */}
      <svg className="hidden pointer-events-none absolute">
        <defs>
          <filter id="main-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      {/* Glowing Liquid Orbs */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-60"
        style={{ filter: "url(#main-gooey) drop-shadow(0 0 30px rgba(255,255,255,0.3))" }}
      >
        <motion.div
          animate={{
            x: ["0%", "20%", "-10%", "0%"],
            y: ["0%", "30%", "-20%", "0%"],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[30%] w-[30rem] h-[30rem] bg-indigo-500/30 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: ["0%", "-30%", "20%", "0%"],
            y: ["0%", "-20%", "40%", "0%"],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[20%] w-[35rem] h-[35rem] bg-purple-500/30 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: ["0%", "40%", "-30%", "0%"],
            y: ["0%", "-40%", "10%", "0%"],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[40%] w-[40rem] h-[40rem] bg-blue-500/30 rounded-full blur-2xl"
        />
      </div>

      {/* Subtle grain/noise overlay without lighting up the background */}
      <div 
        className="absolute inset-0 opacity-[0.03] z-10 mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}