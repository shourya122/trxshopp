import { useEffect, useRef, useState } from "react";

/**
 * Animated WebGL mesh-gradient shader — Linear / Vercel / Stripe / Arc style.
 * Flowing organic blobs over a near-black canvas + dot grid + film grain.
 * Falls back to a static gradient if WebGL is unavailable or reduced-motion.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0.,0.)), hash(i+vec2(1.,0.)), u.x),
             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;
  float t = u_t * 0.06;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p + 2.5*q + vec2(1.7, 9.2) + 0.15*t),
                fbm(p + 2.5*q + vec2(8.3, 2.8) - 0.13*t));
  float f = fbm(p + 2.0*r);
  vec3 base    = vec3(0.012, 0.012, 0.020);
  vec3 indigo  = vec3(0.10, 0.07, 0.32);
  vec3 violet  = vec3(0.42, 0.20, 0.78);
  vec3 cyan    = vec3(0.20, 0.55, 0.85);
  vec3 col = base;
  col = mix(col, indigo, smoothstep(0.20, 0.65, f));
  col = mix(col, violet, smoothstep(0.45, 0.80, f) * 0.85);
  col = mix(col, cyan,   smoothstep(0.65, 0.92, length(r)) * 0.35);
  col += vec3(0.05, 0.04, 0.10) * smoothstep(1.0, 0.0, uv.y) * 0.6;
  float vig = smoothstep(1.25, 0.25, length(p * vec2(0.85, 0.95)));
  col *= mix(0.45, 1.0, vig);
  float d = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  col += d;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas || reduce) { setSupported(false); return; }

    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    if (!gl) { setSupported(false); return; }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { setSupported(false); return; }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT = gl.getUniformLocation(prog, "u_t");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let running = true;

    const FRAME_MS = 1000 / 30; // cap shader at 30fps — fBm is GPU-heavy
    const tick = (now: number) => {
      if (!running) return;
      const elapsed = now - last;
      if (elapsed < FRAME_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(elapsed / 1000, 0.05);
      last = now;
      t += dt;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#040406]">
      {!supported && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 10%, rgba(66,40,150,0.45), transparent 70%), radial-gradient(55% 45% at 80% 20%, rgba(40,90,170,0.35), transparent 70%), radial-gradient(50% 50% at 50% 100%, rgba(80,30,120,0.30), transparent 70%)",
          }}
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: "block" }} />
      {/* dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 30%, transparent 80%)",
        }}
      />
      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#040406] to-transparent" />
    </div>
  );
}

export default AmbientBackground;
