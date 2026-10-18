"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Animated "warped gradient field", ported from gradient.html (Portfolio 2026): a blurred colour
// source is resampled every frame through layered noise (fbm domain warp + slow simplex drift),
// with film grain on top. Raw WebGL; the shader maths is the reference's, unchanged.
//
//  - Fills its parent (absolute, inset 0) — give the parent position: relative and a size.
//  - Runs its own requestAnimationFrame loop; pauses offscreen and in hidden tabs.
//  - Reduced motion: one still frame. No WebGL: a CSS linear-gradient of the same colours.
//  - Motion only fades the canvas in once the first frame has drawn, so it never flashes empty.

type Props = {
  colors?: string[];
  speed?: number;
  warp?: number;
  grain?: number;
  className?: string;
};

const DEFAULT_COLORS = ["#c64a24", "#ef8a4b", "#f3b8a0", "#c55a8b", "#5f3a9c"];

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime, uWarp, uGrain;

vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0,0.5,1.0,2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + 2.0*C.xxx; vec3 x3 = x0 - 1.0 + 3.0*C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0,i1.z,i2.z,1.0)) + i.y + vec4(0.0,i1.y,i2.y,1.0)) + i.x + vec4(0.0,i1.x,i2.x,1.0));
  float n_ = 1.0/7.0; vec3 ns = n_*D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z); vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy; vec4 y = y_*ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0+1.0; vec4 s1 = floor(b1)*2.0+1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0); m = m*m;
  return 42.0*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float random(vec2 st){ return fract(sin(dot(st, vec2(12.9898,78.233)))*43758.5453123); }
float noise(vec2 st){
  vec2 i = floor(st), f = fract(st);
  float a = random(i), b = random(i+vec2(1,0)), c = random(i+vec2(0,1)), d = random(i+vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 st){
  float v = 0.0, a = 0.5; vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i){ v += a*noise(st); st = rot*st*2.0 + shift; a *= 0.5; }
  return v;
}
vec2 hash(vec2 p){ p = vec2(dot(p, vec2(2127.1,81.17)), dot(p, vec2(1269.5,283.37))); return fract(sin(p)*43758.5453); }
vec3 saturation(vec3 c, float s){ return mix(vec3(dot(c, vec3(0.2125,0.7154,0.0721))), c, s); }

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float t = uTime;

  // Domain-warped fbm (Inigo Quilez style), same constants as the original
  vec2 fuv = vec2(uv.x*aspect, uv.y) * 3.25 * 0.5;
  vec2 q = vec2(fbm(fuv), fbm(fuv + vec2(1.0)));
  float t2 = t * 4.5 * 0.5;
  vec2 r = vec2(fbm(fuv + q + vec2(91.3, 0.55) + 0.15*t2),
                fbm(fuv + q - vec2(45.33, 1.2) + 0.126*t2));
  float f = fbm(fuv + r);

  // Slow simplex drift
  float nx = snoise(vec3(uv*0.65, t*0.25*0.5));
  float ny = snoise(vec3(uv*0.65 + vec2(54.0), t*0.25));

  uv += vec2(nx, ny) * 0.15 * uWarp;
  uv += (vec2(f, r.x) - 0.5) * 0.35 * uWarp;

  vec3 col = texture2D(uTex, uv).rgb;

  // Film grain, multiply-blended and re-rolled every frame
  float grain = length(hash(vUv + mod(t*7.0, 1.0)));
  col = mix(col, col * grain, uGrain);

  col = saturation(col, 1.05);
  col *= 1.15; // exposure
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// The soft, blurry colour image the shader resamples (as in the reference)
function paintSource(cols: string[]) {
  const src = document.createElement("canvas");
  src.width = src.height = 512;
  const sctx = src.getContext("2d")!;
  sctx.filter = "none";
  const g = sctx.createLinearGradient(0, 0, 512, 0);
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  sctx.fillStyle = g; sctx.fillRect(0, 0, 512, 512);
  // a few large blobs so the source isn't perfectly uniform top to bottom
  const blobs: [number, number, string][] = [[0.28, 0.25, cols[1]], [0.62, 0.78, cols[2]], [0.85, 0.3, cols[4]], [0.12, 0.85, cols[0]]];
  blobs.forEach(([x, y, c]) => {
    const r = sctx.createRadialGradient(x * 512, y * 512, 0, x * 512, y * 512, 220);
    r.addColorStop(0, c); r.addColorStop(1, c + "00");
    sctx.fillStyle = r; sctx.fillRect(0, 0, 512, 512);
  });
  // blur pass
  const tmp = document.createElement("canvas"); tmp.width = tmp.height = 512;
  const t = tmp.getContext("2d")!; t.drawImage(src, 0, 0);
  sctx.filter = "blur(36px)"; sctx.drawImage(tmp, 0, 0);
  sctx.filter = "none";
  return src;
}

export function GradientField({ colors = DEFAULT_COLORS, speed = 1.4, warp = 1.0, grain = 0.17, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);
  // Live values for the running loop, without restarting WebGL when a prop changes
  const live = useRef({ speed, warp, grain });
  useEffect(() => { live.current = { speed, warp, grain }; }, [speed, warp, grain]);
  const colorKey = colors.join(",");

  useEffect(() => {
    const canvas = ref.current!;
    // preserveDrawingBuffer: the work deck's pixel effect snapshots this canvas
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) {
      const id = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(id);
    }
    const cols = colorKey.split(",");

    const compile = (type: number, s: string) => {
      const sh = gl.createShader(type)!; gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uWarp = U("uWarp"), uGrain = U("uGrain");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, paintSource(cols));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    };
    resize();

    let t = 3.7, last = performance.now(), raf = 0, first = true;
    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uWarp, live.current.warp);
      gl.uniform1f(uGrain, live.current.grain);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (first) { first = false; requestAnimationFrame(() => setDrawn(true)); }   // fade in once there's a frame
    };

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let onScreen = true;
    const running = () => !reduce && onScreen && document.visibilityState === "visible";
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      t += dt * 1.4 * live.current.speed * 0.5;
      draw();
      if (running()) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !running()) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const ro = new ResizeObserver(() => { resize(); if (!raf) draw(); });   // keep a still frame sharp at the new size
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); else stop(); });
    io.observe(canvas);
    const onVis = () => (document.visibilityState === "visible" ? start() : stop());
    document.addEventListener("visibilitychange", onVis);

    draw();          // the first (or, with reduced motion, the only) frame
    start();

    return () => {
      stop();
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
      gl.deleteBuffer(buf); gl.deleteTexture(tex);
    };
  }, [colorKey]);

  if (failed) {
    return (
      <div className={`gradient-field ${className}`} aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${colors.join(", ")})` }} />
    );
  }
  return (
    <motion.canvas
      ref={ref}
      className={`gradient-field ${className}`}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: drawn ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
  );
}
