"use client"

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const images = [
  "/characters/hidden_sand-shuriken-water.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r1ez7r5c2p537jdkev 4.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r1ez7r5c2p537jdkev 5.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r2f2gs7yrz4pjfesvk 3.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r2f2gs7yrz4pjfesvk 4.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r2f2gs7yrz4pjfesvk 5.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r4fc2ve2tvmz3sn4e6 2.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r4fc2ve2tvmz3sn4e6 3.png",
  "/characters/20250511_1158_NFT Game Characters_simple_compose_01jtzfw6r4fc2ve2tvmz3sn4e6 5.png",
  // Add more image URLs or import statements as needed
];

export default function ImageSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 100); // Switch every 1s, adjust as needed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[135px] h-50 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt={`frog-${index}`}
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
