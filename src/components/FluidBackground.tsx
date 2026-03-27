"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function FluidBackground() {
  const [isHovered, setIsHovered] = useState(false);
  
  // Motion values for the cursor / fluid target
  const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 500);
  const mouseY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 500);

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
      if (!isHovered) {
        time += 0.012; // Speed of the autonomous flow
        const width = document.documentElement.clientWidth;
        const height = window.innerHeight;
        
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

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      setIsHovered(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsHovered(false), 2000); // Resume autonomous flow after 2s of inactivity
    };

    const handleMouseLeave = () => setIsHovered(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timeout);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 z-0 bg-[#030303] pointer-events-none overflow-hidden">
      {/* Massive Fluid Background Layer */}
      <svg className="hidden pointer-events-none absolute">
        <defs>
          <filter id="main-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      {/* Autonomous flowing glowing liquid blobs container */}
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"    
        style={{ filter: "url(#main-gooey) drop-shadow(0 0 15px rgba(255,255,255,0.4))" }}
      >
        {/* Huge ambient mass blobs */}
        <motion.div
          animate={{ x: [0, 50, -20, 0], y: [0, 80, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] w-32 h-32 bg-white rounded-full opacity-[0.4]"
        />
        <motion.div
          animate={{ x: [0, -60, 40, 0], y: [0, -100, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 right-[10%] w-40 h-48 bg-white rounded-full opacity-[0.3]"
        />
        <motion.div
          animate={{ x: [0, 80, -50, 0], y: [0, -40, 100, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[30%] w-36 h-36 bg-white rounded-full opacity-[0.3]"
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
      <div 
        className="absolute inset-0 opacity-[0.03] z-10 mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}





