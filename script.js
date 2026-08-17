(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loader = $('#loader');
  const loadValue = $('#loadValue');
  let loadProgress = 0;
  const loadTimer = window.setInterval(() => {
    loadProgress = Math.min(100, loadProgress + Math.ceil(Math.random() * 13));
    if (loadValue) loadValue.textContent = String(loadProgress).padStart(2, '0');
    if (loadProgress >= 100) {
      window.clearInterval(loadTimer);
      window.setTimeout(() => {
        loader?.classList.add('is-hidden');
        document.body.classList.add('loaded');
      }, reducedMotion ? 0 : 260);
    }
  }, reducedMotion ? 1 : 65);

  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    menuToggle?.setAttribute('aria-expanded', String(open));
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    mobileMenu?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  };
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('#mobileMenu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    if (progress) progress.style.width = `${Math.min(100, ratio * 100)}%`;
    header?.classList.toggle('is-scrolled', scrollY > 24);
  };
  addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.11, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal-up, .reveal-scale').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min((index % 4) * 65, 195)}ms`;
    revealObserver.observe(element);
  });

  const cursor = $('#cursor');
  if (cursor && matchMedia('(pointer:fine)').matches) {
    let targetX = innerWidth / 2;
    let targetY = innerHeight / 2;
    let cursorX = targetX;
    let cursorY = targetY;
    addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });
    const moveCursor = () => {
      cursorX += (targetX - cursorX) * .18;
      cursorY += (targetY - cursorY) * .18;
      cursor.style.transform = `translate(${cursorX - 17}px, ${cursorY - 17}px)`;
      requestAnimationFrame(moveCursor);
    };
    moveCursor();
    $$('a, button, input, textarea').forEach((element) => {
      element.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      element.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  $$('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      if (!matchMedia('(pointer:fine)').matches) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .18;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = Number(entry.target.dataset.count || 0);
      const started = performance.now();
      const duration = reducedMotion ? 1 : 900;
      const tick = (now) => {
        const t = Math.min(1, (now - started) / duration);
        entry.target.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: .5 });
  $$('.count').forEach((element) => countObserver.observe(element));

  const setupCanvas = (canvas) => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: context, width: rect.width, height: rect.height };
  };

  const gaussian = (x, center, spread, amplitude) => amplitude * Math.exp(-Math.pow((x - center) / spread, 2));
  const ecgValue = (phase, shape = {}) => {
    const p = gaussian(phase, .18, .04, .1);
    const q = gaussian(phase, .375, .012, -.15);
    const r = gaussian(phase, .405, shape.rWidth || .012, shape.rHeight || 1);
    const s = gaussian(phase, .435, .016, -.27);
    const t = gaussian(phase, .69, .075, shape.tHeight || .24);
    return p + q + r + s + t;
  };

  const drawSignal = (canvas, options = {}) => {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const color = options.color || '#16d7c0';
    const baseline = options.baseline ?? height * .52;
    const amplitude = options.amplitude ?? height * .3;
    const beats = options.beats || 5.5;
    const offset = options.offset || 0;
    const noise = options.noise || 0;
    const variability = options.variability || 0;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    for (let x = 0; x <= width; x += 1.25) {
      const normalized = x / Math.max(1, width);
      const warped = normalized * beats + offset + Math.sin(normalized * 11) * variability;
      const phase = ((warped % 1) + 1) % 1;
      const deterministicNoise = (Math.sin(x * 1.91 + offset * 21) + Math.sin(x * .27 + 2.4)) * noise;
      const y = baseline - ecgValue(phase, options.shape) * amplitude + deterministicNoise;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = options.lineWidth || 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = options.glow || color;
    ctx.shadowBlur = options.shadowBlur ?? 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const heroCanvas = $('#heroEcg');
  const boardCanvas = $('#boardCanvas');
  const phoneCanvas = $('#phoneCanvas');
  const footerCanvas = $('#footerCanvas');
  let animationStart = performance.now();
  const animateSignals = (now) => {
    const time = reducedMotion ? 0 : (now - animationStart) / 1000;
    drawSignal(heroCanvas, { color: '#16d7c0', beats: 5.2, offset: time * .35, noise: .15, shadowBlur: 15 });
    drawSignal(phoneCanvas, { color: '#16d7c0', beats: 3.2, offset: time * .28, amplitude: 48, baseline: 90, shadowBlur: 8 });
    drawSignal(footerCanvas, { color: '#16d7c0', beats: 8.5, offset: time * .2, amplitude: innerHeight * .2, baseline: innerHeight * .5, lineWidth: 1.4, shadowBlur: 18 });
    if (!reducedMotion) requestAnimationFrame(animateSignals);
  };
  requestAnimationFrame(animateSignals);
  drawSignal(boardCanvas, { color: '#078e99', beats: 6.4, amplitude: 92, shadowBlur: 4, noise: .25, shape: { rHeight: .85, tHeight: .2 } });

  const pipelineStages = [
    {
      kicker: 'STAGE 01 / ACQUISITION',
      title: 'Preserve the original recording.',
      description: 'Read a multi-lead WFDB record and retain source metadata, sampling rate, lead identity, and duration before any transformation.',
      input: 'WFDB .hea + .dat record', output: 'Lead-aligned waveform matrix', guard: 'Record and header consistency'
    },
    {
      kicker: 'STAGE 02 / CONDITIONING',
      title: 'Reduce noise without erasing physiology.',
      description: 'Apply deterministic signal conditioning and normalization while tracking whether signal quality can support downstream measurements.',
      input: 'Raw lead waveforms', output: 'Conditioned ECG windows', guard: 'Quality and amplitude checks'
    },
    {
      kicker: 'STAGE 03 / FEATURE EXTRACTION',
      title: 'Translate morphology into a fixed contract.',
      description: 'Compute the engineered values expected by the model and enforce the exact 300-feature order used by the production package.',
      input: 'Conditioned ECG windows', output: '300-dimensional feature vector', guard: 'Names, order, shape, finite values'
    },
    {
      kicker: 'STAGE 04 / INFERENCE',
      title: 'Separate score, threshold, and class.',
      description: 'Run the stacked ensemble, expose raw probability, calibrate the score, then compare it with the configured decision threshold.',
      input: 'Validated feature vector', output: 'Probability and screening class', guard: 'Model version and threshold trace'
    },
    {
      kicker: 'STAGE 05 / REPORTING',
      title: 'Keep evidence attached to the decision.',
      description: 'Package signal-derived metrics, quality context, model output, charts, limitations, and the review requirement into one case report.',
      input: 'Analysis result and metadata', output: 'Dashboard and PDF report', guard: 'No unsupported clinical claims'
    }
  ];

  let pipelineStage = 0;
  const pipelineCanvas = $('#pipelineCanvas');
  const drawPipeline = (time = 0) => {
    const setup = setupCanvas(pipelineCanvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    ctx.clearRect(0, 0, width, height);
    if (pipelineStage === 0) {
      [0.3, 0.5, 0.7].forEach((level, index) => {
        ctx.save();
        ctx.globalAlpha = index === 1 ? 1 : .35;
        ctx.translate(0, height * (level - .5));
        ctx.beginPath();
        for (let x = 0; x <= width; x += 1.5) {
          const phase = ((x / width * 4.8 + time * .18 + index * .08) % 1 + 1) % 1;
          const y = height * .5 - ecgValue(phase, { rHeight: .75 + index * .1 }) * height * .14;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#16d7c0'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      });
    } else if (pipelineStage === 1) {
      ctx.strokeStyle = 'rgba(255,79,61,.42)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 1.2) {
        const phase = ((x / width * 5.2 + time * .16) % 1 + 1) % 1;
        const y = height * .44 - ecgValue(phase) * height * .16 + Math.sin(x * .83) * 5 + Math.sin(x * .07) * 11;
        if (!x) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#16d7c0'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= width; x += 1.2) {
        const phase = ((x / width * 5.2 + time * .16) % 1 + 1) % 1;
        const y = height * .63 - ecgValue(phase) * height * .16;
        if (!x) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    } else if (pipelineStage === 2) {
      for (let index = 0; index < 150; index += 1) {
        const angle = index * 2.399 + time * .05;
        const radius = 25 + (index % 30) * Math.min(width, height) / 95;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius * .62;
        ctx.beginPath(); ctx.arc(x, y, index % 7 === 0 ? 3.2 : 1.4, 0, Math.PI * 2);
        ctx.fillStyle = index % 7 === 0 ? '#16d7c0' : 'rgba(22,215,192,.32)'; ctx.fill();
      }
      ctx.fillStyle = '#f2efe8'; ctx.font = '500 28px DM Mono'; ctx.textAlign = 'center'; ctx.fillText('300', width/2, height/2 + 9);
    } else if (pipelineStage === 3) {
      const nodes = [{x:.2,y:.23,l:'LGBM'},{x:.8,y:.23,l:'XGB'},{x:.2,y:.77,l:'ET'},{x:.8,y:.77,l:'CAL'},{x:.5,y:.5,l:'V15'}];
      ctx.strokeStyle = 'rgba(22,215,192,.25)'; ctx.setLineDash([5,8]);
      nodes.slice(0,4).forEach((node) => { ctx.beginPath(); ctx.moveTo(node.x*width,node.y*height); ctx.lineTo(width*.5,height*.5); ctx.stroke(); });
      ctx.setLineDash([]);
      nodes.forEach((node,index) => { const r = index === 4 ? 58 : 38; ctx.beginPath(); ctx.arc(node.x*width,node.y*height,r,0,Math.PI*2); ctx.fillStyle = index === 4 ? '#16d7c0' : '#0b2932'; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.2)';ctx.stroke();ctx.fillStyle=index===4?'#071d27':'#f2f7f6';ctx.font=`500 ${index===4?15:9}px DM Mono`;ctx.textAlign='center';ctx.fillText(node.l,node.x*width,node.y*height+4); });
    } else {
      const boxWidth = Math.min(440, width * .65); const boxHeight = Math.min(330, height * .68); const left=(width-boxWidth)/2; const top=(height-boxHeight)/2;
      ctx.fillStyle='#f2f7f6';ctx.fillRect(left,top,boxWidth,boxHeight);
      ctx.fillStyle='#071d27';ctx.fillRect(left,top,boxWidth,45);
      ctx.fillStyle='#16d7c0';ctx.fillRect(left+20,top+17,90,8);
      [0,.18,.36,.54].forEach((row,index)=>{ctx.fillStyle='rgba(7,29,39,.15)';ctx.fillRect(left+22,top+75+row*boxHeight,boxWidth-44,1);ctx.fillStyle=index===0?'#ff5d57':'#078e99';ctx.fillRect(left+22,top+87+row*boxHeight,(boxWidth-44)*(0.82-index*.11),8);});
    }
  };

  const setPipelineStage = (index) => {
    pipelineStage = index;
    const stage = pipelineStages[index];
    $$('.pipeline-tab').forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('#stageKicker').textContent = stage.kicker;
    $('#stageTitle').textContent = stage.title;
    $('#stageDescription').textContent = stage.description;
    $('#stageInput').textContent = stage.input;
    $('#stageOutput').textContent = stage.output;
    $('#stageGuard').textContent = stage.guard;
    drawPipeline(performance.now()/1000);
  };
  $$('.pipeline-tab').forEach((button) => button.addEventListener('click', () => setPipelineStage(Number(button.dataset.stage))));

  let labMode = 'stable';
  const labCanvas = $('#labCanvas');
  const labModes = {
    stable: { rate: '72', variation: 'LOW', noise: '02', label: 'STABLE', beats: 7.2, variability: .002, noiseLevel: .15, shape: {} },
    variable: { rate: '91', variation: 'HIGH', noise: '04', label: 'VARIABLE', beats: 8.7, variability: .038, noiseLevel: .28, shape: { tHeight: .2 } },
    noisy: { rate: '—', variation: 'UNCERTAIN', noise: '31', label: 'NOISY', beats: 7.5, variability: .01, noiseLevel: 5.2, shape: { rHeight: .82 } }
  };
  const setLabMode = (mode) => {
    labMode = mode;
    const data = labModes[mode];
    $$('.lab-button').forEach((button) => button.classList.toggle('active', button.dataset.wave === mode));
    $('#demoRate').textContent = data.rate;
    $('#demoVariation').textContent = data.variation;
    $('#demoNoise').textContent = data.noise;
    $('#demoLabel').textContent = data.label;
  };
  $$('.lab-button').forEach((button) => button.addEventListener('click', () => setLabMode(button.dataset.wave)));

  let lastFrame = 0;
  const animateSecondary = (now) => {
    if (now - lastFrame > 30 || reducedMotion) {
      const time = reducedMotion ? 0 : now / 1000;
      drawPipeline(time);
      const data = labModes[labMode];
      drawSignal(labCanvas, { color: '#11130f', beats: data.beats, offset: time * .12, amplitude: Math.min(130, labCanvas.getBoundingClientRect().height * .36), variability: data.variability, noise: data.noiseLevel, shape: data.shape, shadowBlur: 0, lineWidth: 1.7 });
      lastFrame = now;
    }
    if (!reducedMotion) requestAnimationFrame(animateSecondary);
  };
  requestAnimationFrame(animateSecondary);

  addEventListener('resize', () => {
    drawSignal(boardCanvas, { color: '#078e99', beats: 6.4, amplitude: 92, shadowBlur: 4, noise: .25, shape: { rHeight: .85, tHeight: .2 } });
    drawPipeline(performance.now()/1000);
  }, { passive: true });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const contactForm = $('.contact-form');
  if (contactForm) {
    const next = document.createElement('input');
    next.type = 'hidden'; next.name = '_next'; next.value = `${location.origin}${location.pathname}?message=sent#contact`;
    contactForm.appendChild(next);
  }
})();
