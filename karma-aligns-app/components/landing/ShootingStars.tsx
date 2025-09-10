'use client';

import React, { useEffect, useRef, useState } from 'react';

type ShootingStarInstance = {
  id: number;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  life: number; // 0 to 1, how much life is left
  maxLife: number; // total duration in frames
  headRadius: number;
  tailLength: number;
  color: string;
};

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpr, setDpr] = useState(1);
  const shootingStars = useRef<ShootingStarInstance[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const nextStarId = useRef(0);

  // Function to create a new shooting star
  const createShootingStar = (width: number, height: number): ShootingStarInstance => {
    const id = nextStarId.current++;
    
    // Randomly decide if the star starts from the left or right
    const isStartingFromLeft = Math.random() < 0.5;
    const startX = isStartingFromLeft ? -10 : width + 10;
    const startY = Math.random() * height;

    // Angle the stars to travel generally left-to-right or right-to-left
    const angle = Math.random() * (Math.PI / 2) - Math.PI / 4; // Between -45 and 45 degrees
    const speed = 5 + Math.random() * 8; // Pixels per frame
    const vx = Math.cos(angle) * speed * (isStartingFromLeft ? 1 : -1);
    const vy = Math.sin(angle) * speed;

    const maxLife = Math.floor(60 + Math.random() * 80); // Shorter lifespan for shorter path
    const headRadius = 2 + Math.random() * 1.5;
    const tailLength = 60 + Math.random() * 90; // Shorter tail
    const hue = Math.random() * 30 + 200; // Bright white/blueish
    const color = `hsl(${hue}, 100%, 85%)`;

    return {
      id,
      x: startX,
      y: startY,
      vx,
      vy,
      life: 1, // Starts with full life
      maxLife,
      headRadius,
      tailLength,
      color,
    };
  };

  useEffect(() => {
    const updateDpr = () => setDpr(Math.min(2, window.devicePixelRatio || 1));
    updateDpr();

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `100vw`;
      canvas.style.height = `100vh`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnInterval = 3000 + Math.random() * 5000; // 3 to 8 seconds
    let lastSpawnTime = 0;

    const render = (currentTime: DOMHighResTimeStamp) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn new shooting stars
      if (currentTime - lastSpawnTime > spawnInterval && shootingStars.current.length < 3) {
        shootingStars.current.push(createShootingStar(width, height));
        lastSpawnTime = currentTime;
      }

      for (let i = shootingStars.current.length - 1; i >= 0; i--) {
        const star = shootingStars.current[i];

        // Update position and life
        star.x += star.vx;
        star.y += star.vy;
        star.life -= 1 / star.maxLife; // Decrease life over time

        // Remove if life is over or out of bounds
        if (star.life <= 0 || star.x > width + star.headRadius || star.x < -star.headRadius || star.y < -star.headRadius || star.y > height + star.headRadius) {
          shootingStars.current.splice(i, 1);
          continue;
        }

        const currentOpacity = star.life;
        ctx.globalAlpha = currentOpacity;
        ctx.lineCap = 'round';

        // Tail
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * star.tailLength * (1 - (1 - star.life) * 0.5), star.y - star.vy * star.tailLength * (1 - (1 - star.life) * 0.5)); // Tail shortens as life decreases
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.headRadius * 0.6; // Thicker tail
        
        // Brighter, shimmering tail effect
        const gradient = ctx.createLinearGradient(star.x, star.y, star.x - star.vx * star.tailLength, star.y - star.vy * star.tailLength);
        gradient.addColorStop(0, `${star.color}`); // Brightest at the head
        gradient.addColorStop(0.3, `hsla(${star.color.slice(4, -1)}, 0.6)`); // Shimmering mid-section
        gradient.addColorStop(1, `hsla(${star.color.slice(4, -1)}, 0)`); // Fades to transparent
        ctx.strokeStyle = gradient;
        ctx.stroke();

        // Head of the star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.headRadius * (0.8 + 0.2 * star.life), 0, Math.PI * 2); // Head shrinks slightly at the end
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.headRadius * 3;
        ctx.shadowColor = star.color;
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    resizeCanvas();
    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [dpr]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}