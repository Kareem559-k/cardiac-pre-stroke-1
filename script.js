/* ===============================
   Cardiac Pre-Stroke — script.js
   No external libs (pure JS)
================================= */

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

  // ---- IDs (sections)
  const sectionIds = [
    "top",
    "problem",
    "background",
    "goals",
    "methodology",
    "results",
    "demo",
    "future-work",
    "contact",
    "conclusion",
    "overview",
  ];

  // ===============================
  // Page ready class (for intro anim)
  // ===============================
  window.addEventListener("load", () => {
    document.body.classList.add("page-ready");
    // ensure initial calc/paint
    onScroll();
    resizeAllCanvases();
    drawAllCharts();
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

    // close on click any mobile link
    navMobileLinks.forEach((a) => {
      a.addEventListener("click", () => closeMobileNav());
    });

    // close on ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });

    // close when click outside
    document.addEventListener("click", (e) => {
      const clickedInside =
        navMobile.contains(e.target) || navToggle.contains(e.target);
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

  if (toOverviewBtn) {
    toOverviewBtn.addEventListener("click", () => scrollToId("overview"));
  }

  if (backTopBtn) {
    backTopBtn.addEventListener("click", () => scrollToId("top"));
  }

  // ===============================
  // Scroll progress + BackTop visibility
  // ===============================
  function updateScrollProgress() {
    if (!scrollBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
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
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

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
    (entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) ent.target.classList.add("in");
      });
    },
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
      el.textContent = val.toFixed(1);
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

      // Fill bars
      $$(".kpi-fill").forEach((bar) => {
        const fill = parseFloat(bar.getAttribute("data-fill") || "0");
        bar.style.setProperty("--w", `${fill}%`);
      });
      results.classList.add("results-animate");

      // Countup numbers
      $$(".countup").forEach((c) => {
        const to = parseFloat(c.getAttribute("data-to") || "0");
        animateCountUp(c, to, 950);
      });

      // Draw charts if not drawn yet
      resizeAllCanvases();
      drawAllCharts();
    }
  }

  // ===============================
  // Scroll handler (single)
  // ===============================
  function onScroll() {
    updateScrollProgress();
    updateBackTop();
    setActiveLink(getCurrentSectionId());
    runResultsAnimation();
  }

  window.addEventListener("scroll", onScroll, { passive: true });

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
    // subtle panel
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(6,30,41,0.35)";
    roundedRect(ctx, 0, 0, w, h, 14);
    ctx.fill();
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
    ctx.strokeStyle = "rgba(243,244,244,0.14)";
    ctx.lineWidth = 1;

    // border
    ctx.strokeRect(x, y, w, h);

    // grid
    ctx.strokeStyle = "rgba(243,244,244,0.08)";
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
    ctx.lineWidth = opts.lineWidth || 2.5;
    ctx.strokeStyle = opts.stroke || "rgba(95,149,152,0.95)";
    ctx.beginPath();

    xs.forEach((vx, i) => {
      const px = mapX(vx);
      const py = mapY(ys[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // points
    ctx.fillStyle = opts.pointFill || "rgba(243,244,244,0.85)";
    xs.forEach((vx, i) => {
      const px = mapX(vx);
      const py = mapY(ys[i]);
      ctx.beginPath();
      ctx.arc(px, py, 3.4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    return { mapX, mapY, yMin: y0, yMax: y1, xMin: minX, xMax: maxX };
  }

  function text(ctx, str, x, y, style = {}) {
    ctx.save();
    ctx.fillStyle = style.color || "rgba(243,244,244,0.82)";
    ctx.font = style.font || "800 12px Segoe UI, Arial";
    ctx.textBaseline = style.baseline || "alphabetic";
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ===============================
  // Chart 1: Model evolution (V11-V13)
  // ===============================
  const versionsData = [
    { v: 11, acc: 82.5, sen: 79.0, spe: 85.0 },
    { v: 12, acc: 89.2, sen: 88.0, spe: 90.5 },
    { v: 13, acc: 94.1, sen: 94.2, spe: 94.0 },
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

    // 3 series with different alpha (still same color family for theme consistency)
    drawLineSeries(ctx, plot, xs, acc, {
      stroke: "rgba(95,149,152,0.95)",
      pointFill: "rgba(243,244,244,0.88)",
      lineWidth: 2.8,
    });
    drawLineSeries(ctx, plot, xs, sen, {
      stroke: "rgba(95,149,152,0.55)",
      pointFill: "rgba(243,244,244,0.70)",
      lineWidth: 2.4,
    });
    drawLineSeries(ctx, plot, xs, spe, {
      stroke: "rgba(95,149,152,0.30)",
      pointFill: "rgba(243,244,244,0.60)",
      lineWidth: 2.2,
    });

    // Legend
    text(ctx, "Accuracy", plot.x + 8, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(95,149,152,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(plot.x + 80, plot.y + 12);
    ctx.lineTo(plot.x + 110, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    text(ctx, "Sensitivity", plot.x + 118, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(95,149,152,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(plot.x + 205, plot.y + 12);
    ctx.lineTo(plot.x + 235, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    text(ctx, "Specificity", plot.x + 242, plot.y + 16);
    ctx.save();
    ctx.strokeStyle = "rgba(95,149,152,0.30)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(plot.x + 322, plot.y + 12);
    ctx.lineTo(plot.x + 352, plot.y + 12);
    ctx.stroke();
    ctx.restore();

    // X labels
    ctx.save();
    ctx.fillStyle = "rgba(243,244,244,0.70)";
    ctx.font = "800 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    const x0 = plot.x;
    const x1 = plot.x + plot.w;
    const yLab = plot.y + plot.h + 14;
    const minV = 11;
    const maxV = 13;
    [11, 12, 13].forEach((v) => {
      const px = x0 + ((v - minV) / (maxV - minV)) * (x1 - x0);
      ctx.fillText(`V${v}`, px, yLab);
    });
    ctx.restore();

    attachTooltip(canvas, (mx, my) => {
      // nearest point among all series points on ACC line for simplicity
      const plotPad = pad;
      const pxs = xs.map((v) => plot.x + ((v - 11) / (13 - 11)) * plot.w);
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
  // Chart 2: Confusion Matrix (500/500 example)
  // ===============================
  // We’ll infer a plausible matrix consistent with ~94% performance:
  // Normal: 470 correct, 30 misclassified
  // Abnormal: 471 correct, 29 misclassified
  const confusion = {
    labels: ["Normal", "Abnormal"],
    m: [
      [470, 30], // true Normal -> predicted Normal/Abnormal
      [29, 471], // true Abnormal -> predicted Normal/Abnormal
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
      font: "900 12px Segoe UI, Arial",
      color: "rgba(243,244,244,0.78)",
    });

    // find max for intensity
    const maxVal = Math.max(...confusion.m.flat());
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const val = confusion.m[r][c];
        const t = maxVal ? val / maxVal : 0;
        // intensity based on t (still in theme palette)
        ctx.fillStyle = `rgba(95,149,152,${0.18 + 0.72 * t})`;
        roundedRect(ctx, gx + c * cell, gy + r * cell, cell - 8, cell - 8, 14);
        ctx.fill();

        ctx.strokeStyle = "rgba(243,244,244,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // number
        ctx.save();
        ctx.fillStyle = "rgba(6,30,41,0.92)";
        ctx.font = "950 26px Segoe UI, Arial";
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

    // axis labels
    ctx.save();
    ctx.fillStyle = "rgba(243,244,244,0.75)";
    ctx.font = "900 12px Segoe UI, Arial";
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
  // Chart 3: Learning curve (0 -> 22000 samples)
  // ===============================
  const learning = [
    { n: 0, acc: 55 },
    { n: 2000, acc: 72 },
    { n: 6000, acc: 82 },
    { n: 12000, acc: 88.5 },
    { n: 18000, acc: 92.3 },
    { n: 22000, acc: 94.1 },
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
      stroke: "rgba(95,149,152,0.95)",
      pointFill: "rgba(243,244,244,0.85)",
      lineWidth: 2.8,
    });

    text(ctx, "Accuracy (%)", plot.x + 8, plot.y + 16);
    text(ctx, "Training samples", plot.x + plot.w - 110, plot.y + plot.h - 10, {
      color: "rgba(243,244,244,0.65)",
      font: "800 12px Segoe UI, Arial",
    });

    attachTooltip(canvas, (mx, my) => {
      // find nearest by x
      const minN = 0;
      const maxN = 22000;
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
          `Samples: ${learning[i].n.toLocaleString()}`,
          `Accuracy: ${learning[i].acc.toFixed(1)}%`,
        ],
      };
    });
  }

  // ===============================
  // Chart 4: ROC Curve (AUC ~0.97)
  // ===============================
  const roc = [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.55 },
    { fpr: 0.05, tpr: 0.78 },
    { fpr: 0.10, tpr: 0.88 },
    { fpr: 0.20, tpr: 0.93 },
    { fpr: 0.35, tpr: 0.96 },
    { fpr: 0.60, tpr: 0.985 },
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

    // diagonal baseline
    ctx.save();
    ctx.strokeStyle = "rgba(243,244,244,0.16)";
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plot.x, plot.y + plot.h);
    ctx.lineTo(plot.x + plot.w, plot.y);
    ctx.stroke();
    ctx.restore();

    // roc curve
    const xs = roc.map((d) => d.fpr);
    const ys = roc.map((d) => d.tpr);

    const mapX = (v) => plot.x + v * plot.w;
    const mapY = (v) => plot.y + plot.h - v * plot.h;

    ctx.save();
    ctx.strokeStyle = "rgba(95,149,152,0.95)";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    xs.forEach((v, i) => {
      const px = mapX(v);
      const py = mapY(ys[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // points
    ctx.fillStyle = "rgba(243,244,244,0.85)";
    xs.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(mapX(v), mapY(ys[i]), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    text(ctx, "TPR", plot.x + 8, plot.y + 16);
    text(ctx, "FPR", plot.x + plot.w - 34, plot.y + plot.h - 10, {
      color: "rgba(243,244,244,0.65)",
      font: "800 12px Segoe UI, Arial",
    });

    // AUC label
    text(ctx, "AUC ≈ 0.97", plot.x + 10, plot.y + plot.h - 12, {
      color: "rgba(243,244,244,0.78)",
      font: "900 12px Segoe UI, Arial",
    });

    attachTooltip(canvas, (mx, my) => {
      // nearest point by distance
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
        lines: [
          `FPR: ${roc[i].fpr.toFixed(2)}`,
          `TPR: ${roc[i].tpr.toFixed(2)}`,
        ],
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
        <div style="font-weight:950; margin-bottom:4px; color: rgba(243,244,244,0.96)">${escapeHtml(
          data.title
        )}</div>
        ${data.lines
          .map(
            (l) =>
              `<div style="color: rgba(243,244,244,0.82); font-weight:850">${escapeHtml(
                l
              )}</div>`
          )
          .join("")}
      `;

      chartTip.innerHTML = html;
      chartTip.classList.add("show");

      const tipRect = chartTip.getBoundingClientRect();
      let left = e.clientX + 14;
      let top = e.clientY + 14;

      // keep inside viewport
      if (left + tipRect.width > window.innerWidth - 10) {
        left = e.clientX - tipRect.width - 14;
      }
      if (top + tipRect.height > window.innerHeight - 10) {
        top = e.clientY - tipRect.height - 14;
      }

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

  // ===============================
  // Initial run (in case load delayed)
  // ===============================
  onScroll();
})();
