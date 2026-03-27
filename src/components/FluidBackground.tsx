"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function FluidBackground() {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mouseX = useMotionValue(windowSize.width / 2);
  const mouseY = useMotionValue(windowSize.height / 2);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 300 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 300 });

  const offsetX1 = useTransform(smoothX, [0, windowSize.width], [-150, 150]);
  const offsetY1 = useTransform(smoothY, [0, windowSize.height], [-150, 150]);

  const offsetX2 = useTransform(smoothX, [0, windowSize.width], [200, -200]);
  const offsetY2 = useTransform(smoothY, [0, windowSize.height], [200, -200]);

  const offsetX3 = useTransform(smoothX, [0, windowSize.width], [-80, 80]);
  const offsetY3 = useTransform(smoothY, [0, windowSize.height], [80, -80]);

  const offsetX4 = useTransform(smoothX, [0, windowSize.width], [120, -120]);
  const offsetY4 = useTransform(smoothY, [0, windowSize.height], [-120, 120]);

  const offsetX5 = useTransform(smoothX, [0, windowSize.width], [-180, 180]);
  const offsetY5 = useTransform(smoothY, [0, windowSize.height], [180, -180]);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#050505] pointer-events-none overflow-hidden">
      {/* Gooey Filter Definition */}
      <svg className="hidden pointer-events-none absolute">
        <defs>
          <filter id="main-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -15" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      {/* Glowing Liquid Orbs (White and dispersed) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.25] mix-blend-screen"
        style={{ filter: "url(#main-gooey) drop-shadow(0 0 20px rgba(255,255,255,0.7))" }}
      >
        {/* Top Left */}
        <motion.div
          style={{ x: offsetX1, y: offsetY1 }}
          animate={{ scale: [1, 1.2, 0.9, 1], opacity: [0.6, 0.9, 0.5, 0.6] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] left-[5%] w-[22rem] h-[22rem] bg-white rounded-full blur-3xl"
        />
        {/* Center Right */}
        <motion.div
          style={{ x: offsetX2, y: offsetY2 }}
          animate={{ scale: [1, 0.85, 1.15, 1], opacity: [0.5, 0.8, 0.6, 0.5] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] right-[5%] w-[26rem] h-[26rem] bg-stone-300 rounded-full blur-3xl"
        />
        {/* Bottom Left */}
        <motion.div
          style={{ x: offsetX3, y: offsetY3 }}
          animate={{ scale: [1, 1.1, 0.95, 1], opacity: [0.7, 0.5, 0.8, 0.7] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[32rem] h-[32rem] bg-zinc-200 rounded-full blur-3xl"
        />
        {/* Top Right */}
        <motion.div
          style={{ x: offsetX4, y: offsetY4 }}
          animate={{ scale: [1, 1.25, 0.8, 1], opacity: [0.4, 0.7, 0.3, 0.4] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[30%] w-[20rem] h-[20rem] bg-white rounded-full blur-3xl"
        />
        {/* Bottom Right */}
        <motion.div
          style={{ x: offsetX5, y: offsetY5 }}
          animate={{ scale: [1, 0.9, 1.1, 1], opacity: [0.6, 0.9, 0.5, 0.6] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[15%] w-[28rem] h-[28rem] bg-slate-200 rounded-full blur-3xl"
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