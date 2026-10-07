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
  const sh = gl.createShader(type);
  if (!sh) return null;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) { setSupported(false); return; }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) { setSupported(false); return; }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setSupported(false);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT = gl.getUniformLocation(prog, "u_t");
    let t = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let lost = false;
    const draw = () => {
      if (lost) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Render at bounded resolution rather than full device resolution.
      const scale = Math.min(1, 960 / Math.max(rect.width, rect.height, 1));
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const tick = (now: number) => {
      if (now - last >= 1000 / 24) {
        t += Math.min((now - last) / 1000, 0.1);
        last = now;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      if (!lost && !document.hidden && visible) {
        raf = requestAnimationFrame(tick);
      } else draw();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      setSupported(false);
      cancelAnimationFrame(raf);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    const visibility = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    }, { rootMargin: "100px" });
    visibility?.observe(canvas);
    canvas.addEventListener("webglcontextlost", onLost);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    window.addEventListener("resize", resize);
    resize();
    sync();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      visibility?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      window.removeEventListener("resize", resize);
      if (!lost) {
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <div aria-hidden className="ambient-background pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="ambient-fallback absolute inset-0" />
      <canvas ref={canvasRef} className={`absolute inset-0 block h-full w-full ${supported ? "" : "invisible"}`} />
      <div className="ambient-dots absolute inset-0" />
      <div className="ambient-fade absolute inset-x-0 bottom-0 h-72" />
    </div>
  );
}

export default AmbientBackground;
