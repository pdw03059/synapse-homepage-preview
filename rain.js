// 매트릭스 코드 비 — 영상이 아니라 화면에 직접 그린다(어떤 해상도에서도 또렷함)
// 세 겹의 깊이(멀리 작고 흐림 / 중간 / 가까이 크고 밝음), 흰 머리 글자 + 초록 꼬리, 글자가 계속 바뀜, 영화처럼 좌우 반전된 가타카나
window.makeRain = (canvas) => {
  const ctx = canvas.getContext("2d");
  const GL = "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>¦";
  const FONT = '"MS Gothic", "Yu Gothic", "Meiryo", "Malgun Gothic", monospace';
  const LAYERS = [ // size(px), 열 밀도, 속도, 밝기, 흐림(px)
    { size: 12, fill: 0.9, speed: 0.75, gain: 0.5, blur: 1.0 },
    { size: 19, fill: 0.92, speed: 1.35, gain: 1.0, blur: 0 },
    { size: 36, fill: 0.2, speed: 2.3, gain: 1.0, blur: 2.4 },
  ];
  let W = 0, H = 0, dpr = 1, layers = [], raf = 0, last = 0, running = false;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const glyph = () => GL[(Math.random() * GL.length) | 0];
  const newStream = (L, rows, first) => ({ y: first ? rnd(-rows, rows) : rnd(-rows * 0.6, -2), v: rnd(11, 24) * L.speed, len: (rnd(12, 40)) | 0, next: 0 });

  const build = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    layers = LAYERS.map((L) => {
      const cols = Math.ceil(W / L.size), rows = Math.ceil(H / L.size) + 2;
      const col = [];
      for (let c = 0; c < cols; c++) {
        if (Math.random() > L.fill) { col.push(null); continue; }
        const chars = Array.from({ length: rows }, glyph);
        col.push({ chars, streams: [newStream(L, rows, true)] });
      }
      // 미리 흐림을 줄 별도 캔버스(가까운 층 · 먼 층)
      const buf = document.createElement("canvas"); buf.width = canvas.width; buf.height = canvas.height;
      return { L, cols, rows, col, buf, bctx: buf.getContext("2d") };
    });
  };

  const draw = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const ly of layers) {
      const { L, rows, col, bctx, buf } = ly, s = L.size;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
      bctx.font = `${s}px ${FONT}`; bctx.textAlign = "center"; bctx.textBaseline = "top";
      for (let c = 0; c < col.length; c++) {
        const k = col[c]; if (!k) continue;
        const x = c * s + s / 2;
        for (let m = 0; m < 3; m++) k.chars[(Math.random() * rows) | 0] = glyph();      // 글자가 끊임없이 바뀐다
        for (let i = k.streams.length - 1; i >= 0; i--) {
          const st = k.streams[i]; st.y += st.v * dt;
          const head = Math.floor(st.y);
          if (head - st.len > rows) { k.streams.splice(i, 1); continue; }
          for (let r = Math.max(0, head - st.len); r <= Math.min(rows - 1, head); r++) {
            const d = head - r;                                   // 머리에서 떨어진 칸 수
            const f = 1 - d / st.len;                             // 꼬리로 갈수록 0
            let color;
            if (d === 0) color = `rgba(235,255,240,${L.gain})`;                    // 흰 머리
            else if (d < 3) color = `rgba(160,255,190,${L.gain * (0.95 - d * 0.08)})`;
            else color = `rgba(${(10 + 50 * f) | 0},${(150 + 105 * f) | 0},${(60 + 60 * f) | 0},${L.gain * Math.pow(f, 0.9)})`;
            bctx.fillStyle = color;
            bctx.setTransform(-dpr, 0, 0, dpr, x * 2 * dpr, 0);    // 좌우 반전(영화 속 글자처럼)
            bctx.fillText(k.chars[r], x, r * s);
          }
        }
        // 한 열에 줄기가 이어서 떨어지게
        const lastSt = k.streams[k.streams.length - 1];
        if (!lastSt || (lastSt.y - lastSt.len > rnd(3, 14) && k.streams.length < 3 && Math.random() < 0.12)) k.streams.push(newStream(L, rows, false));
      }
      // 합성: 본체 + 빛 번짐(같은 그림을 흐리게 한 번 더, 더하기 혼합)
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = L.blur ? `blur(${L.blur * dpr}px)` : "none"; ctx.globalAlpha = 1; ctx.drawImage(buf, 0, 0);
      ctx.filter = `blur(${(L.blur + 6) * dpr}px)`; ctx.globalAlpha = 0.9; ctx.drawImage(buf, 0, 0);
      ctx.filter = "none"; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    raf = requestAnimationFrame(draw);
  };
  addEventListener("resize", () => { if (canvas.clientWidth !== W || canvas.clientHeight !== H) build(); });
  return {
    start() { if (running) return; if (!W || canvas.clientWidth !== W) build(); running = true; last = performance.now(); raf = requestAnimationFrame(draw); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
};
