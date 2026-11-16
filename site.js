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
  if (foot) foot.innerHTML = `<span>SYNAPSE</span>
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

  // ── 홈: 한 편의 영상처럼 이어지는 무대. 진행도(0~1)는 스크롤 위치이고, 자동 재생이 그 스크롤을 대신 내려 준다 ──
  if (page === "home") {
    const root = document.documentElement;
    const track = document.querySelector(".track"), stage = document.querySelector(".stage");
    const V = Object.fromEntries([...stage.querySelectorAll("video")].map((v) => [v.dataset.k, v]));

    // 화면 모양: 세로로 긴 화면(휴대폰)은 html 에 tall 을 붙여 영상 상자를 화면 폭에 딱 맞춘다(확대해서 잘라 쓰지 않음)
    const mobile = matchMedia("(max-width: 820px), (pointer: coarse)").matches, BL = mobile ? 0.3 : 1;
    const isTall = () => innerHeight > innerWidth * 1.15;
    let tall = isTall(); root.classList.toggle("tall", tall);
    addEventListener("resize", () => { tall = isTall(); root.classList.toggle("tall", tall); });
    // 영상 고르기: 세로 화면용(v) → 휴대폰용 가벼운 것(m) → 기본
    for (const v of Object.values(V)) { const d = v.dataset; if (!d.src) continue; v.src = tall && d.srcV ? d.srcV : mobile && d.srcM ? d.srcM : d.src; v.load(); }

    const rainEl = stage.querySelector("canvas[data-k=code]"), rain = window.makeRain(rainEl); V.code = rainEl; let rainOn = false;
    const wash = stage.querySelector(".wash"), autoBtn = document.querySelector(".auto");
    const copies = [...document.querySelectorAll(".copy")].map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b }));
    const MORPH_END = 0.29, MORPH_LEN = 7.9, INTRO = 3.0; // 두 손 영상: 처음 3초(손이 생겨나 다가옴)는 스스로 재생, 그 뒤는 진행도를 따라간다
    const FIN_A = 0.725, FIN_B = 0.93, FIN_LEN = 4.9;     // 마지막 영상(네 빛이 합쳐져 터짐)
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
        const img = `<img src="assets/kinds/kind-${k}.jpg?v=9" alt="${name} 예시 화면" width="${k === "app" ? 780 : 1800}" height="${k === "app" ? 1688 : 1125}">`;
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

    // ── 실사 도입(영화 오프닝): 끝날 즈음 다음 장면(두 손)과 겹쳐 넘어간다. 같은 방문에서 다시 오면 건너뛴다 ──
    const bars = document.querySelectorAll(".bar-top, .bar-bot");
    const HANDOFF = Math.max(0.3, +(V.intro && V.intro.dataset.handoff) || 1.5);
    let seen = false; try { seen = sessionStorage.getItem("synapse-film") === "1"; } catch (e) {}
    let film = !reduce && !seen && !!V.intro, filmK = film ? 1 : 0, filmEnd = 0, handsAt = 0;
    document.body.classList.toggle("film", film); // 영상 위에서도 메뉴가 또렷하게 보이도록
    const startHands = () => { handsAt = performance.now(); if (intro) V.morph.play().catch(() => { intro = false; }); };
    const endFilm = () => { if (!film) return; film = false; filmEnd = performance.now(); document.body.classList.remove("film"); try { sessionStorage.setItem("synapse-film", "1"); } catch (e) {} startHands(); };
    if (film) {
      V.intro.play().catch(endFilm);
      V.intro.addEventListener("ended", endFilm); V.intro.addEventListener("error", endFilm);
      V.intro.addEventListener("timeupdate", () => { if (V.intro.duration && V.intro.currentTime > V.intro.duration - HANDOFF) endFilm(); });
    } else startHands();
    V.morph.addEventListener("timeupdate", () => { if (intro && V.morph.currentTime >= INTRO) { intro = false; V.morph.pause(); } }); // 화면이 느려도 3초에서 정확히 멈춘다

    // 아이폰은 한 번 재생을 시작해야 영상의 원하는 장면으로 갈 수 있다 → 첫 터치 때 풀어 준다
    const unlock = () => { for (const k of ["morph", "tunnel"]) { const v = V[k]; if (k === "morph" && intro) continue;
      if (v.readyState < 2 && v.paused) { const pr = v.play(); if (pr) pr.then(() => v.pause()).catch(() => {}); } } };
    addEventListener("touchstart", unlock, { passive: true });
    if (mobile) { const pr = V.tunnel.play(); if (pr) pr.then(() => V.tunnel.pause()).catch(() => {}); }

    // 영상이 목표 시간을 따라가게 한다: 앞으로 일정하게 흐를 때는 재생 속도를 맞춰 부드럽게, 그 밖에는 그 장면으로 바로 옮긴다
    const follow = (v, t, now) => {
      if (v.readyState < 1) return;
      const st = v._f || (v._f = { t, at: now, rate: 0 });
      const dt = (now - st.at) / 1000; if (dt <= 0) return;
      st.rate += (clamp((t - st.t) / dt, -8, 8) - st.rate) * 0.18; st.t = t; st.at = now;
      const err = t - v.currentTime, end = (v.duration || 1e9) - 0.05;
      if (st.rate >= 0.5 && st.rate < 3 && Math.abs(err) < 0.45 && t < end) {
        const r = clamp(st.rate + err * 1.6, 0.5, 3);
        if (Math.abs(v.playbackRate - r) > 0.04) v.playbackRate = r;
        if (v.paused) v.play().catch(() => {});
      } else {
        if (!v.paused) v.pause();
        if (!v.seeking && Math.abs(err) > 0.034) v.currentTime = Math.min(t, end);
      }
    };

    // ── 자동 재생: 들어오면 스스로 천천히 내려가며 장면이 이어진다. 손대면 멈추고, 가만히 두면 다시 이어 간다 ──
    const WAY = [[0.235, 4.0, 1.1], [0.43, 3.2, 1.1], [0.64, 3.2, 1.3], [1, 6.0, 0]]; // [도착 진행도, 가는 시간(초), 머무는 시간(초)]
    let autoOn = !reduce, autoWait = 0, leg = null;
    try { if (sessionStorage.getItem("synapse-auto") === "0") autoOn = false; } catch (e) {}
    const paintAuto = () => { autoBtn.setAttribute("aria-pressed", autoOn); autoBtn.setAttribute("aria-label", autoOn ? "자동 재생 멈춤" : "자동 재생"); };
    paintAuto();
    autoBtn.addEventListener("click", () => { autoOn = !autoOn; leg = null; autoWait = 0; paintAuto(); try { sessionStorage.setItem("synapse-auto", autoOn ? "1" : "0"); } catch (e) {} });
    const hold = (e) => { if (e.target.closest && e.target.closest(".auto")) return; leg = null; autoWait = performance.now() + 4500; };
    ["wheel", "touchstart", "touchmove", "keydown", "mousedown"].forEach((ev) => addEventListener(ev, hold, { passive: true }));

    const frame = () => {
      const now = performance.now();
      if (film && scrollY > 8) endFilm();
      if (intro && handsAt && now - handsAt > 9000) intro = false; // 영상이 끝내 안 오면 기다리지 않는다
      filmK = film ? 1 : filmEnd ? Math.max(0, 1 - (now - filmEnd) / (HANDOFF * 1000)) : 0;
      if (V.intro) { const fk = filmK * filmK * (3 - 2 * filmK); V.intro.style.opacity = fk; if (!film && filmK === 0 && !V.intro.paused) V.intro.pause(); }
      bars.forEach((b) => (b.style.transform = "scaleY(" + filmK + ")"));

      const max = track.offsetHeight - innerHeight;
      // 자동 재생이 스크롤을 대신 내린다
      if (autoOn && !film && !intro && max > 0 && now > autoWait && !document.hidden) {
        const cur = scrollY / max;
        if (!leg) {
          const i = WAY.findIndex((w) => w[0] > cur + 0.004);
          if (i >= 0) { const w = WAY[i], prev = i ? WAY[i - 1][0] : 0;
            leg = { from: cur, to: w[0], t0: now + (cur < 0.004 ? 1100 : 0), dur: w[1] * 1000 * clamp((w[0] - cur) / (w[0] - prev), 0.3, 1), hold: w[2] * 1000 }; }
        }
        if (leg && now >= leg.t0) {
          const k = clamp((now - leg.t0) / leg.dur), e = 0.5 - 0.5 * Math.cos(Math.PI * k);
          scrollTo(0, (leg.from + (leg.to - leg.from) * e) * max);
          if (k >= 1) { autoWait = now + leg.hold; leg = null; }
        }
      }
      const p = max > 0 ? clamp(scrollY / max) : 0;
      sp = reduce || !isFinite(sp) ? p : sp + (p - sp) * 0.11;
      if (Math.abs(p - sp) < 0.0004) sp = p;

      // ── 카메라 전환: 장면이 바뀔 때 겹쳐 사라지는 대신, 카메라가 밀고 들어가거나 옆으로 휙 도는 것처럼 움직인다 ──
      const seg = (a, b) => ez(clamp((sp - a) / (b - a)));                 // a~b 구간을 부드럽게 0→1
      const whip = (a, b) => Math.sin(Math.PI * clamp((sp - a) / (b - a))); // 움직이는 동안만 생기는 흐림(속도감)
      // 1) 두 손 → 뇌: 가운데. 세로 화면에서는 손은 화면 폭에 맞추고, 뇌가 될 때 다가가 키운다. 끝에는 카메라가 뇌 속으로 밀고 들어간다
      const mGrow = seg(0.09, 0.2), mDive = seg(0.265, 0.325);
      V.morph.style.transform = "scale(" + (tall ? 1.04 + 0.82 * mGrow : 1) * (1 + 3 * mDive) + ")";
      V.morph.style.filter = mDive > 0.002 ? "blur(" + BL * 16 * mDive + "px)" : "none";
      V.morph.style.opacity = 1 - seg(0.285, 0.325);
      // 2) 코드 비: 뇌를 통과해 도착(크게 → 제자리), 나갈 때는 카메라가 오른쪽으로 돌아 왼쪽으로 흘러 나간다
      const cIn = seg(0.285, 0.35), cOut = seg(0.5, 0.56);
      V.code.style.opacity = cIn * (1 - cOut);
      V.code.style.transform = "translateX(" + -46 * cOut + "vw) scale(" + (1.5 - 0.5 * cIn + 0.1 * clamp((sp - 0.33) / 0.2)) + ")";
      { const b = BL * (12 * (1 - cIn) + 14 * whip(0.5, 0.56)); V.code.style.filter = b > 0.05 ? "blur(" + b + "px)" : "none"; }
      // 3) 구체: 오른쪽에서 가운데로 들어와 머문다. 끝에는 작아지며 네 개의 빛으로 이어진다
      const sIn = seg(0.5, 0.56), sOut = seg(0.715, 0.775), sBase = tall ? 2.0 : 1.3;
      V.sphere.style.opacity = clamp((sp - 0.5) / 0.02) * (1 - seg(0.74, 0.775));
      V.sphere.style.transform = "translateX(" + 58 * (1 - sIn) + "vw) scale(" + sBase * (1 + 0.07 * clamp((sp - 0.56) / 0.16)) * (1 - 0.5 * sOut) + ")";
      { const b = BL * (14 * whip(0.5, 0.56) + 10 * whip(0.715, 0.775)); V.sphere.style.filter = b > 0.05 ? "blur(" + b + "px)" : "none"; }
      // 4) 마지막: 카메라가 뒤로 빠지며 네 개의 빛이 드러나고, 하나로 합쳐져 빛으로 터질 때 화면을 가득 채운다
      const fIn = seg(0.725, 0.79), fBurst = seg(0.875, 0.935);
      V.tunnel.style.opacity = fIn;
      V.tunnel.style.transform = "scale(" + (tall ? 1.15 : 1) * (1.6 - 0.6 * fIn) * (1 + (tall ? 3.2 : 0.2) * fBurst) + ")";
      { const b = BL * 10 * (1 - fIn); V.tunnel.style.filter = b > 0.05 ? "blur(" + b + "px)" : "none"; }

      // 영상 시간 = 진행도
      if (intro && sp > 0.012) { intro = false; V.morph.pause(); }
      if (!intro) follow(V.morph, INTRO + clamp(sp / MORPH_END) * (MORPH_LEN - INTRO), now);
      follow(V.tunnel, clamp((sp - FIN_A) / (FIN_B - FIN_A)) * FIN_LEN, now);
      { const on = +V.code.style.opacity > 0.01 && !reduce; if (on !== rainOn) { rainOn = on; on ? rain.start() : rain.stop(); } }
      { const on = +V.sphere.style.opacity > 0.01; if (on && V.sphere.paused && !reduce) V.sphere.play().catch(() => {}); if (!on && !V.sphere.paused) V.sphere.pause(); }

      // 프레임이 살짝 안으로 접힌다, 마지막엔 다시 펴진다
      const fold = clamp(sp / 0.08) * (1 - clamp((sp - 0.84) / 0.06));
      stage.style.inset = `${fold * 10}px`; stage.style.borderRadius = `${fold * 22}px`;

      // 마지막: 환해진다
      const lit = clamp((sp - 0.86) / 0.08);
      wash.style.opacity = lit;
      document.body.classList.toggle("lit", lit > 0.55);
      showLit = lit > 0.6;
      autoBtn.style.opacity = (1 - lit) * (1 - filmK * 0.4);
      autoBtn.style.pointerEvents = lit > 0.6 ? "none" : "";

      // 문구(지금은 마지막 시작 화면만 있음. index.html 의 '문구 자리' 참고)
      for (const c of copies) {
        let o = c.a === 0 ? clamp((c.b - sp) / 0.035) : c.b >= 1 ? clamp((sp - c.a) / 0.04) : band(sp, c.a, c.b);
        o *= 1 - filmK; c.el.style.opacity = o; c.el.style.transform = `translateY(${(1 - o) * 26}px)`;
        c.el.classList.toggle("on", o > 0.5);
      }
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
    if (location.hash === "#start") { autoOn = false; paintAuto(); setTimeout(() => window.scrollTo(0, document.documentElement.scrollHeight), 60); }
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
