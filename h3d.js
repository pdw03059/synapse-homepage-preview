// SYNAPSE 시안 H — 브랜드 시그니처 입자(아이보리 + 샴페인 골드). 뉴런 3D: 점과 선의 두 손 → 뇌 → 뉴런 구체 (실시간, 가만히 있어도 살아 움직임)
// 수상작 기법: 초점 흐림(보케), 손끝에서 퍼지는 빛줄기(god rays), 신호가 흐르는 그물, 필름 그레인·색수차·비네트
import * as THREE from "./vendor/three.module.min.js";
import { EffectComposer } from "./vendor/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./vendor/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "./vendor/addons/postprocessing/ShaderPass.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const B2T = (a, i) => [a[i], a[i + 2], -a[i + 1]];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

const COMMON = /* glsl */`
uniform float uT, uForm, uM1, uM2, uLeave, uScale, uFocus, uDim, uBurst;
float sst(float a, float b, float x){ float t = clamp((x-a)/(b-a), 0., 1.); return t*t*(3.-2.*t); }
vec3 flow(vec3 p, float t){ return vec3(sin(p.y*2.1+t)+sin(p.z*1.7-t*.6), sin(p.z*1.9+t*.8)+sin(p.x*1.3+t*.4), sin(p.x*2.3-t*.7)+sin(p.y*1.2+t*.9))*.5; }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
vec3 place(vec3 hand, vec3 brain, vec3 sph, float r, float along, out float morphing){
  float t = uT;
  // 처음: 흩어진 먼지가 손 모양으로 모인다
  float k = sst(0., 1., clamp(uForm*1.6 - r*.6, 0., 1.));
  vec3 p = mix(hand + flow(hand*1.3 + r*11., 2.)*1.8 + vec3(0., 0., -1.2), hand, k);
  // 살아 있는 손: 숨 쉬듯 미세하게 흔들림
  p += flow(hand*3. + r*7., t*.35) * .008;
  // 손 → 뇌 → 구체 (입자마다 조금씩 늦게 출발, 이동 중엔 소용돌이)
  float m1 = sst(0., 1., clamp(uM1*1.5 - r*.5, 0., 1.)), m2 = sst(0., 1., clamp(uM2*1.5 - r*.5, 0., 1.));
  vec3 b = rotY(t*.08) * brain + flow(brain*4. + r, t*.4)*.005;
  vec3 s = rotY(t*.12) * sph * (1. + .015*sin(t*1.3 + r*6.));
  p = mix(p, b, m1); p = mix(p, s, m2);
  morphing = sin(3.14159*m1) + sin(3.14159*m2);
  // 바뀌는 동안: 뉴런이 크게 흩어졌다가 새 모양으로 다시 모인다
  float sc = sin(3.14159*m1) * 1.5 + sin(3.14159*m2) * .7;
  p += flow(p*1.1 + r*9., t*.5) * sc * (.35 + r) + normalize(p + vec3(.0001)) * sc * .25 * r;
  // 떠날 때: 빛 알갱이로 흩어지며 카메라 쪽으로
  float lv = sst(0., 1., clamp(uLeave*1.5 - r*.5, 0., 1.));
  p += (flow(p + r*5., t*.4)*1.2 + vec3(0., .2, 2.6)) * lv * (.5 + r);
  // 마지막: 구체가 바깥으로 퍼지며 화면이 빛으로 차오른다
  float bu = uBurst*uBurst;
  p = p * (1. + bu * 7. * (.5 + r)) + flow(p + r*3., t*.5) * bu * .5;
  return p;
}`;

const FINAL = {
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uLight: { value: new THREE.Vector2(0.5, 0.5) }, uRays: { value: 0.5 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uRays; uniform vec2 uRes, uLight; varying vec2 vUv;
    float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 d = vUv - .5; float r = dot(d,d); vec2 o = d*r*.014;
      vec3 c = vec3(texture2D(tDiffuse, vUv+o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv-o).b);
      // 빛줄기: 광원 쪽으로 화면을 끌어당겨 쌓는다
      vec2 dir = (vUv - uLight) / 36.; vec2 uv = vUv; float dec = 1.; vec3 acc = vec3(0.);
      for (int i = 0; i < 36; i++){ uv -= dir; vec3 s = texture2D(tDiffuse, uv).rgb; acc += max(s - .18, 0.) * dec; dec *= .955; }
      c += acc * .022 * uRays * vec3(1.,.84,.6);
      c *= mix(1., smoothstep(.95, .12, r*1.8), .8);
      c += (hh(vUv*uRes + fract(uT)*91.) - .5) * .032;
      c = pow(c, vec3(.96, .98, 1.02));
      gl_FragColor = vec4(c, 1.); }`,
};

export async function createNeuro(canvas) {
  const meta = await (await fetch("assets/3d/hands.json")).json();
  const buf = await (await fetch("assets/3d/hands.bin")).arrayBuffer();
  const F = (k) => new Float32Array(buf, meta.parts[k][0], meta.parts[k][1]);
  const home = F("home"), tgt = F("target"), w = F("w"), ps = F("ps"), along = F("along"), vein = F("vein"), bright = F("bright"), eb = F("eb");
  const edges = new Uint32Array(buf, meta.parts.edges[0], meta.parts.edges[1]);
  const N = meta.N;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x0a0a0b, 1);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  const U = { uT: { value: 0 }, uForm: { value: reduce ? 1 : 0 }, uM1: { value: 0 }, uM2: { value: 0 }, uLeave: { value: 0 }, uScale: { value: 800 }, uFocus: { value: 6 }, uDim: { value: 1 }, uBurst: { value: 0 } };

  // 입자: 손 / 뇌 / 구체 위치
  const ph = new Float32Array(N * 3), pb = new Float32Array(N * 3), pS = new Float32Array(N * 3), rnd = new Float32Array(N), spark = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  // 뇌 다음 모양: 'AI 팀' — 기획·디자인·개발·검토 네 개의 빛 마디가 신경 섬유로 서로 이어진 하나의 구조
  const V = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => v.map((c) => (c / Math.sqrt(3)) * 1.0));
  const EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  function teamPoint(i) {
    const u = Math.random(), w = Math.random();
    if (i % 100 < 58) { // 마디: 빛나는 핵 + 바깥 껍질
      const c = V[i % 4], th = golden * i, y = 1 - 2 * w, rr = Math.sqrt(1 - y * y);
      const R = u < 0.35 ? 0.065 * Math.cbrt(Math.random()) : 0.2 + (Math.random() - 0.5) * 0.03;
      return [c[0] + Math.cos(th) * rr * R, c[1] + y * R, c[2] + Math.sin(th) * rr * R];
    }
    if (i % 100 < 92) { // 섬유: 두 마디를 잇는 부드러운 곡선(가운데로 살짝 휨)
      const [a, b] = EDGES[i % 6], A = V[a], B = V[b], t = u, bend = Math.sin(Math.PI * t) * 0.32, j = 0.012 + 0.02 * Math.sin(Math.PI * t);
      return [0, 1, 2].map((k) => A[k] + (B[k] - A[k]) * t - (A[k] + B[k]) * 0.5 * bend + (Math.random() - 0.5) * j);
    }
    // 가운데 공유 핵: 네 마디가 함께 만드는 하나의 중심
    const th = golden * i, y = 1 - 2 * w, rr = Math.sqrt(1 - y * y), R = 0.09 * Math.cbrt(u);
    return [Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R];
  }
  for (let i = 0; i < N; i++) {
    ph.set(B2T(home, i * 3), i * 3);
    const b = B2T(tgt, i * 3); pb.set([b[0] * 0.95, b[1] * 0.95 + 0.05, b[2] * 0.95], i * 3);
    pS.set(teamPoint(i), i * 3);
    rnd[i] = Math.random(); spark[i] = i >= 2 * meta.NH ? 1 : 0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(ph, 3)); g.setAttribute("pb", new THREE.BufferAttribute(pb, 3)); g.setAttribute("psph", new THREE.BufferAttribute(pS, 3));
  for (const [k, a] of Object.entries({ w, ps, along, vein, bright, r: rnd, spark })) g.setAttribute(k, new THREE.BufferAttribute(a, 1));
  const pm = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: COMMON + `attribute vec3 pb, psph; attribute float w, ps, along, vein, bright, r, spark; varying float vA; varying vec3 vC;
      void main(){ float mo; vec3 q = place(position, pb, psph, r, along, mo);
        // SYNAPSE의 순간: 3.2초마다 손끝에서 신호가 터지고, 빛의 고리가 퍼지며, 빛의 물결이 두 손을 지나간다
        float cyc = fract(uT/3.2), hands = 1. - uM1, sparkA = 0.;
        float wave = exp(-pow((length(position) - cyc*2.4)*5., 2.)) * hands * (1. - cyc);
        if (spark > .5) { float k = floor(r*3.), ph = fract(uT/3.2 + k/3.), a = r*6283.1, R = .02 + ph*1.2;
          vec3 ring = vec3(cos(a)*R, sin(a)*R*.92, (fract(r*91.) - .5)*.05);
          q = mix(q, ring, hands*sst(.5, 1., uForm)); sparkA = pow(1. - ph, 2.2) * sst(0., .12, ph) * hands; }
        vec4 mv = modelViewMatrix*vec4(q,1.); gl_Position = projectionMatrix*mv;
        float dz = -mv.z, base = ps*uScale*1.25/dz;
        float coc = abs(dz - uFocus) * uScale * .0022;                  // 초점에서 멀수록 크고 흐린 보케
        float px = clamp((base + coc) * (1. + .5*sst(.3, .9, uM1)), 1., 40.); gl_PointSize = px;
        float tip = exp(-length(position)*9.) * (1. - uM1);
        float run = pow(.5 + .5*sin(along*14. - uT*2.6 + r*.6), 10.) * (1. - uM1);   // 손목 → 손끝으로 흐르는 빛
        float fire = exp(-cyc*9.) * 1.1;
        float hand = clamp(w, 0., 1.6) * (.45 + .8*vein + 2.2*tip*(1. + fire) + .9*run + 2.4*wave);
        if (spark > .5) hand = sparkA * 2.6;
        float brainB = (.9 + 2.6*bright) * (.75 + .5*pow(.5 + .5*sin(uT*2. + r*40.), 3.)) * 1.6;
        float sphB = (1.1 + 4.*pow(fract(r*7. + uT*.15), 18.)) * 1.5;
        float b = mix(mix(hand, brainB, sst(.3, .9, uM1)), sphB, sst(.3, .9, uM2));
        vA = b * min(1., base*base/(px*px)*1.7 + .05) * sst(0., .25, uForm) * (1. - .5*uLeave) * (1. + .3*mo) * (1. + uBurst*2.5);
        vA *= mix(1., pow(sst(0., .5, along), 1.6), 1. - uM1);  // 손목 쪽은 길고 부드럽게 어둠 속으로 사라진다(잘린 끝이 안 보이게)
        float gold = clamp(tip*1.8 + run*.9 + wave*1.5 + spark*hands + step(.955, r)*.8 + sst(.3,.9,uM2)*pow(fract(r*7. + uT*.15), 18.)*3., 0., 1.);
        if (spark > .5 && hands > .01) { gl_PointSize = mix(px, 2.6, hands); vA = mix(vA, sparkA * 1.6 * sst(.5, 1., uForm), hands); }
        vA *= uDim; vC = mix(vec3(.80,.79,.76), vec3(1.,.80,.50), gold); }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord*2.-1.; float r2 = dot(d,d); if (r2 > 1.) discard; gl_FragColor = vec4(vC, (exp(-r2*4.)+.3*exp(-r2*20.))*vA*.3); }` });
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; scene.add(pts);

  // 손의 그물 선 + 선을 따라 흐르는 신호
  const NE = meta.NE, lp = new Float32Array(NE * 6), lb = new Float32Array(NE * 6), lsp = new Float32Array(NE * 6), la = new Float32Array(NE * 2), lr = new Float32Array(NE * 2), lal = new Float32Array(NE * 2);
  for (let e = 0; e < NE; e++) { const a = edges[e * 2], b = edges[e * 2 + 1];
    lp.set(ph.subarray(a * 3, a * 3 + 3), e * 6); lp.set(ph.subarray(b * 3, b * 3 + 3), e * 6 + 3);
    lb.set(pb.subarray(a * 3, a * 3 + 3), e * 6); lb.set(pb.subarray(b * 3, b * 3 + 3), e * 6 + 3);
    lsp.set(pS.subarray(a * 3, a * 3 + 3), e * 6); lsp.set(pS.subarray(b * 3, b * 3 + 3), e * 6 + 3);
    la[e * 2] = la[e * 2 + 1] = eb[e]; lr[e * 2] = rnd[a]; lr[e * 2 + 1] = rnd[b]; lal[e * 2] = along[a]; lal[e * 2 + 1] = along[b]; }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3)); lg.setAttribute("pb", new THREE.BufferAttribute(lb, 3)); lg.setAttribute("psph", new THREE.BufferAttribute(lsp, 3));
  lg.setAttribute("eb", new THREE.BufferAttribute(la, 1)); lg.setAttribute("r", new THREE.BufferAttribute(lr, 1)); lg.setAttribute("along", new THREE.BufferAttribute(lal, 1));
  const lm = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: COMMON + `attribute vec3 pb, psph; attribute float eb, r, along; varying float vA;
      void main(){ float mo; vec3 q = place(position, pb, psph, r, along, mo); gl_Position = projectionMatrix*modelViewMatrix*vec4(q,1.);
        float run = pow(.5 + .5*sin(along*14. - uT*2.6), 8.);
        vA = eb * (.1 + .22*run) * sst(.55, 1., uForm) * (1. - sst(0., .35, uM1)) * (1. - uLeave) * pow(sst(.08, .6, along), 2.); }`,
    fragmentShader: `uniform float uDim; varying float vA; void main(){ gl_FragColor = vec4(.86,.80,.68, vA*uDim); }` });
  const lines = new THREE.LineSegments(lg, lm); lines.frustumCulled = false; scene.add(lines);

  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.6, 0.55, 0.3); composer.addPass(bloom);
  const fin = new ShaderPass(FINAL); composer.addPass(fin);

  let formT0 = -1, W = 1, H = 1;
  const resize = () => { W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight; const dpr = Math.min(devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); composer.setPixelRatio(dpr); composer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix(); U.uScale.value = (H * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360)); fin.uniforms.uRes.value.set(W * dpr, H * dpr); };
  resize(); addEventListener("resize", resize);
  const cam0 = B2T(meta.cam, 0), v = new THREE.Vector3();

  return {
    form() { if (reduce) { U.uForm.value = 1; return; } if (formT0 < 0 && U.uForm.value < 1) formT0 = performance.now(); },
    // p: 페이지 전체 진행도, shift: 글 반대편으로 미는 정도(0~1)
    // o: { m1 손→뇌, m2 뇌→구체, leave 흩어짐, dim 밝기, shift 오른쪽 밀기(화면 폭 비율), rays 빛줄기 }
    render(now, o, ptr) { const shift = o.shift;
      const t = reduce ? 0 : now / 1000; U.uT.value = t; fin.uniforms.uT.value = t;
      if (formT0 >= 0) { U.uForm.value = Math.min(1, (now - formT0) / 1500); if (U.uForm.value >= 1) formT0 = -1; }
      U.uM1.value = o.m1; U.uM2.value = o.m2; U.uLeave.value = o.leave; U.uDim.value = o.dim; U.uBurst.value = o.burst || 0;
      // 카메라: 손(정면) → 뇌(비스듬히, 조금 가까이) → 구체(살짝 돌며)
      const a = -0.25 * U.uM1.value + 0.5 * U.uM2.value + Math.sin(t * 0.07) * 0.06 + ptr.x * 0.05;
      const d = cam0[2] * (0.9 - 0.32 * U.uM1.value + 0.3 * U.uM2.value) * (1 - 0.06 * (1 - o.m1));
      camera.position.set(Math.sin(a) * d, 0.18 + 0.25 * U.uM1.value - ptr.y * 0.08, Math.cos(a) * d); camera.lookAt(0, 0.04, 0);
      U.uFocus.value = d;
      camera.setViewOffset(W, H, -shift * W, (o.lift || 0) * H, W, H);
      // 빛줄기는 손끝(원점)에서
      v.set(0, 0, 0).project(camera); fin.uniforms.uLight.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
      fin.uniforms.uRays.value = o.rays;
      composer.render();
    },
  };
}
