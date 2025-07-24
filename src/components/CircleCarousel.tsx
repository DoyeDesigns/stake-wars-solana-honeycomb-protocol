"use client";

import { useEffect, useState } from "react";

const ITEM_COUNT = 12;
const ROTATION_INTERVAL = 100;

export default function CircleCarousel() {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => prev + (360 / ITEM_COUNT));
    }, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-fit h-fit flex items-center justify-center">
      <div className=" w-fit h-fit perspective-[1000px]">
        <div
          className="absolute -left-44 w-fit h-fit"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%, -50%) rotateX(-10deg)`,
          }}
        >
          {[...Array(ITEM_COUNT)].map((_, i) => {
            const rotation = (360 / ITEM_COUNT) * i + angle;
            const radians = (rotation * Math.PI) / 180;
            const radius = 130;

            const x = Math.sin(radians) * radius;
            const z = Math.cos(radians) * radius;

            const scale = 1 + z / 1000; // ⬅ subtle scale
            const blur = z < 0 ? Math.abs(z / 60) : 0; // reduced blur too
            const opacity = z < 0 ? 0.4 : 1;

            return (
              <div
                key={i}
                className="absolute size-11 bg-white rounded-full"
                style={{
                  transform: `
                    translate3d(${x}px, -50%, ${z}px)
                    scale(${scale})
                  `,
                  top: "50%",
                  left: "50%",
                  filter: `blur(${blur}px)`,
                  opacity,
                  transition: "transform 0.1s linear, opacity 0.1s linear, filter 0.1s linear",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
