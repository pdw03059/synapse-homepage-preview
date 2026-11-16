// SYNAPSE 홈페이지 시안 — 공통 동작 (외부 라이브러리 없음)
(() => {
  const page = document.body.dataset.page;
  const links = [["product", "제품"], ["how", "작동 방식"], ["team", "AI 팀"], ["connect", "연결 방식"]];

  // 내비게이션 · 푸터 삽입
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML = `<a class="logo" href="index.html"><i></i>SYNAPSE</a>
    <nav class="nav-pill" aria-label="주 메뉴"><span class="nav-ind"></span>${links
      .map(([id, t]) => `<a href="${id}.html"${id === page ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    <div style="display:flex;gap:8px"><a class="btn solid cta" href="index.html#start">시작하기</a>
    <button class="btn nav-toggle" aria-expanded="false">메뉴</button></div>`;
  document.body.prepend(nav);
  const foot = document.querySelector(".foot");
  if (foot) foot.innerHTML = `<span>SYNAPSE — 당신은 생각만. 나머지는 팀이.</span>
    <span>${links.map(([id, t]) => `<a href="${id}.html">${t}</a>`).join(" &nbsp; ")}</span><span>시안 2026-11-16</span>`;

  // 알약 메뉴: 따라다니는 표시
  const pill = nav.querySelector(".nav-pill"), ind = nav.querySelector(".nav-ind");
  const moveInd = (a) => {
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = a.offsetWidth + "px"; ind.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const current = pill.querySelector("[aria-current]");
  pill.querySelectorAll("a").forEach((a) => { a.addEventListener("mouseenter", () => moveInd(a)); a.addEventListener("focus", () => moveInd(a)); });
  pill.addEventListener("mouseleave", () => moveInd(current));
  const toggle = nav.querySelector(".nav-toggle");
  toggle.addEventListener("click", () => toggle.setAttribute("aria-expanded", nav.classList.toggle("open")));

  // 페이지 전환: 나갈 때 어두워졌다가 이동
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey) return;
    const href = a.getAttribute("href");
    if (!/\.html(#.*)?$/.test(href)) return;
    if (page === "home" && href.startsWith("index.html#start")) { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); return; }
    e.preventDefault(); document.body.classList.add("leaving"); setTimeout(() => (location.href = href), 260);
  });
  window.addEventListener("pageshow", () => { document.body.classList.remove("leaving"); document.body.classList.add("ready"); moveInd(current); });

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ez = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // 천천히 출발해 빠르게, 다시 천천히
  const band = (p, a, b, w = 0.035) => clamp((p - a) / w) * clamp((b - p) / w); // a~b 구간에서 1, 가장자리 w 만큼 서서히

  // ── 홈: 스크롤이 영상을 움직인다 ──
  if (page === "home") {
    const track = document.querySelector(".track"), stage = document.querySelector(".stage");
    const V = Object.fromEntries([...stage.querySelectorAll("video")].map((v) => [v.dataset.k, v]));
    const rainEl = stage.querySelector("canvas[data-k=code]"), rain = window.makeRain(rainEl); V.code = rainEl; let rainOn = false;
    const wash = stage.querySelector(".wash"), rail = [...document.querySelectorAll(".rail li")], railBox = document.querySelector(".rail");
    const copies = [...document.querySelectorAll(".copy")].map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b }));
    const sideScrim = stage.querySelector(".sidescrim"), hudStep = document.querySelector(".hud.tr"), hint = document.querySelector(".scrollhint");
    const stageNames = ["기획", "디자인", "토론", "보완", "개발", "출시"], cuts = [0.3, 0.52, 0.63, 0.74, 0.86, 2];
    const MORPH_END = 0.29, MORPH_LEN = 7.9, INTRO = 3.0; // 처음 3초(두 손이 생겨나 다가옴)는 자동 재생, 그 뒤는 스크롤이 움직인다
    const FIN_A = 0.725, FIN_B = 0.93, FIN_LEN = 4.9;
    let sp = 0, intro = !reduce, showLit = false;
    // 마지막 화면의 예시: SYNAPSE 유료용 첫 화면의 '만들 수 있는 것' 그대로(종류 탭 + 한 장면 크게). 장면은 실제 동작하는 예시(assets/kinds/*.html)의 캡처
    const CATS = [
      ["website", "웹사이트", "회사 · 제품을 소개하는 웹사이트를 만들고 싶어요 — ", "업무 도구 회사 홈페이지", "제품 카드 · 대상별 탭 · 요금 전환 · 휴대폰 메뉴까지 실제로 동작합니다"],
      ["app", "앱", "휴대폰에서 쓰는 앱을 만들고 싶어요 — ", "휴대폰 앱", "실시간 상태 · 승인 요청 · 경보를 아래 탭 4개로 오가는 모바일 앱입니다"],
      ["program", "업무 프로그램", "반복 업무를 처리하는 업무 프로그램을 만들고 싶어요 — ", "재고 관리 프로그램", "사이드바 · 필터 · 표 · 상세 패널로 반복 업무를 처리합니다"],
      ["security", "보안 솔루션", "로그 · 보안 이벤트를 모아 보는 관제 대시보드를 만들고 싶어요 — ", "보안 관제 콘솔", "실시간 수집량 · 탐지 경보 · 검색 쿼리 · 오류 설명을 한 화면에 담았습니다"],
      ["game", "게임", "간단한 웹 게임을 만들고 싶어요 — ", "웹 게임", "실제로 플레이되는 3매치 퍼즐 — 점수 · 연쇄 · 힌트까지 갖췄습니다"],
    ];
    const KURL = { website: "www.brightdesk.example", security: "console.mazkion.example" };
    const KNOTE = [[["실시간 상태", "수집량과 지연 시간을 한눈에 봅니다"], ["승인 요청", "중요한 조치는 휴대폰에서 바로 승인합니다"]],
      [["최신 경보", "심각도 순으로 정리해 알립니다"], ["아래 탭 4개", "오늘 · 티켓 · 수집기 · 내 정보"]]];
    const show = document.querySelector(".show");
    if (show) {
      const note = (n) => `<div class="ks-note">${n.map(([t, d]) => `<p><b>${t}</b>${d}</p>`).join("")}</div>`;
      const scene = ([k, , , name], i) => {
        const img = `<img src="assets/kinds/kind-${k}.jpg" alt="${name} 예시 화면" decoding="async">`;
        const a = (cls, inner) => `<a class="kd ${cls}" href="assets/kinds/${k}.html" target="_blank" rel="noopener">${inner}</a>`;
        const bar = KURL[k] ? `<div class="kf-bar"><i></i><i></i><i></i><span>${KURL[k]}</span></div>` : "";
        const body = k === "app" ? note(KNOTE[0]) + a("kd-phone", img) + note(KNOTE[1]) : a(k === "game" ? "kd-tab" : "kd-win" + (k === "security" ? " kd-dark" : ""), bar + img);
        return `<div class="ks ks-${k}${i ? "" : " on"}" data-k="${k}" role="tabpanel">${body}</div>`;
      };
      show.innerHTML = `<div class="show-tabs" role="tablist">${CATS.map((c, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${!i}">${c[1]}</button>`).join("")}</div>
        <div class="show-stage">${CATS.map(scene).join("")}</div><p class="show-cap" aria-live="polite"></p>`;
      const tabs = [...show.querySelectorAll("[role=tab]")], scenes = [...show.querySelectorAll(".ks")], cap = show.querySelector(".show-cap");
      let cur = 0, touched = false;
      const pick = (i) => { cur = i; tabs.forEach((t, j) => t.setAttribute("aria-selected", j === i)); scenes.forEach((x, j) => x.classList.toggle("on", j === i)); cap.innerHTML = `<b>${CATS[i][3]}</b>${CATS[i][4]}`; };
      pick(0);
      tabs.forEach((t) => t.addEventListener("click", () => { touched = true; pick(+t.dataset.i); const inp = document.querySelector(".ask input"); inp.value = CATS[cur][2]; document.querySelector(".finale small").textContent = ""; }));
      show.addEventListener("pointerenter", () => { touched = true; });
      if (!reduce) setInterval(() => { if (showLit && !touched && !document.hidden) pick((cur + 1) % CATS.length); }, 4200); // 손대기 전까지만 천천히 넘어간다
    }
    // 실사 도입(영화 오프닝): 끝나거나 스크롤하면 걷히고, 그때 두 손 장면이 시작된다. 같은 방문에서 다시 오면 건너뛴다
    const bars = document.querySelectorAll('.bar-top, .bar-bot');
    let seen = false; try { seen = sessionStorage.getItem('synapse-film') === '1'; } catch (e) {}
    let film = !reduce && !seen && !!V.intro, filmK = film ? 1 : 0;
    const startHands = () => { if (intro) V.morph.play().catch(() => { intro = false; }); };
    let filmEnd = 0;
    const endFilm = () => { if (!film) return; film = false; filmEnd = performance.now(); try { sessionStorage.setItem('synapse-film', '1'); } catch (e) {} startHands(); };
    if (film) { V.intro.play().catch(endFilm); V.intro.addEventListener('ended', endFilm); V.intro.addEventListener('timeupdate', () => { if (V.intro.currentTime > V.intro.duration - 1.5) endFilm(); }); }
    else startHands();
    V.morph.addEventListener("timeupdate", () => { if (intro && V.morph.currentTime >= INTRO) { intro = false; V.morph.pause(); } }); // 화면이 느려도 3초에서 정확히 멈춘다

    const frame = () => {
      if (film && scrollY > 8) endFilm();
      filmK = film ? 1 : filmEnd ? Math.max(0, 1 - (performance.now() - filmEnd) / 1600) : 0; // 0.8초에 걸쳐 걷힌다
      if (V.intro) { const fk = filmK * filmK * (3 - 2 * filmK); V.intro.style.filter = film ? "" : "blur(" + (1 - fk) * 18 + "px) brightness(" + (1 + (1 - fk) * 0.5) + ")"; V.intro.style.transform = "scale(" + (1 + (1 - fk) * 0.1) + ")"; V.intro.style.opacity = fk; if (!film && filmK === 0 && !V.intro.paused) V.intro.pause(); }
      bars.forEach((b) => (b.style.transform = "scaleY(" + filmK + ")"));
      const max = track.offsetHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max) : 0;
      sp = reduce || !isFinite(sp) ? p : sp + (p - sp) * 0.11;
      if (Math.abs(p - sp) < 0.0004) sp = p;

      // 첫 화면: 두 손은 아래쪽에 작게, 제목은 위쪽에 — 서로 겹치지 않는다. 스크롤하면 손이 가운데로 올라오며 커진다
      const heroK = 1 - clamp(sp / 0.1); const hk = heroK * heroK * (3 - 2 * heroK);
      // ── 카메라 전환: 장면이 바뀔 때 화면이 겹쳐 사라지는 대신, 카메라가 밀고 들어가거나 옆으로 휙 도는 것처럼 움직인다 ──
      const wide = innerWidth > 820, SIDE = wide ? 15 : 0;
      const seg = (a, b) => ez(clamp((sp - a) / (b - a)));                 // a~b 구간을 부드럽게 0→1
      const whip = (a, b) => Math.sin(Math.PI * clamp((sp - a) / (b - a))); // 움직이는 동안만 생기는 흐림(속도감)
      // 1) 손·뇌: 가운데 → 오른쪽으로 휙 비켜 글 자리를 내주고, 끝에는 카메라가 뇌 속으로 밀고 들어간다
      const mSide = seg(0.11, 0.17), mDive = seg(0.265, 0.325);
      V.morph.style.transform = 'translate(' + SIDE * mSide * (1 - mDive) + 'vw,' + (17 * hk) + 'vh) scale(' + (1 - 0.26 * hk) * (1 - 0.18 * mSide) * (1 + 3 * mDive) + ')';
      V.morph.style.filter = 'blur(' + (7 * whip(0.11, 0.17) + 16 * mDive) + 'px)';
      V.morph.style.opacity = 1 - seg(0.285, 0.325);
      // 2) 코드 비: 뇌를 통과해 도착(크게 → 제자리), 나갈 때는 카메라가 오른쪽으로 돌아 왼쪽으로 흘러 나간다
      const cIn = seg(0.285, 0.35), cOut = seg(0.5, 0.56);
      V.code.style.opacity = cIn * (1 - cOut);
      V.code.style.transform = 'translateX(' + -46 * cOut + 'vw) scale(' + (1.5 - 0.5 * cIn + 0.1 * clamp((sp - 0.33) / 0.2)) + ')';
      V.code.style.filter = 'blur(' + (12 * (1 - cIn) + 14 * whip(0.5, 0.56)) + 'px)';
      // 3) 구체: 오른쪽에서 가운데로 들어와 크게 멈췄다가, 옆으로 휙 비키며 글이 나온다. 끝에는 가운데로 돌아가 작아지며 다음 장면이 된다
      const sIn = seg(0.5, 0.56), sSide = seg(0.565, 0.615), sOut = seg(0.715, 0.775);
      V.sphere.style.opacity = clamp((sp - 0.5) / 0.02) * (1 - seg(0.74, 0.775));
      V.sphere.style.transform = 'translateX(' + (58 * (1 - sIn) + SIDE * sSide * (1 - sOut)) + 'vw) scale(' + (1.75 - 0.5 * sSide) * (1 - 0.55 * sOut) + ')';
      V.sphere.style.filter = 'grayscale(1) brightness(1.2) contrast(1.08) blur(' + (14 * whip(0.5, 0.56) + 8 * whip(0.565, 0.615) + 10 * whip(0.715, 0.775)) + 'px)';
      // 4) 마지막: 카메라가 뒤로 빠지며 네 개의 빛이 드러난다
      const fIn = seg(0.725, 0.79);
      V.tunnel.style.opacity = fIn;
      V.tunnel.style.transform = 'scale(' + (1.6 - 0.6 * fIn) + ')';
      V.tunnel.style.filter = 'blur(' + 10 * (1 - fIn) + 'px)';
      // 1장면: 스크롤 = 손이 뇌로 바뀌는 시간
      if (V.morph.readyState >= 2) {
        if (intro && (V.morph.currentTime >= INTRO || sp > 0.012)) { intro = false; V.morph.pause(); }
        const t = INTRO + clamp(sp / MORPH_END) * (MORPH_LEN - INTRO);
        if (!intro && Math.abs(V.morph.currentTime - t) > 0.03) V.morph.currentTime = t;
      }
      { const on = +V.code.style.opacity > 0.01 && !reduce; if (on !== rainOn) { rainOn = on; on ? rain.start() : rain.stop(); } }
      for (const k of ["sphere"]) {
        const on = +V[k].style.opacity > 0.01;
        if (on && V[k].paused && !reduce) V[k].play().catch(() => {});
        if (!on && !V[k].paused) V[k].pause();
      }
      if (V.tunnel.readyState >= 2) { // 마지막 장면: AI 넷이 하나로 합쳐져 빛으로 터진다
        const tf = clamp((sp - FIN_A) / (FIN_B - FIN_A)) * FIN_LEN;
        if (Math.abs(V.tunnel.currentTime - tf) > 0.03) V.tunnel.currentTime = tf;
      }

      // 프레임이 살짝 안으로 접힌다 (Nolith), 마지막엔 다시 펴진다
      const fold = clamp(sp / 0.08) * (1 - clamp((sp - 0.84) / 0.06));
      stage.style.inset = `${fold * 10}px`; stage.style.borderRadius = `${fold * 22}px`;

      // 마지막: 환해진다
      const lit = clamp((sp - 0.86) / 0.08);
      wash.style.opacity = lit;
      document.body.classList.toggle("lit", lit > 0.55);
      showLit = lit > 0.6;

      // 문구
      for (const c of copies) {
        let o = c.a === 0 ? clamp((c.b - sp) / 0.035) : c.b >= 1 ? clamp((sp - c.a) / 0.04) : band(sp, c.a, c.b);
        o *= 1 - filmK; c.el.style.opacity = o; c.el.style.transform = `translateY(${(1 - o) * 26}px)`;
        c.el.classList.toggle("on", o > 0.5);
      }
      sideScrim.style.opacity = Math.max(...copies.filter((c) => c.el.classList.contains("ll")).map((c) => +c.el.style.opacity || 0));
      const idx = cuts.findIndex((c) => sp < c);
      rail.forEach((li, i) => li.classList.toggle("on", i === idx));
      railBox.style.opacity = lit > 0.3 ? 0 : clamp(sp / 0.06);
      hudStep.textContent = `${String(idx + 1).padStart(2, "0")} / 06  ${stageNames[idx]}`;
      hint.style.opacity = clamp(1 - sp / 0.04) * (1 - filmK);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    document.querySelector(".ask").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = e.target.querySelector("input").value.trim();
      document.querySelector(".finale small").textContent = v
        ? `"${v}" — 시안이라 아직 실제 팀 구성으로 연결되지 않습니다.`
        : "만들고 싶은 것을 한 줄로 적어 주세요.";
    });
    if (location.hash === "#start") setTimeout(() => window.scrollTo(0, document.documentElement.scrollHeight), 60);
  }

  const pr = document.querySelector(".phead canvas.rain"); if (pr && !reduce) window.makeRain(pr).start();

  // ── 하위 페이지: 머리 영상 시차 ──
  const pv = document.querySelector(".phead video");
  if (pv && !reduce) addEventListener("scroll", () => { pv.style.transform = `translateY(${scrollY * 0.28}px) scale(${1 + scrollY / 3000})`; }, { passive: true });

  // ── 작동 방식: 화면 가운데 온 단계가 큰 숫자를 바꾼다 ──
  const steps = [...document.querySelectorAll(".steps article")];
  if (steps.length) {
    const n = document.querySelector(".steps .n"), t = document.querySelector(".steps .t"), bar = document.querySelector(".steps .bar i");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = steps.indexOf(e.target);
      steps.forEach((s, j) => s.classList.toggle("on", j === i));
      n.textContent = String(i + 1).padStart(2, "0"); t.textContent = e.target.dataset.t; bar.style.width = ((i + 1) / steps.length) * 100 + "%";
    }), { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  }
})();
