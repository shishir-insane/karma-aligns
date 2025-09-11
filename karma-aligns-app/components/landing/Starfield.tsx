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
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  headRadius: number;
  tailLength: number;
  color: string;
};

type ConstellationStar = {
  x: number;
  y: number;
  twinkleDelay: number;
};

type Constellation = {
  name: string;
  offset: { x: number; y: number; };
  scale: number;
  stars: ConstellationStar[];
  lines: number[][];
};

const constellationsData: Constellation[] = [
  // Saptarishi / Big Dipper
  {
    name: "Saptarishi",
    offset: { x: 0.15, y: 0.20 },
    scale: 120,
    stars: [
      { x: 0.0, y: 0.60, twinkleDelay: 0.1 },
      { x: 0.15, y: 0.55, twinkleDelay: 0.5 },
      { x: 0.30, y: 0.48, twinkleDelay: 0.2 },
      { x: 0.45, y: 0.35, twinkleDelay: 0.7 },
      { x: 0.60, y: 0.40, twinkleDelay: 0.3 },
      { x: 0.75, y: 0.30, twinkleDelay: 0.8 },
      { x: 0.90, y: 0.20, twinkleDelay: 0.4 }
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]
    ]
  },
  // Leo (repositioned to be below the moon)
  {
    name: "Leo",
    offset: { x: 0.75, y: 0.45 }, // Moved further down and slightly left to avoid the moon and stay in free space
    scale: 100,
    stars: [
      { x: 0.10, y: 0.80, twinkleDelay: 0.6 }, // Denebola
      { x: 0.30, y: 0.60, twinkleDelay: 0.1 }, // Zosma
      { x: 0.45, y: 0.45, twinkleDelay: 0.9 }, // Chertan
      { x: 0.60, y: 0.40, twinkleDelay: 0.2 }, // Algieba
      { x: 0.75, y: 0.30, twinkleDelay: 0.5 }, // Adhafera
      { x: 0.90, y: 0.35, twinkleDelay: 0.3 }, // Regulus
      { x: 0.55, y: 0.65, twinkleDelay: 0.7 }  // Rasalas approx
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6]
    ]
  }
];

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpr, setDpr] = useState(1);
  
  const planets = useRef<Planet[]>([]);
  const shootingStars = useRef<ShootingStarInstance[]>([]);
  
  const animationFrameId = useRef<number | null>(null);
  const nextStarId = useRef(0);
  let lastSpawnTime = useRef(0);

  const createShootingStar = (width: number, height: number): ShootingStarInstance => {
    const id = nextStarId.current++;
    const isStartingFromLeft = Math.random() < 0.5;
    const startX = isStartingFromLeft ? -10 : width + 10;
    const startY = Math.random() * height;
    const angle = Math.random() * (Math.PI / 2) - Math.PI / 4;
    const speed = 5 + Math.random() * 8;
    const vx = Math.cos(angle) * speed * (isStartingFromLeft ? 1 : -1);
    const vy = Math.sin(angle) * speed;
    const maxLife = Math.floor(60 + Math.random() * 80);
    const headRadius = 2 + Math.random() * 1.5;
    const tailLength = 60 + Math.random() * 90;
    const hue = Math.random() * 30 + 200;
    const color = `hsl(${hue}, 100%, 85%)`;
    
    return { id, x: startX, y: startY, vx, vy, life: 1, maxLife, headRadius, tailLength, color };
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
      
      // Draw constellations
      constellationsData.forEach(constellation => {
        const baseOffsetX = constellation.offset.x * width;
        const baseOffsetY = constellation.offset.y * height;
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

        // Draw lines
        if (constellation.lines.length > 0) {
          ctx.beginPath();
          const firstStar = constellation.stars[constellation.lines[0][0]];
          ctx.moveTo(baseOffsetX + firstStar.x * constellation.scale, baseOffsetY + firstStar.y * constellation.scale);
          constellation.lines.forEach(line => {
            const endStar = constellation.stars[line[1]];
            ctx.lineTo(baseOffsetX + endStar.x * constellation.scale, baseOffsetY + endStar.y * constellation.scale);
          });
          ctx.stroke();
        }

        // Draw stars
        constellation.stars.forEach(star => {
          const x = baseOffsetX + star.x * constellation.scale;
          const y = baseOffsetY + star.y * constellation.scale;
          
          const twinkleFactor = Math.sin((currentTime * 0.001 + star.twinkleDelay * Math.PI * 2) * 0.5) * 0.3 + 0.7;
          ctx.globalAlpha = 0.6 * twinkleFactor;

          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Draw faded orbits
      ctx.globalAlpha = 0.1;
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

      // Spawn and draw shooting stars
      const spawnInterval = 3000 + Math.random() * 5000;
      if (currentTime - lastSpawnTime.current > spawnInterval && shootingStars.current.length < 3) {
        shootingStars.current.push(createShootingStar(width, height));
        lastSpawnTime.current = currentTime;
      }
      for (let i = shootingStars.current.length - 1; i >= 0; i--) {
        const star = shootingStars.current[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life -= 1 / star.maxLife;
        if (star.life <= 0 || star.x > width + star.headRadius || star.x < -star.headRadius || star.y < -star.headRadius || star.y > height + star.headRadius) {
          shootingStars.current.splice(i, 1);
          continue;
        }
        const currentOpacity = star.life;
        ctx.globalAlpha = currentOpacity;
        ctx.lineCap = 'round';
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
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.headRadius * (0.8 + 0.2 * star.life), 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.headRadius * 3;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.shadowBlur = 0;
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
      <div className="starfield-layer l1 absolute inset-0 animate-star-twinkle d0-5" />
      <div className="starfield-layer l2 absolute inset-0 animate-star-twinkle d1" />
      <div className="starfield-layer l3 absolute inset-0 animate-star-twinkle d1-5" />
      <div className="starfield-layer l4 absolute inset-0 animate-star-twinkle d2" />
      <div className="starfield-layer l5 absolute inset-0 animate-star-twinkle d2-5" />
      <div className="milkyway" />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
    </div>
  );
}