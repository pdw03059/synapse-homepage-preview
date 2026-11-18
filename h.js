// SYNAPSE 시안 H 2판 — 실사 오프닝 → 입자 시그니처(손 → 뇌 → AI 팀) + 5개 영역.
// 스크롤은 방문자가 직접 한다(자동 넘김·강제 스크롤 없음). 그래픽은 스크롤 위치를 천천히 따라간다.
import { createNeuro } from "./h3d.js?v=13";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 760px)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const secs = $$(".sec"), LAST = secs.length - 1;

// 영역별 그래픽: 01 손(시작) · 02 뇌(작동 방식) · 03 AI 팀 모양 · 04 결과물(물러남) · 05 시작(퍼지며 밝아짐)
const DIM = [1.3, 0.55, 0.95, 0.16, 0.2, 0.28, 0.95], SHIFT = [0.3, 0.2, 0.24, 0, 0, 0, 0], RAYS = [0.65, 0.2, 0.3, 0.05, 0.1, 0.3, 0.2];
const at = (arr, S) => { const i = Math.floor(clamp(S, 0, LAST)), j = Math.min(LAST, i + 1), f = ss(0.15, 0.85, S - i); return arr[i] + (arr[j] - arr[i]) * f; };
let neuro = null, S = 0, Sd = 0, visible = true;
const M = { m1: 0, m2: 0, b: 0 }, white = $(".whiteout");
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener("pointermove", (e) => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
document.addEventListener("visibilitychange", () => (visible = !document.hidden));

function stage() {
  const mid = innerHeight * 0.55; let s = 0;
  secs.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.top <= mid) s = i + clamp((mid - r.top) / Math.max(r.height, 1)); });
  return Math.min(LAST, s);
}
function loop(now) {
  requestAnimationFrame(loop);
  if (!visible) return;
  S = stage(); Sd = reduce ? S : Sd + (S - Sd) * 0.08;
  ptr.sx += (ptr.x - ptr.sx) * 0.05; ptr.sy += (ptr.y - ptr.sy) * 0.05;
  const k = reduce ? 1 : 0.04; // 모양은 스크롤보다 천천히 따라가 흩어졌다 모이는 과정이 보이게
  M.m1 += (ss(0.45, 1.1, S) - M.m1) * k; M.m2 += (ss(1.45, 2.1, S) - M.m2) * k;
  const bt = S > LAST - 0.3 ? 1 : 0; M.b += (bt - M.b) * (reduce ? 1 : bt ? 0.022 : 0.06);
  white.style.opacity = ss(0.45, 0.95, M.b).toFixed(3);
  document.body.classList.toggle("end", M.b > 0.7);
  if (neuro) neuro.render(now, { m1: M.m1, m2: M.m2, burst: M.b, leave: 0, dim: at(DIM, Sd) * (mobile ? 0.95 : 1), shift: mobile ? 0 : at(SHIFT, Sd), lift: mobile ? 0.34 * (1 - ss(0.2, 0.9, Sd)) : 0, rays: at(RAYS, Sd) }, { x: ptr.sx, y: ptr.sy });
  document.body.classList.toggle("scrolled", scrollY > 10);
}

// 섹션 등장: 한 번만, 짧게(내용은 등장 전에도 읽힐 만큼 빠르게)
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
secs.forEach((s) => io.observe(s));
secs[0].classList.add("in");

// 작동 방식: 단계를 누르면 오른쪽 화면만 바뀐다(자동 전환 없음). 방향키로도 이동
const tabs = $$(".steps [role=tab]");
function pick(i, focus) { tabs.forEach((t, k) => { const on = k === i; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; $("#" + t.getAttribute("aria-controls")).hidden = !on; }); if (focus) tabs[i].focus(); }
tabs.forEach((t, i) => { t.addEventListener("click", () => pick(i)); t.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % tabs.length, true); } if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pick((i + tabs.length - 1) % tabs.length, true); } }); });
if (tabs.length) pick(0);

// 메뉴: 지금 보고 있는 섹션 표시
const navLinks = $$(".menu a");
const navIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
secs.forEach((s) => navIO.observe(s));

// 모바일 메뉴, 시작 폼
const nb = $(".nav-btn"), mnav = $(".mnav");
nb.addEventListener("click", () => { const o = mnav.classList.toggle("open"); nb.setAttribute("aria-expanded", String(o)); });
mnav.addEventListener("click", (e) => { if (e.target.closest("a")) { mnav.classList.remove("open"); nb.setAttribute("aria-expanded", "false"); } });
$(".ask").addEventListener("submit", (e) => {
  e.preventDefault(); const v = $(".ask input").value.trim();
  $(".ask-note").textContent = v ? `"${v}" — 시안이라 아직 실제 프로젝트 생성으로 연결되지 않습니다.` : "만들고 싶은 것을 한 문장으로 적어 주세요.";
});

// 실사 오프닝(같은 방문에서는 한 번만). 위의 요구사항 칸에 쓰는 동안에는 기다리고, 보내면 마지막 입력칸으로 이어진다
const op = $(".opening"), opv = $(".opening video");
const opAsk = $(".op-ask"), opIn = $(".op-ask input"); let holding = false;
opIn.addEventListener("focus", () => { holding = true; });
opIn.addEventListener("blur", () => { holding = false; if (!opIn.value.trim() && opv.ended) endIntro(); });
opAsk.addEventListener("submit", (e) => { e.preventDefault(); const v = opIn.value.trim(); holding = false; endIntro(true);
  if (v) { $(".ask input").value = v; setTimeout(() => { $("#start").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); $(".ask input").focus({ preventScroll: true }); }, 700); } });
function endIntro(force) {
  if (!document.body.classList.contains("is-intro")) return;
  if ((holding || document.activeElement === opIn || opIn.value.trim()) && force !== true) return;
  op.classList.add("out"); document.body.classList.remove("is-intro"); neuro && neuro.form(); setTimeout(() => op.remove(), 1400);
  try { sessionStorage.setItem("synapse-h-intro", "1"); } catch (e) {}
}
(async () => {
  try { neuro = await createNeuro($(".sig")); } catch (e) { console.warn("입자 그래픽을 불러오지 못했습니다", e); }
  let seen = false; try { seen = sessionStorage.getItem("synapse-h-intro") === "1"; } catch (e) {}
  if (reduce || seen || location.hash) { op.remove(); document.body.classList.remove("is-intro"); neuro && neuro.form(); }
  else {
    opv.addEventListener("timeupdate", () => {
      if (opv.duration && opv.currentTime > opv.duration - 1.6 && neuro) neuro.form(); // 끝나기 전에 손이 미리 모이기 시작
      if (opv.duration && opv.currentTime > opv.duration - 0.7) endIntro(); });
    opv.addEventListener("ended", () => endIntro()); opv.addEventListener("error", () => endIntro(true)); setTimeout(() => endIntro(), 6000);
    opv.playbackRate = 1.2;
    opv.play().catch(endIntro);
  }
  requestAnimationFrame(loop);
})();
