import{at as e,it as t,n,ot as r,st as i}from"./react-C3rbVDK1.js";var a=e(),o=i(r(),1),s=t(),c=[`#c64a24`,`#ef8a4b`,`#f3b8a0`,`#c55a8b`,`#5f3a9c`],l={position:`absolute`,inset:0,width:`100%`,height:`100%`,display:`block`},u=`attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`,d=`
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
}`;function f(e,t){let n=e.getContext(`2d`);n.filter=`none`;let r=n.createLinearGradient(0,0,512,0);t.forEach((e,n)=>r.addColorStop(n/(t.length-1),e)),n.fillStyle=r,n.fillRect(0,0,512,512),[[.28,.25,t[1]],[.62,.78,t[2]],[.85,.3,t[4]],[.12,.85,t[0]]].forEach(([e,t,r])=>{let i=n.createRadialGradient(e*512,t*512,0,e*512,t*512,220);i.addColorStop(0,r),i.addColorStop(1,r+`00`),n.fillStyle=i,n.fillRect(0,0,512,512)});let i=document.createElement(`canvas`);i.width=i.height=512,i.getContext(`2d`).drawImage(e,0,0),n.filter=`blur(36px)`,n.drawImage(i,0,0),n.filter=`none`}function p({colors:e=c,speed:t=1.4,warp:r=1,grain:i=.17,className:a}){let p=(0,o.useRef)(null),[m,h]=(0,o.useState)(!1),[g,_]=(0,o.useState)(!1),v=(0,o.useRef)({speed:t,warp:r,grain:i}),y=e.join(`,`);return(0,o.useEffect)(()=>{v.current={speed:t,warp:r,grain:i}},[t,r,i]),(0,o.useEffect)(()=>{let e=p.current;if(!e)return;let t=e.getContext(`webgl`,{antialias:!1,premultipliedAlpha:!1});if(!t){_(!0);return}let n=(e,n)=>{let r=t.createShader(e);return t.shaderSource(r,n),t.compileShader(r),t.getShaderParameter(r,t.COMPILE_STATUS)||console.error(t.getShaderInfoLog(r)),r},r=n(t.VERTEX_SHADER,u),i=n(t.FRAGMENT_SHADER,d),a=t.createProgram();t.attachShader(a,r),t.attachShader(a,i),t.linkProgram(a),t.useProgram(a);let o=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);let s=t.getAttribLocation(a,`p`);t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0);let c=e=>t.getUniformLocation(a,e),l=c(`uRes`),m=c(`uTime`),g=c(`uWarp`),b=c(`uGrain`),x=t.createTexture();t.bindTexture(t.TEXTURE_2D,x),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.MIRRORED_REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.MIRRORED_REPEAT);let S=document.createElement(`canvas`);S.width=S.height=512,f(S,y.split(`,`)),t.texImage2D(t.TEXTURE_2D,0,t.RGB,t.RGB,t.UNSIGNED_BYTE,S);let C=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,w=3.7,T=performance.now(),E=0,D=!0,O=!1,k=()=>{t.uniform2f(l,e.width,e.height),t.uniform1f(m,w),t.uniform1f(g,v.current.warp),t.uniform1f(b,v.current.grain),t.drawArrays(t.TRIANGLES,0,3),O||(O=!0,h(!0))},A=()=>{let n=Math.min(window.devicePixelRatio||1,1.5),r=Math.round(e.clientWidth*n),i=Math.round(e.clientHeight*n);(e.width!==r||e.height!==i)&&(e.width=r,e.height=i),t.viewport(0,0,r,i),C&&k()},j=e=>{let t=Math.min((e-T)/1e3,.05);T=e,w+=t*1.4*v.current.speed*.5,k(),E=requestAnimationFrame(j)},M=()=>{C||E||!D||document.hidden||(T=performance.now(),E=requestAnimationFrame(j))},N=()=>{cancelAnimationFrame(E),E=0},P=new ResizeObserver(A);P.observe(e),A();let F=new IntersectionObserver(([e])=>{D=e.isIntersecting,D?M():N()});F.observe(e);let I=()=>document.hidden?N():M();return document.addEventListener(`visibilitychange`,I),C?k():M(),()=>{N(),P.disconnect(),F.disconnect(),document.removeEventListener(`visibilitychange`,I),t.deleteTexture(x),t.deleteBuffer(o),t.deleteProgram(a),t.deleteShader(r),t.deleteShader(i)}},[y]),g?(0,s.jsx)(`div`,{"aria-hidden":!0,className:a,style:{...l,background:`linear-gradient(90deg, ${e.join(`, `)})`}}):(0,s.jsx)(n.canvas,{ref:p,"aria-hidden":!0,className:a,style:l,initial:{opacity:0},animate:{opacity:+!!m},transition:{duration:.8,ease:`easeOut`}})}var m=[{hue:0,s:.7,l:.42},{hue:1,s:.82,l:.6},{hue:2,s:.75,l:.8},{hue:3,s:.52,l:.56},{hue:4,s:.48,l:.38}];function h(e,t,n){let r=t=>(t+e/30)%12,i=t*Math.min(n,1-n),a=e=>n-i*Math.max(-1,Math.min(r(e)-3,Math.min(9-r(e),1))),o=e=>Math.round(e*255).toString(16).padStart(2,`0`);return`#${o(a(0))}${o(a(8))}${o(a(4))}`}function g(e=Math.random){let t=e()*360,n=14+e()*22,r=t+140+e()*80,i=[t,t+n,t+n*2,r,r+25];return m.map(({hue:e,s:t,l:n})=>{let r=(i[e]+360)%360;return h(r,r>70&&r<170?t*.6:t,n)})}var _=1512,v=945;function y(){let[e]=(0,o.useState)(g),t=(0,o.useRef)(null),[r,i]=(0,o.useState)(0);return(0,o.useEffect)(()=>{let e=t.current;if(!e)return;let n=new ResizeObserver(([e])=>i(e.contentRect.width/_));return n.observe(e),()=>n.disconnect()},[]),(0,s.jsxs)(`main`,{className:`relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10 md:px-10`,children:[(0,s.jsx)(p,{colors:e}),(0,s.jsxs)(n.div,{initial:{opacity:0,y:24,scale:.98},animate:{opacity:1,y:0,scale:1},transition:{delay:.3,duration:1,ease:[.16,1,.3,1]},className:`relative w-full max-w-[min(1240px,calc((100dvh-120px)*1.6))] overflow-hidden rounded-[14px] bg-white shadow-[0_40px_120px_-30px_rgb(10_8_30/0.55),0_0_0_1px_rgb(255_255_255/0.25)]`,children:[(0,s.jsxs)(`div`,{className:`flex h-9 items-center gap-2 border-b border-black/5 bg-[#f6f6f4] px-4`,children:[(0,s.jsx)(`span`,{className:`size-3 rounded-full bg-[#ff5f57]`}),(0,s.jsx)(`span`,{className:`size-3 rounded-full bg-[#febc2e]`}),(0,s.jsx)(`span`,{className:`size-3 rounded-full bg-[#28c840]`}),(0,s.jsx)(`span`,{className:`mx-auto rounded-md bg-white px-10 py-0.5 text-[11px] text-black/45`,children:`voice studio`}),(0,s.jsx)(`span`,{className:`w-[52px]`})]}),(0,s.jsx)(`div`,{ref:t,className:`relative w-full overflow-hidden`,style:{aspectRatio:`${_} / ${v}`},children:r>0&&(0,s.jsx)(`iframe`,{src:`./index.html?autoplay`,title:`Voice Studio autoplay demo`,width:_,height:v,className:`absolute top-0 left-0 origin-top-left border-0`,style:{transform:`scale(${r})`}})})]})]})}(0,a.createRoot)(document.getElementById(`root`)).render((0,s.jsx)(o.StrictMode,{children:(0,s.jsx)(y,{})}));