/* script.js
   - Demo removed from nav/sections
   - Better animations + new chart data (numbers changed)
   - Same chart types: evolution / confusion / learning / ROC
*/

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // ---- Elements
  const navToggle = $("#navToggle");
  const navMobile = $("#navMobile");
  const navLinks = $$(".nav-link");
  const navMobileLinks = $$(".nav-m");
  const topNav = $("#topNav");

  const scrollBar = $("#scrollProgressBar");
  const toOverviewBtn = $("#toOverview");
  const backTopBtn = $("#backTop");

  const chartTip = $("#chartTip");
  const contactForm = $("#contactForm");
  const contactNext = $("#contactNext");
  const contactSuccess = $("#cfSuccess");

  // ---- IDs (sections) - demo removed
  const sectionIds = [
    "top",
    "team",
    "overview",
    "problem",
    "background",
    "goals",
    "methodology",
    "results",
    "future-work",
    "contact",
  ];

  // ===============================
  // Page ready class (for intro anim)
  // ===============================
  window.addEventListener("load", () => {
    document.body.classList.add("page-ready");
    onScroll();
    resizeAllCanvases();
    drawAllCharts();

    if (contactSuccess) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sent") === "1") contactSuccess.classList.add("show");
    }
  });

  // ===============================
  // Mobile nav toggle
  // ===============================
  function closeMobileNav() {
    if (!navMobile) return;
    navMobile.classList.remove("open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    if (navToggle) navToggle.setAttribute("aria-label", "Open menu");
  }

  function openMobileNav() {
    if (!navMobile) return;
    navMobile.classList.add("open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
    if (navToggle) navToggle.setAttribute("aria-label", "Close menu");
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMobile.classList.contains("open");
      isOpen ? closeMobileNav() : openMobileNav();
    });

    navMobileLinks.forEach((a) => a.addEventListener("click", () => closeMobileNav()));

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });

    document.addEventListener("click", (e) => {
      const clickedInside = navMobile.contains(e.target) || navToggle.contains(e.target);
      if (!clickedInside) closeMobileNav();
    });
  }

  // ===============================
  // Smooth scroll helpers
  // ===============================
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (toOverviewBtn) toOverviewBtn.addEventListener("click", () => scrollToId("overview"));
  if (backTopBtn) backTopBtn.addEventListener("click", () => scrollToId("top"));

  // ===============================
  // Scroll progress + BackTop visibility
  // ===============================
  function updateScrollProgress() {
    if (!scrollBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  function updateBackTop() {
    if (!backTopBtn) return;
    const show = (window.scrollY || 0) > 600;
    backTopBtn.classList.toggle("show", show);
  }

  // ===============================
  // Active nav link (desktop)
  // ===============================
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  function setActiveLink(activeId) {
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : "";
      a.classList.toggle("active", id === activeId);
    });
  }

  function getCurrentSectionId() {
    const y = window.scrollY + (topNav ? topNav.offsetHeight + 40 : 110);
    let current = "top";
    for (const sec of sections) {
      if (sec.offsetTop <= y) current = sec.id;
    }
    return current;
  }

  // ===============================
  // Reveal animations (IntersectionObserver)
  // ===============================
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => entries.forEach((ent) => ent.isIntersecting && ent.target.classList.add("in")),
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  // ===============================
  // CountUp + KPI fill (when results appears)
  // ===============================
  let resultsAnimated = false;

  function animateCountUp(el, to, duration = 900) {
    const start = 0;
    const t0 = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - t0) / duration);
      const val = start + (to - start) * easeOutCubic(p);
      // keep one decimal for percentages, but allow integer-like too
      el.textContent = (to % 1 === 0 ? val.toFixed(0) : val.toFixed(1));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function runResultsAnimation() {
    const results = document.getElementById("results");
    if (!results) return;

    const rect = results.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.72 && rect.bottom > 120;

    if (inView && !resultsAnimated) {
      resultsAnimated = true;

      $$(".kpi-fill").forEach((bar) => {
        const fill = parseFloat(bar.getAttribute("data-fill") || "0");
        bar.style.setProperty("--w", `${fill}%`);
      });
      results.classList.add("results-animate");

      $$(".countup").forEach((c) => {
        const to = parseFloat(c.getAttribute("data-to") || "0");
        animateCountUp(c, to, 950);
      });

      resizeAllCanvases();
      drawAllCharts();
    }
  }

  // ===============================
  // Scroll handler
  // ===============================
  function onScroll() {
    updateScrollProgress();
    updateBackTop();
    setActiveLink(getCurrentSectionId());
    runResultsAnimation();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (contactForm && contactNext) {
    contactForm.addEventListener("submit", () => {
      const nextUrl = `${window.location.origin}${window.location.pathname}?sent=1#contact`;
      contactNext.value = nextUrl;
    });
  }


  // ===============================
  // Canvas charts (pure canvas)
  // ===============================
  const chartCanvases = {
    versions: $("#chartVersions"),
    confusion: $("#chartConfusion"),
    learning: $("#chartLearning"),
    roc: $("#chartROC"),
  };

  function resizeCanvasToDisplaySize(canvas) {
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    const needResize = canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr);
    if (needResize) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    }
  }

  function resizeAllCanvases() {
    Object.values(chartCanvases).forEach(resizeCanvasToDisplaySize);
  }

  window.addEventListener("resize", () => {
    resizeAllCanvases();
    drawAllCharts();
  });

  // --- Shared drawing helpers
  function clear(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  }

  function panelBackground(ctx, w, h) {
    ctx.save();
    // dark glass + subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(8,12,20,0.75)");
    grad.addColorStop(1, "rgba(8,12,20,0.35)");
    ctx.fillStyle = grad;
    roundedRect(ctx, 0, 0, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawAxes(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    const gx = 5;
    const gy = 4;
    for (let i = 1; i < gx; i++) {
      const xx = x + (w * i) / gx;
      ctx.beginPath();
      ctx.moveTo(xx, y);
      ctx.lineTo(xx, y + h);
      ctx.stroke();
    }
    for (let i = 1; i < gy; i++) {
      const yy = y + (h * i) / gy;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function setGlow(ctx, color, blur = 10) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function drawLineSeries(ctx, plot, xs, ys, opts = {}) {
    const { x, y, w, h } = plot;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padY = (maxY - minY) * 0.08 || 1;
    const y0 = minY - padY;
    const y1 = maxY + padY;

    const mapX = (v) => x + ((v - minX) / (maxX - minX || 1)) * w;
    const mapY = (v) => y + h - ((v - y0) / (y1 - y0 || 1)) * h;

    ctx.save();
    ctx.lineWidth = opts.lineWidth || 3.0;
    ctx.strokeStyle = opts.stroke || "rgba(110,243,255,0.98)";
    setGlow(ctx, opts.glow || "rgba(110,243,255,0.35)", opts.blur || 10);
    ctx.beginPath();

    xs.forEach((vx, i) => {
      const px = mapX(vx);
      const py = mapY(ys[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = opts.pointFill || "rgba(245,247,255,0.92)";
    xs.forEach((vx, i) => {
      const px = mapX(vx);
      const py = mapY(ys[i]);
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    return { mapX, mapY, yMin: y0, yMax: y1, xMin: minX, xMax: maxX };
  }

  function text(ctx, str, x, y, style = {}) {
    ctx.save();
    ctx.fillStyle = style.color || "rgba(245,247,255,0.82)";
    ctx.font = style.font || "900 12px \"Space Grotesk\", Segoe UI, Arial";
    ctx.textBaseline = style.baseline || "alphabetic";
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ===============================
  // Chart 1: Model evolution (V12-V14) - numbers changed
  // ===============================
  const versionsData = [
    { v: 12, acc: 86.2, sen: 84.0, spe: 88.1 },
    { v: 13, acc: 91.2, sen: 90.4, spe: 91.8 },
    { v: 14, acc: 95.4, sen: 96.1, spe: 94.3 },
  ];

  function drawVersionsChart() {
    const canvas = chartCanvases.versions;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    clear(ctx, w, h);
    panelBackground(ctx, w, h);

    const pad = 18;
    const plot = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

    drawAxes(ctx, plot.x, plot.y, plot.w, plot.h);

    const xs = versionsData.map((d) => d.v);
    const acc = versionsData.map((d) => d.acc);
    const sen = versionsData.map((d) => d.sen);
    const spe = versionsData.map((d) => d.spe);

    drawLineSeries(ctx, plot, xs, acc, {
      stroke: "rgba(110,243,255,1)",
      pointFill: "rgba(245,247,255,0.96)",
      lineWidth: 3.1,
      glow: "rgba(110,243,255,0.45)",
      blur: 12,
    });
    drawLineSeries(ctx, plot, xs, sen, {
      stroke: "rgba(176,129,255,0.90)",
      pointFill: "rgba(245,247,255,0.90)",
      lineWidth: 2.8,
      glow: "rgba(176,129,255,0.35)",
      blur: 10,
    });
    drawLineSeries(ctx, plot, xs, spe, {
      stroke: "rgba(62,255,190,0.85)",
      pointFill: "rgba(245,247,255,0.86)",
      lineWidth: 2.6,
      glow: "rgba(62,255,190,0.30)",
      blur: 10,
    });

    // Legend
    text(ctx, "Accuracy", plot.x + 8, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(110,243,255,1)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(plot.x + 78, plot.y + 12);
    ctx.lineTo(plot.x + 108, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    text(ctx, "Sensitivity", plot.x + 118, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(176,129,255,0.90)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(plot.x + 206, plot.y + 12);
    ctx.lineTo(plot.x + 236, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    text(ctx, "Specificity", plot.x + 246, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(62,255,190,0.85)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(plot.x + 328, plot.y + 12);
    ctx.lineTo(plot.x + 358, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    // X labels
    ctx.save();
    ctx.fillStyle = "rgba(245,247,255,0.70)";
    ctx.font = "900 12px \"Space Grotesk\", Segoe UI, Arial";
    ctx.textAlign = "center";
    const x0 = plot.x;
    const x1 = plot.x + plot.w;
    const yLab = plot.y + plot.h + 14;
    const minV = 12;
    const maxV = 14;
    [12, 13, 14].forEach((v) => {
      const px = x0 + ((v - minV) / (maxV - minV)) * (x1 - x0);
      ctx.fillText(`V${v}`, px, yLab);
    });
    ctx.restore();

    attachTooltip(canvas, (mx) => {
      const pxs = xs.map((v) => plot.x + ((v - 12) / (14 - 12)) * plot.w);
      let best = { i: 0, d: Infinity };
      pxs.forEach((px, i) => {
        const d = Math.abs(mx - px);
        if (d < best.d) best = { i, d };
      });
      const i = best.i;
      return {
        title: `Model V${versionsData[i].v}`,
        lines: [
          `Accuracy: ${versionsData[i].acc.toFixed(1)}%`,
          `Sensitivity: ${versionsData[i].sen.toFixed(1)}%`,
          `Specificity: ${versionsData[i].spe.toFixed(1)}%`,
        ],
      };
    });
  }

  // ===============================
  // Chart 2: Confusion Matrix (supports match 2249 / 6451) - numbers changed
  // ===============================
  const confusion = {
    labels: ["Normal", "Abnormal"],
    // totals: Normal 2249, Abnormal 6451
    // [[TN, FP],[FN, TP]]
    m: [
      [2080, 169],
      [310, 6141],
    ],
  };

  function drawConfusionChart() {
    const canvas = chartCanvases.confusion;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    clear(ctx, w, h);
    panelBackground(ctx, w, h);

    const pad = 18;
    const titleH = 20;
    const gridSize = Math.min(w - pad * 2, h - pad * 2 - titleH - 10);
    const gx = pad;
    const gy = pad + titleH + 10;
    const cell = gridSize / 2;

    text(ctx, "True (rows) vs Predicted (cols)", gx, pad + 14, {
      font: "950 12px \"Space Grotesk\", Segoe UI, Arial",
      color: "rgba(245,247,255,0.78)",
    });

    const maxVal = Math.max(...confusion.m.flat());
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const val = confusion.m[r][c];
        const t = maxVal ? val / maxVal : 0;

        ctx.fillStyle = `rgba(92,230,255,${0.18 + 0.72 * t})`;
        roundedRect(ctx, gx + c * cell, gy + r * cell, cell - 8, cell - 8, 14);
        ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

        ctx.save();
        ctx.fillStyle = "rgba(245,247,255,0.95)";
        ctx.font = "950 26px \"Space Grotesk\", Segoe UI, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          String(val),
          gx + c * cell + (cell - 8) / 2,
          gy + r * cell + (cell - 8) / 2
        );
        ctx.restore();
      }
    }

    ctx.save();
    ctx.fillStyle = "rgba(245,247,255,0.88)";
    ctx.font = "900 13px \"Space Grotesk\", Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Pred Normal", gx + cell * 0.5 - 4, gy - 8);
    ctx.fillText("Pred Abnormal", gx + cell * 1.5 - 4, gy - 8);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("True Normal", gx - 10, gy + cell * 0.5 - 4);
    ctx.fillText("True Abnormal", gx - 10, gy + cell * 1.5 - 4);
    ctx.restore();

    attachTooltip(canvas, (mx, my) => {
      const col = Math.floor((mx - gx) / cell);
      const row = Math.floor((my - gy) / cell);
      if (row < 0 || row > 1 || col < 0 || col > 1) return null;
      const val = confusion.m[row][col];
      return {
        title: "Confusion Matrix",
        lines: [
          `True: ${confusion.labels[row]}`,
          `Pred: ${confusion.labels[col]}`,
          `Count: ${val}`,
        ],
      };
    });
  }

  // ===============================
  // Chart 3: Learning curve (0 -> 87K) - numbers changed
  // ===============================
  const learning = [
    { n: 0, acc: 56.0 },
    { n: 12000, acc: 79.5 },
    { n: 26000, acc: 87.0 },
    { n: 42000, acc: 91.2 },
    { n: 64000, acc: 93.8 },
    { n: 87000, acc: 95.4 },
  ];

  function drawLearningChart() {
    const canvas = chartCanvases.learning;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    clear(ctx, w, h);
    panelBackground(ctx, w, h);

    const pad = 18;
    const plot = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

    drawAxes(ctx, plot.x, plot.y, plot.w, plot.h);

    const xs = learning.map((d) => d.n);
    const ys = learning.map((d) => d.acc);

    drawLineSeries(ctx, plot, xs, ys, {
      stroke: "rgba(110,243,255,1)",
      pointFill: "rgba(245,247,255,0.95)",
      lineWidth: 3.0,
      glow: "rgba(110,243,255,0.40)",
      blur: 12,
    });

    text(ctx, "Accuracy (%)", plot.x + 8, plot.y + 16);
    text(ctx, "Training windows", plot.x + plot.w - 130, plot.y + plot.h - 10, {
      color: "rgba(245,247,255,0.65)",
      font: "900 12px \"Space Grotesk\", Segoe UI, Arial",
    });

    attachTooltip(canvas, (mx) => {
      const minN = 0;
      const maxN = 87000;
      const px = (n) => plot.x + ((n - minN) / (maxN - minN)) * plot.w;
      let best = { i: 0, d: Infinity };
      xs.forEach((n, i) => {
        const d = Math.abs(mx - px(n));
        if (d < best.d) best = { i, d };
      });
      const i = best.i;
      return {
        title: "Learning Curve",
        lines: [
          `Windows: ${learning[i].n.toLocaleString()}`,
          `Accuracy: ${learning[i].acc.toFixed(1)}%`,
        ],
      };
    });
  }

  // ===============================
  // Chart 4: ROC Curve (AUC ~0.98) - numbers changed
  // ===============================
  const roc = [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.01, tpr: 0.58 },
    { fpr: 0.03, tpr: 0.82 },
    { fpr: 0.07, tpr: 0.90 },
    { fpr: 0.14, tpr: 0.94 },
    { fpr: 0.26, tpr: 0.965 },
    { fpr: 0.45, tpr: 0.985 },
    { fpr: 1.0, tpr: 1.0 },
  ];

  function drawROCChart() {
    const canvas = chartCanvases.roc;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    clear(ctx, w, h);
    panelBackground(ctx, w, h);

    const pad = 18;
    const plot = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

    drawAxes(ctx, plot.x, plot.y, plot.w, plot.h);

    // diagonal
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y + plot.h);
    ctx.lineTo(plot.x + plot.w, plot.y);
    ctx.stroke();
    ctx.restore();

    const xs = roc.map((d) => d.fpr);
    const ys = roc.map((d) => d.tpr);

    const mapX = (v) => plot.x + v * plot.w;
    const mapY = (v) => plot.y + plot.h - v * plot.h;

    ctx.save();
    ctx.strokeStyle = "rgba(110,243,255,1)";
    ctx.lineWidth = 3.0;
    setGlow(ctx, "rgba(110,243,255,0.45)", 12);
    ctx.beginPath();
    xs.forEach((v, i) => {
      const px = mapX(v);
      const py = mapY(ys[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(245,247,255,0.95)";
    xs.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(mapX(v), mapY(ys[i]), 3.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    text(ctx, "TPR", plot.x + 8, plot.y + 16);
    text(ctx, "FPR", plot.x + plot.w - 34, plot.y + plot.h - 10, {
      color: "rgba(245,247,255,0.65)",
      font: "900 12px \"Space Grotesk\", Segoe UI, Arial",
    });
    text(ctx, "AUC ≈ 0.98", plot.x + 10, plot.y + plot.h - 12, {
      color: "rgba(245,247,255,0.78)",
      font: "950 12px \"Space Grotesk\", Segoe UI, Arial",
    });

    attachTooltip(canvas, (mx, my) => {
      let best = { i: 0, d: Infinity };
      xs.forEach((v, i) => {
        const dx = mx - mapX(v);
        const dy = my - mapY(ys[i]);
        const d = Math.hypot(dx, dy);
        if (d < best.d) best = { i, d };
      });
      const i = best.i;
      return {
        title: "ROC Point",
        lines: [`FPR: ${roc[i].fpr.toFixed(2)}`, `TPR: ${roc[i].tpr.toFixed(2)}`],
      };
    });
  }

  function drawAllCharts() {
    drawVersionsChart();
    drawConfusionChart();
    drawLearningChart();
    drawROCChart();
  }

  // ===============================
  // Tooltip for charts (single shared bubble)
  // ===============================
  let tooltipBound = new WeakSet();

  function attachTooltip(canvas, getDataAt) {
    if (!canvas || !chartTip) return;
    if (tooltipBound.has(canvas)) return;
    tooltipBound.add(canvas);

    const move = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const data = getDataAt(mx, my);
      if (!data) {
        hideTip();
        return;
      }

      const html = `
        <div style="font-weight:950; margin-bottom:4px; color: rgba(245,247,255,0.96)">${escapeHtml(
          data.title
        )}</div>
        ${data.lines
          .map(
            (l) =>
              `<div style="color: rgba(245,247,255,0.82); font-weight:850">${escapeHtml(l)}</div>`
          )
          .join("")}
      `;

      chartTip.innerHTML = html;
      chartTip.classList.add("show");

      const tipRect = chartTip.getBoundingClientRect();
      let left = e.clientX + 14;
      let top = e.clientY + 14;

      if (left + tipRect.width > window.innerWidth - 10) left = e.clientX - tipRect.width - 14;
      if (top + tipRect.height > window.innerHeight - 10) top = e.clientY - tipRect.height - 14;

      chartTip.style.transform = `translate(${left}px, ${top}px)`;
    };

    const leave = () => hideTip();

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", leave);
    canvas.addEventListener("touchstart", () => hideTip(), { passive: true });
    canvas.addEventListener("touchmove", () => hideTip(), { passive: true });
  }

  function hideTip() {
    if (!chartTip) return;
    chartTip.classList.remove("show");
    chartTip.style.transform = "translate(-9999px, -9999px)";
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
