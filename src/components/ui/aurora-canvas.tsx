import { useRef, useEffect } from "react";

const AuroraCanvas = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let animationFrameId = 0;

    const setCanvasSize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setCanvasSize();

    const ro = new ResizeObserver(setCanvasSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("resize", setCanvasSize);

    const colors = [
      { r: 45, g: 212, b: 191 },
      { r: 168, g: 85, b: 247 },
      { r: 59, g: 130, b: 246 },
      { r: 236, g: 72, b: 153 },
    ];

    const W = () => canvas.clientWidth;
    const H = () => canvas.clientHeight;

    class Orb {
      x: number; y: number; radius: number;
      color: { r: number; g: number; b: number };
      vx: number; vy: number;
      constructor() {
        this.x = Math.random() * W();
        this.y = Math.random() * H();
        this.radius = Math.random() * 400 + 100;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
      }
      draw() {
        const g = ctx!.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`);
        g.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
      update() {
        this.x += this.vx + Math.sin(time * 0.001) * 0.5;
        this.y += this.vy + Math.cos(time * 0.001) * 0.5;
        if (this.x < -this.radius || this.x > W() + this.radius || this.y < -this.radius || this.y > H() + this.radius) {
          this.x = Math.random() * W();
          this.y = Math.random() * H();
        }
      }
    }

    const orbs: Orb[] = Array.from({ length: 10 }, () => new Orb());

    const animate = () => {
      ctx.clearRect(0, 0, W(), H());
      time++;
      orbs.forEach((o) => { o.update(); o.draw(); });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};

export default AuroraCanvas;
