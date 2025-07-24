"use client"

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CHARACTERS } from "@/lib/characters";

export default function ImageSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CHARACTERS.length);
    }, 100); // Switch every 1s, adjust as needed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[135px] h-50 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={CHARACTERS[index].id}
          src={`/characters/${CHARACTERS[index].id}.png`}
          alt={`${CHARACTERS[index].nickname}-image`}
          className="w-full h-full object-cover"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
        />
      </AnimatePresence>
    </div>
  );
}
