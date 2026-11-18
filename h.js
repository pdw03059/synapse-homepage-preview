// SYNAPSE 시안 H — 동작: 실사 오프닝, 섹션에 따라 변하는 입자 시그니처, 섹션별 연출, 내비게이션, 자동 넘김
import { createNeuro } from "./h3d.js?v=11";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 760px)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const secs = $$(".sec"), railLinks = $$(".rail a");

// ── 입자 시그니처: 섹션 위치(S = 0~5)에 따라 손(연결) → 뇌(이해) → 구체(팀) 로 바뀌고, UI가 주인공인 섹션에서는 물러난다 ──
const DIM = [1.3, 1.3, 0.5, 0.62, 0.5, 0.95], SHIFT = [0.3, 0.17, 0.08, 0, 0, 0], RAYS = [0.65, 0.25, 0.08, 0.35, 0.08, 0.2];
const at = (arr, S) => { const i = Math.floor(clamp(S, 0, 5)), j = Math.min(5, i + 1), f = ss(0.15, 0.85, S - i); return arr[i] + (arr[j] - arr[i]) * f; };
let neuro = null, S = 0, Sd = 0, cur = 0, visible = true;
const M = { m1: 0, m2: 0, b: 0 }, white = document.querySelector(".whiteout");
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener("pointermove", (e) => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
document.addEventListener("visibilitychange", () => (visible = !document.hidden));

function stage() {
  const mid = innerHeight * 0.55; let s = 0;
  secs.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.top <= mid) s = i + clamp((mid - r.top) / Math.max(r.height, 1)); });
  return Math.min(5, s);
}
function loop(now) {
  requestAnimationFrame(loop);
  if (!visible) return;
  S = stage(); Sd = reduce ? S : Sd + (S - Sd) * 0.08;
  ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
  const shiftV = mobile ? 0 : at(SHIFT, Sd);
  // 모양 바뀜은 스크롤보다 천천히 따라가서(약 1.5초) 흩어졌다 모이는 과정이 보이게
  const k = reduce ? 1 : 0.045;
  M.m1 += (ss(0.45, 1.15, S) - M.m1) * k; M.m2 += (ss(2.35, 3.05, S) - M.m2) * k;
  // 마지막 섹션: 구체가 퍼지며 화면이 하얘진다
  const bt = S > 4.7 ? 1 : 0; M.b += (bt - M.b) * (reduce ? 1 : bt ? 0.022 : 0.06);
  white.style.opacity = ss(0.45, 0.95, M.b).toFixed(3);
  document.body.classList.toggle("end", M.b > 0.7);
  if (neuro) neuro.render(now, { m1: M.m1, m2: M.m2, burst: M.b, leave: 0, dim: at(DIM, Sd) * (mobile ? 0.95 : 1), shift: shiftV, lift: mobile ? 0.34 * (1 - ss(0.2, 0.9, Sd)) : 0, rays: at(RAYS, Sd) }, { x: ptr.sx, y: ptr.sy });
  const c = Math.min(5, Math.floor(S + 0.05)); // 레일은 실제로 보고 있는 섹션 기준
  if (c !== cur) { cur = c; railLinks.forEach((a, i) => a.classList.toggle("on", i === c)); }
  document.body.classList.toggle("scrolled", scrollY > 10);
}

// ── 섹션 등장 ──
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); onEnter(e.target); } }), { threshold: [0, 0.15] });
secs.forEach((s) => io.observe(s));
secs[0].classList.add("in");
// 05 아래 예시 화면 묶음: 들어올 때 고리 한 번 + 카드가 차례로
const shelf = $(".shelf"); if (shelf) new IntersectionObserver((es, ob) => es.forEach((x) => { if (x.isIntersecting) { shelf.classList.add("in"); ring(4); ob.disconnect(); } }), { threshold: 0.35 }).observe(shelf); // 첫 화면 문구는 항상 바로 보이게(휴대폰에서 감지가 늦는 문제)
const ran = new Set();
// 섹션에 들어설 때마다 시그니처 고리가 3D 중심에서 한 번 퍼진다
const pulse = $(".pulse");
function ring(i) { if (reduce || !pulse || i === 0) return; pulse.style.left = (50 + (mobile ? 0 : SHIFT[i] * 100)) + "%"; pulse.classList.remove("go"); void pulse.offsetWidth; pulse.classList.add("go"); }
function onEnter(sec) {
  ring(secs.indexOf(sec));
  if (ran.has(sec.id)) return; ran.add(sec.id);
  if (sec.id === "s2") ideaDemo(sec);
  if (sec.id === "s3") designDemo(sec);
  if (sec.id === "s4") teamDemo(sec);
  if (sec.id === "s5") buildDemo(sec);
}
const SPEED = 2.0; // 사용자 요청으로 더 빠르게(2026-11-18 마지막) // 1.25배에서 다시 1.2배 더 빠르게(2026-11-18) // 2026-11-18 사용자 요청: 자동 진행·연출을 이전보다 1.25배 빠르게
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms / SPEED));
// 02: 한 문장을 입력하면 → 아이디어 · 제품 · 기능 · 디자인으로 정리된다
async function ideaDemo(sec) {
  const t = $(".typed", sec), text = t.dataset.text, steps = $$(".c-steps li", sec);
  for (let i = 0; i <= text.length; i++) { t.textContent = text.slice(0, i); await wait(42); }
  await wait(450);
  for (const li of steps) { li.classList.add("on"); await wait(520); }
}
// 03: 시안 선택 → 수정 → 확정 (보이는 동안 천천히 반복)
async function designDemo(sec) {
  const mocks = $$(".mock", sec), flow = $$(".flow li", sec);
  for (;;) {
    for (let k = 0; k < 3; k++) {
      mocks.forEach((m, i) => m.classList.toggle("sel", i === 1 && k >= 0));
      flow.forEach((f, i) => f.classList.toggle("on", i <= k));
      await wait(1500);
    }
    await wait(1800); flow.forEach((f) => f.classList.remove("on")); mocks.forEach((m) => m.classList.remove("sel")); await wait(700);
    if (reduce) { flow.forEach((f) => f.classList.add("on")); mocks[1].classList.add("sel"); return; }
  }
}
// 04: 기획 → 설계 → 개발 → 검토 순서로 역할이 차례로 켜진다
async function teamDemo(sec) {
  const roles = $$(".rv-row", sec);
  const foot = $(".rv-foot", sec);
  for (;;) {
    for (let k = 0; k < 4; k++) { roles.forEach((r, i) => r.classList.toggle("act", i === k)); await wait(1100); }
    roles.forEach((r) => r.classList.remove("act")); foot.classList.add("go"); await wait(2600);
    if (reduce) return; foot.classList.remove("go"); await wait(400);
  }
}
// 05: 코드가 한 줄씩 완성될수록 결과 화면이 또렷해진다
async function buildDemo(sec) {
  const lines = $$(".ln", sec), n = lines.length;
  for (;;) {
    for (let i = 0; i < n; i++) {
      lines.forEach((l, j) => { l.classList.toggle("on", j <= i); l.classList.toggle("cur", j === i); });
      sec.style.setProperty("--p", ((i + 1) / n).toFixed(3)); await wait(380);
    }
    lines.forEach((l) => l.classList.remove("cur")); await wait(2600);
    if (reduce) return;
    lines.forEach((l) => l.classList.remove("on")); sec.style.setProperty("--p", "0"); await wait(500);
  }
}

// ── 자동 넘김: 가만히 있으면 다음 섹션으로 천천히 넘어간다. 손대면 잠시 멈춘다 ──
const autoBtn = $(".auto"); let autoOn = !reduce, idleAt = performance.now();
try { if (sessionStorage.getItem("synapse-h-auto") === "0") autoOn = false; } catch (e) {}
const paint = () => { autoBtn.setAttribute("aria-pressed", String(autoOn)); autoBtn.setAttribute("aria-label", autoOn ? "자동 넘김 멈춤" : "자동 넘김 시작"); };
paint();
autoBtn.addEventListener("click", () => { autoOn = !autoOn; idleAt = performance.now(); paint(); try { sessionStorage.setItem("synapse-h-auto", autoOn ? "1" : "0"); } catch (e) {} });
["wheel", "touchstart", "keydown", "mousedown"].forEach((ev) => addEventListener(ev, (e) => { if (!e.target.closest || !e.target.closest(".auto")) idleAt = performance.now(); }, { passive: true }));
const DWELL = [5200, 7600, 7200, 6400, 6800];
setInterval(() => {
  if (!autoOn || document.body.classList.contains("is-intro") || document.hidden) return;
  const i = Math.min(5, Math.floor(stage() + 0.45));
  if (i >= 5) return;
  if (performance.now() - idleAt > DWELL[i] / SPEED) { idleAt = performance.now(); secs[i + 1].scrollIntoView({ behavior: "smooth" }); }
}, 400);

// ── 모바일 메뉴, 폼 ──
const nb = $(".nav-btn"), mnav = $(".mnav");
nb.addEventListener("click", () => { const o = mnav.classList.toggle("open"); nb.setAttribute("aria-expanded", String(o)); });
mnav.addEventListener("click", (e) => { if (e.target.closest("a")) { mnav.classList.remove("open"); nb.setAttribute("aria-expanded", "false"); } });
$(".ask").addEventListener("submit", (e) => {
  e.preventDefault(); const v = $(".ask input").value.trim();
  $(".ask-note").textContent = v ? `"${v}" — 시안이라 아직 실제 프로젝트 생성으로 연결되지 않습니다.` : "만들고 싶은 것을 한 줄로 적어 주세요.";
});

// ── 실사 오프닝(같은 방문에서는 한 번만) → 입자 시그니처 시작 ──
const op = $(".opening"), opv = $(".opening video"), mark = $(".op-mark");
// 오프닝 위 요구사항 칸: 입력 중에는 오프닝이 끝나지 않고 기다리며, 보내면 마지막 섹션 입력칸으로 이어진다
const opAsk = $(".op-ask"), opIn = $(".op-ask input"); let holding = false;
opIn.addEventListener("focus", () => { holding = true; });
opIn.addEventListener("blur", () => { holding = false; if (!opIn.value.trim() && opv.ended) endIntro(); });
opAsk.addEventListener("submit", (e) => { e.preventDefault(); const v = opIn.value.trim(); holding = false; endIntro(true);
  if (v) { $(".ask input").value = v; setTimeout(() => { $("#s6").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); $(".ask input").focus({ preventScroll: true }); }, 700); } });
function endIntro(force) {
  if (!document.body.classList.contains("is-intro")) return;
  if ((holding || document.activeElement === opIn || opIn.value.trim()) && force !== true) return; // 입력 중이거나 글이 있으면 기다린다
  op.classList.add("out"); document.body.classList.remove("is-intro"); neuro && neuro.form(); idleAt = performance.now(); setTimeout(() => op.remove(), 1400);
  try { sessionStorage.setItem("synapse-h-intro", "1"); } catch (e) {}
}
(async () => {
  try { neuro = await createNeuro($(".sig")); } catch (e) { console.warn("입자 그래픽을 불러오지 못했습니다", e); }
  let seen = false; try { seen = sessionStorage.getItem("synapse-h-intro") === "1"; } catch (e) {}
  if (reduce || seen || location.hash) { op.remove(); document.body.classList.remove("is-intro"); neuro && neuro.form(); }
  else {
    opv.addEventListener("timeupdate", () => {
      if (opv.duration && opv.currentTime > opv.duration - 1.6 && neuro) neuro.form(); // 오프닝이 끝나기 전에 손이 미리 모이기 시작
      if (opv.duration && opv.currentTime > opv.duration - 0.7) endIntro(); }); // 코드 화면이 흐려지며 그대로 손 입자로 이어진다
    opv.addEventListener("ended", () => endIntro()); opv.addEventListener("error", () => endIntro(true)); setTimeout(() => endIntro(), 6000);
    opv.playbackRate = 1.2; // 오프닝도 1.2배
    opv.play().catch(endIntro);
  }
  requestAnimationFrame(loop);
})();
