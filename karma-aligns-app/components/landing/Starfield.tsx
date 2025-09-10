'use client';

import React, { useEffect, useRef, useState } from 'react';

type Planet = {
  orbitalRadius: number;
  speed: number;
  radius: number;
  color: string;
  angle: number;
};

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

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpr, setDpr] = useState(1);
  
  const planets = useRef<Planet[]>([]);
  const shootingStars = useRef<ShootingStarInstance[]>([]);
  
  const animationFrameId = useRef<number | null>(null);
  const nextStarId = useRef(0);
  let lastSpawnTime = useRef(0);

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

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `100vw`;
      canvas.style.height = `100vh`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize planets with their orbital data
      const centralPoint = Math.min(width, height) * 0.15;
      planets.current = [
        { orbitalRadius: centralPoint * 1.5, speed: 0.005, radius: 2.6, color: "#d0e8ff", angle: Math.random() * Math.PI * 2 },
        { orbitalRadius: centralPoint * 2.2, speed: 0.003, radius: 3.2, color: "#ffd6a5", angle: Math.random() * Math.PI * 2 },
        { orbitalRadius: centralPoint * 3.0, speed: 0.002, radius: 3.8, color: "#ffb3c1", angle: Math.random() * Math.PI * 2 },
        { orbitalRadius: centralPoint * 3.8, speed: 0.0015, radius: 4.4, color: "#c7ffd8", angle: Math.random() * Math.PI * 2 },
      ];
    };

    const render = (currentTime: DOMHighResTimeStamp) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Draw faded orbits first
      ctx.globalAlpha = 0.1; // Faint orbits
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      
      planets.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, p.orbitalRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw planets
      ctx.globalCompositeOperation = "lighter";
      planets.current.forEach(p => {
        p.angle += p.speed;
        const x = width / 2 + p.orbitalRadius * Math.cos(p.angle);
        const y = height / 2 + p.orbitalRadius * Math.sin(p.angle);
        
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(x, y, p.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spawn new shooting stars
      const spawnInterval = 3000 + Math.random() * 5000; // 3 to 8 seconds
      if (currentTime - lastSpawnTime.current > spawnInterval && shootingStars.current.length < 3) {
        shootingStars.current.push(createShootingStar(width, height));
        lastSpawnTime.current = currentTime;
      }
      
      // Draw shooting stars
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
        ctx.lineTo(star.x - star.vx * star.tailLength * (1 - (1 - star.life) * 0.5), star.y - star.vy * star.tailLength * (1 - (1 - star.life) * 0.5));
        ctx.lineWidth = star.headRadius * 0.6;
        
        const gradient = ctx.createLinearGradient(star.x, star.y, star.x - star.vx * star.tailLength, star.y - star.vy * star.tailLength);
        gradient.addColorStop(0, `${star.color}`);
        gradient.addColorStop(0.3, `hsla(${star.color.slice(4, -1)}, 0.6)`);
        gradient.addColorStop(1, `hsla(${star.color.slice(4, -1)}, 0)`);
        ctx.strokeStyle = gradient;
        ctx.stroke();

        // Head of the star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.headRadius * (0.8 + 0.2 * star.life), 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.headRadius * 3;
        ctx.shadowColor = star.color;
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow
      }

      ctx.restore();
      animationFrameId.current = requestAnimationFrame(render);
    };

    const onResize = () => init();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    init();
    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [dpr]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Existing animated parallax layers */}
      <div className="starfield-layer l1 absolute inset-0 animate-star-twinkle d0-5" />
      <div className="starfield-layer l2 absolute inset-0 animate-star-twinkle d1" />
      <div className="starfield-layer l3 absolute inset-0 animate-star-twinkle d1-5" />
      <div className="starfield-layer l4 absolute inset-0 animate-star-twinkle d2" />
      <div className="starfield-layer l5 absolute inset-0 animate-star-twinkle d2-5" />
      <div className="milkyway" />

      {/* Canvas for planets, orbits, and shooting stars */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />

      {/* Existing constellation SVGs */}
      <svg className="constellation-float absolute left-6 top-24 opacity-90" width="420" height="180" viewBox="0 0 420 180">
        <g fill="none" stroke="white" strokeOpacity="0.75">
          <circle cx="20" cy="120" r="3.0" className="star-twinkle d1" fill="white" />
          <circle cx="80" cy="110" r="3.0" className="star-twinkle" fill="white" />
          <circle cx="140" cy="95" r="3.0" className="star-twinkle d2" fill="white" />
          <circle cx="210" cy="70" r="3.0" className="star-twinkle d3" fill="white" />
          <circle cx="260" cy="80" r="3.0" className="star-twinkle" fill="white" />
          <circle cx="330" cy="60" r="3.0" className="star-twinkle d1" fill="white" />
          <circle cx="390" cy="40" r="3.0" className="star-twinkle d2" fill="white" />
          <path d="M20 120 L80 110 L140 95 L210 70 L260 80 L330 60 L390 40" className="path-travel" strokeWidth="1.5" />
        </g>
      </svg>
      <svg className="absolute right-20 top-40 opacity-90" width="380" height="220" viewBox="0 0 380 220">
        <g fill="none" stroke="white">
          <circle cx="40" cy="160" r="3.0" className="star-twinkle d3" fill="white" />
          <circle cx="110" cy="120" r="3.0" className="star-twinkle d1" fill="white" />
          <circle cx="160" cy="90" r="3.0" className="star-twinkle d2" fill="white" />
          <circle cx="210" cy="80" r="3.0" className="star-twinkle" fill="white" />
          <circle cx="250" cy="60" r="3.0" className="star-twinkle d3" fill="white" />
          <circle cx="300" cy="70" r="3.0" className="star-twinkle d1" fill="white" />
          <circle cx="200" cy="130" r="3.0" className="star-twinkle d2" fill="white" />
          <path
            d="M40 160 L110 120 L160 90 L210 80 L250 60 L300 70 M210 80 L200 130"
            stroke="white"
            strokeOpacity="0.75"
            className="path-travel"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}