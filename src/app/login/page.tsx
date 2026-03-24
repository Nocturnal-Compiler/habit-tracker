"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import FluidBackground from "@/components/FluidBackground";
import AnimatedTitle from "@/components/AnimatedTitle";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/"
    });

    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden text-zinc-50 font-sans">
      <FluidBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full max-w-md bg-zinc-900/40 border border-white/10 p-8 rounded-2xl backdrop-blur-3xl shadow-2xl relative z-10"
      >
        <div className="absolute inset-0 bg-white/5 rounded-2xl pointer-events-none" />
        
        <AnimatedTitle 
          text="FlowState" 
          className="text-4xl font-extrabold tracking-tighter mb-2 text-white" 
        />
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-zinc-400 mb-8 font-medium text-sm"
        >
          Enter your credentials to enter the flow. (If account doesn't exist, we will create one for you on the fly).
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email Space</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono text-sm"
              placeholder="neo@matrix.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Passphrase</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-white text-black font-bold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : "Synchronize"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}