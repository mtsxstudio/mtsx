/* MTSX® Tech · interações e animações de rolagem
   Base sem dependências (menu, formulário, filtros, estudos). As animações usam GSAP + ScrollTrigger
   quando carregam; sem elas, ou com "reduzir movimento", a página fica estática e completa. */
(() => {
  'use strict';

  const WA_NUMBER = '5562994779070';

  /* Envio do formulário.
     'netlify': POST para "/" no formato do Netlify Forms (precisa estar hospedado no Netlify).
     'formspree': defina FORMSPREE_URL com o endpoint da sua conta (https://formspree.io/f/XXXX).
     'none': sem backend; o formulário encaminha para o WhatsApp. */
  const FORM_MODE = document.documentElement.dataset.formMode || 'netlify';
  const FORMSPREE_URL = '';

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  root.classList.add('js');
  $$('a[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });
  $$('.year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Cabeçalho, timecode e playhead ---------- */
  const header = $('.site-header');
  const tcVal = $('.tc-val');
  const bar = $('.playhead-bar span');
  const pad2 = (n) => String(n).padStart(2, '0');
  const toTC = (y) => {
    const frames = Math.floor(y / 6), f = frames % 30, s = Math.floor(frames / 30);
    return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}:${pad2(f)}`;
  };
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.max(0, window.scrollY);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      const tc = toTC(y);
      if (tcVal) tcVal.textContent = tc;
      header.classList.toggle('scrolled', y > 40);
      const goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (goingDown && y > 700 && !root.classList.contains('lock')) header.classList.add('hide');
      else if (goingUp || y < 700) header.classList.remove('hide');
      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  header.addEventListener('focusin', () => header.classList.remove('hide'));

  /* ---------- Seção ativa no menu ---------- */
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === `#${e.target.id}` ? 'true' : 'false'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean).forEach((s) => io.observe(s));
  }

  /* ---------- Menu do celular (tela cheia em qualquer ponto da rolagem) ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#menu');
  let lastFocus = null;
  function menuKeys(e) {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const items = $$('a, button', menu).filter((el) => el.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add('open');
    root.classList.add('lock');
    if (window.__lenis) window.__lenis.stop();
    toggle.setAttribute('aria-expanded', 'true');
    const first = $('a', menu);
    if (first) first.focus({ preventScroll: true });
    document.addEventListener('keydown', menuKeys);
  }
  function closeMenu(restoreFocus = true) {
    menu.classList.remove('open');
    root.classList.remove('lock');
    if (window.__lenis) window.__lenis.start();
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', menuKeys);
    const done = () => { if (!menu.classList.contains('open')) menu.hidden = true; };
    if (reduceMQ.matches) done(); else setTimeout(done, 620);
    if (restoreFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }
  if (toggle && menu) {
    toggle.addEventListener('click', openMenu);
    $('.menu-close', menu).addEventListener('click', () => closeMenu());
    $$('.menu-list a', menu).forEach((a) => a.addEventListener('click', () => closeMenu(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 900 && menu.classList.contains('open')) closeMenu(false); });
  }

  /* ---------- Vídeos: economia de dados e movimento reduzido ---------- */
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const canAutoplay = () => !reduceMQ.matches && !saveData;
  const safePlay = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

  /* Loops dos projetos: só carregam e tocam quando aparecem na tela */
  const projVideos = $$('.proj-video');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!canAutoplay()) return;
          if (!v.src) { v.src = v.dataset.src; }
          safePlay(v);
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '0px 200px 0px 200px', threshold: 0.15 });
    projVideos.forEach((v) => vio.observe(v));
  }

  /* Dialog: vídeo completo com som */
  const vdlg = $('#vid-dialog');
  if (vdlg && typeof vdlg.showModal === 'function') {
    const vid = $('.vd-video', vdlg);
    $$('.proj-play').forEach((btn) => btn.addEventListener('click', () => {
      $('#vd-title', vdlg).textContent = btn.dataset.title;
      vid.src = btn.dataset.video;
      vdlg.showModal();
      if (window.__lenis) window.__lenis.stop();
      safePlay(vid);
    }));
    const closeV = () => vdlg.close();
    $('.vd-close', vdlg).addEventListener('click', closeV);
    vdlg.addEventListener('click', (e) => { if (e.target === vdlg) closeV(); });
    vdlg.addEventListener('close', () => {
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
      if (window.__lenis) window.__lenis.start();
    });
  } else {
    $$('.proj-play').forEach((btn) => btn.addEventListener('click', () => { window.location.href = btn.dataset.video; }));
  }

  /* ---------- Copiar número ---------- */
  $$('.copy').forEach((b) => b.addEventListener('click', async () => {
    const original = b.textContent;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copiado'; }
    catch {
      const target = $('#' + b.getAttribute('aria-describedby'));
      if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      b.textContent = 'Selecionado';
    }
    setTimeout(() => { b.textContent = original; }, 1800);
  }));

  /* ---------- Formulário ---------- */
  const form = $('.form');
  if (form) {
    const status = $('.form-status', form);
    const waBtn = $('.form-wa', form);
    const fields = { nome: $('#f-nome'), contato: $('#f-contato'), servico: $('#f-servico'), mensagem: $('#f-msg') };
    const errEl = { nome: '#e-nome', contato: '#e-contato', servico: '#e-servico', mensagem: '#e-msg' };
    const rules = {
      nome: (v) => v.trim().length >= 2 || 'Informe seu nome.',
      contato: (v) => {
        const t = v.trim();
        if (!t) return 'Informe um WhatsApp ou e-mail para retorno.';
        if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return true;
        const d = t.replace(/\D/g, '');
        return (d.length >= 10 && d.length <= 13) || 'Use um WhatsApp com DDD, como (62) 99999-9999, ou um e-mail válido.';
      },
      servico: (v) => !!v || 'Escolha um serviço.',
      mensagem: (v) => v.trim().length >= 10 || 'Conte um pouco sobre o projeto (pelo menos 10 caracteres).',
    };
    const check = (name) => {
      const res = rules[name](fields[name].value);
      const ok = res === true;
      fields[name].setAttribute('aria-invalid', ok ? 'false' : 'true');
      $(errEl[name]).textContent = ok ? '' : res;
      return ok;
    };
    Object.keys(fields).forEach((k) => {
      fields[k].addEventListener('blur', () => { if (fields[k].value) check(k); });
      fields[k].addEventListener('input', () => { if (fields[k].getAttribute('aria-invalid') === 'true') check(k); });
    });
    const composed = () => {
      const v = (k) => fields[k].value.trim();
      return `Olá, MTSX! Vim pelo site.\nNome: ${v('nome') || '-'}\nContato: ${v('contato') || '-'}\nServiço: ${v('servico') || '-'}\nProjeto: ${v('mensagem') || '-'}`;
    };
    const syncWa = () => { waBtn.href = waLink(composed()); };
    form.addEventListener('input', syncWa);
    syncWa();
    const setStatus = (cls, text) => { status.className = `form-status ${cls}`; status.textContent = text; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = ['nome', 'contato', 'servico', 'mensagem'].filter((k) => !check(k));
      if (bad.length) { fields[bad[0]].focus(); setStatus('bad', 'Revise os campos destacados.'); return; }
      if ($('#f-hp').value) return;
      if (FORM_MODE === 'none' || (FORM_MODE === 'formspree' && !FORMSPREE_URL)) {
        setStatus('bad', 'O envio por formulário ainda não está configurado. Use o botão "Enviar pelo WhatsApp": sua mensagem já vai preenchida.');
        waBtn.focus();
        return;
      }
      form.classList.add('sending');
      setStatus('wait', 'Enviando…');
      try {
        const res = FORM_MODE === 'formspree'
          ? await fetch(FORMSPREE_URL, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
          : await fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus('ok', 'Pedido enviado. A MTSX vai responder pelo contato que você informou.');
        form.reset();
        Object.values(fields).forEach((f) => f.removeAttribute('aria-invalid'));
        syncWa();
      } catch {
        setStatus('bad', 'Não foi possível enviar pelo formulário agora. Use "Enviar pelo WhatsApp": sua mensagem já vai preenchida.');
        waBtn.focus();
      } finally {
        form.classList.remove('sending');
      }
    });
  }

  /* ===================================================================
     Animações (GSAP + ScrollTrigger)
     =================================================================== */
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) { root.classList.remove('motion-ok'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Rolagem macia (Lenis) só com mouse e sem "reduzir movimento" ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (window.Lenis && finePointer.matches && !reduceMQ.matches) {
    const lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('skip')) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -(parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 72) + 8, duration: 1.4 });
      history.replaceState(null, '', id);
    });
  }

  /* ---------- Cursor próprio e botões magnéticos ---------- */
  const cursor = $('.cursor');
  if (cursor && finePointer.matches && !reduceMQ.matches) {
    root.classList.add('has-cursor');
    const label = $('.cursor-label', cursor);
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    gsap.set(cursor, { x: -100, y: -100 });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('hidden'));
    document.addEventListener('pointerover', (e) => {
      const big = e.target.closest('[data-cursor]');
      const link = !big && e.target.closest('a, button, summary, input, select, textarea, label');
      cursor.classList.toggle('big', !!big);
      cursor.classList.toggle('link', !!link);
      label.textContent = big ? big.dataset.cursor : '';
    });
    $$('.btn').forEach((btn) => {
      const bx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      const by = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        bx((e.clientX - (r.left + r.width / 2)) * 0.28);
        by((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      btn.addEventListener('pointerleave', () => { bx(0); by(0); });
    });
  }

  /* ---------- Texto que decodifica letra por letra ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/+';
  function scramble(el, dur = 0.9) {
    const final = el.textContent;
    const o = { p: 0 };
    gsap.to(o, {
      p: 1, duration: dur, ease: 'none',
      onUpdate: () => {
        const n = Math.floor(o.p * final.length);
        let out = final.slice(0, n);
        for (let i = n; i < final.length; i++) out += /\s|·/.test(final[i]) ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.textContent = out;
      },
      onComplete: () => { el.textContent = final; },
    });
  }

  /* Divide texto em palavras (para subir) sem perder <em> e imagens */
  function splitWords(el, cls = 'w') {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    const out = [];
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement('span');
        outer.className = cls;
        if (cls === 'w') { const inner = document.createElement('span'); inner.textContent = part; outer.appendChild(inner); out.push(inner); }
        else { outer.textContent = part; out.push(outer); }
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return out;
  }
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.display = 'inline-block';
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      return s;
    });
  }
  const belowFold = (el) => el.getBoundingClientRect().top > window.innerHeight * 0.9;

  const mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 901px)', phone: '(max-width: 640px)' }, (ctx) => {
    const { motion, desk, phone } = ctx.conditions;
    if (!motion) { root.classList.remove('motion-ok'); return; }
    root.classList.add('motion-ok');

    /* ---- Hero: título entra letra por letra e os celulares sobem em leque ---- */
    const rig = $('.phones-rig');
    const baseRY = desk ? -14 : -6, baseRX = desk ? 6 : 4;
    const startHero = () => {
      const heroChars = $$('.hero-title .ln-in').map((el) => splitChars(el));
      const h1 = $('.hero-title'); if (h1 && !h1.hasAttribute('aria-label')) h1.setAttribute('aria-label', 'Sua marca. Em outro nível.');
      const moves = $$('.phone-move');
      const order = [moves[1], moves[0], moves[2]];
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro
        .from(heroChars.flat(), { yPercent: 115, duration: 1.2, stagger: 0.026 }, 0.1)
        .from(['.hero-eyebrow', '.lead', '.hero-actions', '.hero-meta'], { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.5)
        .from(order, { y: () => window.innerHeight * 0.7, rotateX: 28, opacity: 0, duration: 1.6, stagger: 0.14, ease: 'expo.out' }, 0.2)
        .from('.phone-chip', { y: 12, opacity: 0, duration: 0.8, stagger: 0.1 }, 1.2)
        .from('.phones-floor', { opacity: 0, scaleX: 0.4, duration: 1.4 }, 0.6);

      /* Rolagem: mergulho no site do meio
         A: texto e celulares laterais saem · B: celular central vai ao centro e cresce
         C: passeio rolando pelo site · D: sai do site e volta para a MTSX */
      const stage = $('.hero-stage'), fig = $('.hero-phones'), mid = $('.p-mid');
      const midMove = $('.phone-move', mid), strip = $('.s-caio', mid);
      const m = { dx: 0, dy: 0, S: 1 };
      const measure = () => {
        const sr = stage.getBoundingClientRect(), fr = fig.getBoundingClientRect();
        const body = $('.phone-body', mid);
        const pw = mid.offsetWidth, pad = parseFloat(getComputedStyle(body).paddingLeft) || 0;
        const sw = pw - pad * 2, sh = sw * 812 / 375;
        const vw = stage.clientWidth, vh = stage.clientHeight;
        const persp = 1800 / (1800 - 60);
        m.dx = (vw / 2 - (fr.left - sr.left + fr.width / 2)) / persp;
        m.dy = (vh / 2 - (fr.top - sr.top + fr.height / 2)) / persp;
        m.S = (desk ? (vh * 1.04) / sh : Math.max(vw / sw, vh / sh) * 1.02) / persp;
        m.vw = vw; m.vh = vh;
      };
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      const diveState = { p: 0 };
      const notes = $$('.dn');
      const urls = $$('.ds-url');
      const bar = $('.ds-bar i');
      const layers = $$('.scr-layer', mid);
      const strips = layers.map((l) => $('.scr-strip', l));
      gsap.set(layers.slice(1), { xPercent: 101 });
      const TOUR = 2.2, SWAP = 0.9, T0 = 2.2;
      const startOf = (i) => T0 + i * (TOUR + SWAP);
      const END = startOf(2) + TOUR;
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true,
          onUpdate: (self) => { root.classList.toggle('diving', self.progress > 0.04 && self.progress < 0.985); },
        },
      });
      tl
        /* A: texto e celulares laterais saem */
        .to(diveState, { p: 1, duration: 1, ease: 'none' }, 0)
        .fromTo('.hero-content', { y: 0, opacity: 1 }, { y: -90, opacity: 0, duration: 1, immediateRender: false }, 0)
        .fromTo(moves[0], { x: 0, rotateY: 0, opacity: 1 }, { x: () => -m.vw * 0.55, rotateY: -25, opacity: 0, duration: 1, immediateRender: false }, 0)
        .fromTo(moves[2], { x: 0, rotateY: 0, opacity: 1 }, { x: () => m.vw * 0.55, rotateY: 25, opacity: 0, duration: 1, immediateRender: false }, 0)
        .fromTo('.phone-chip', { opacity: 1 }, { opacity: 0, duration: 0.4, immediateRender: false }, 0)
        .fromTo('.phones-floor', { opacity: 1 }, { opacity: 0, duration: 0.6, immediateRender: false }, 0)
        /* B: celular central vai ao centro e cresce até a tela tomar conta */
        .fromTo(midMove, { x: 0, y: 0, scale: 1, rotateX: 0 }, { x: () => m.dx, y: () => m.dy, scale: () => m.S, rotateX: 0, duration: 1.3, immediateRender: false }, 0.8)
        .to('.dive-dim', { opacity: 1, duration: 1 }, 1)
        .to(['.dn-label', '.dive-side'], { opacity: 1, duration: 0.4 }, 1.8)
        .fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: END - T0, ease: 'none', immediateRender: false }, T0);

      /* C: passeio pelos três sites, um depois do outro */
      strips.forEach((st, i) => {
        const t = startOf(i);
        tl.fromTo(st, { yPercent: 0 }, { yPercent: -66.667, duration: TOUR, ease: 'none', immediateRender: false }, t);
        const siteNotes = notes.filter((n) => n.dataset.site === String(i + 1));
        siteNotes.forEach((n, j) => {
          const at = t + j * (TOUR / siteNotes.length);
          tl.fromTo(n, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out', immediateRender: false }, at);
          tl.to(n, { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, at + TOUR / siteNotes.length - 0.22);
        });
        if (i < strips.length - 1) {
          /* troca: a câmera recua, a tela desliza para o próximo site e entra de novo */
          const s0 = t + TOUR;
          tl.to(midMove, { scale: () => m.S * (desk ? 0.62 : 0.72), duration: 0.35, ease: 'power2.inOut' }, s0)
            .fromTo(layers[i], { xPercent: 0 }, { xPercent: -101, duration: 0.4, ease: 'power3.inOut', immediateRender: false }, s0 + 0.2)
            .fromTo(layers[i + 1], { xPercent: 101 }, { xPercent: 0, duration: 0.4, ease: 'power3.inOut', immediateRender: false }, s0 + 0.2)
            .fromTo(urls[i], { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, s0 + 0.2)
            .fromTo(urls[i + 1], { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, s0 + 0.4)
            .to(midMove, { scale: () => m.S, duration: 0.35, ease: 'power2.inOut' }, s0 + 0.55);
        }
      });

      /* D: sai dos sites e volta para a MTSX */
      tl.to(['.dn-label', '.dive-side'], { opacity: 0, duration: 0.4 }, END)
        .to(midMove, { y: () => m.dy - m.vh * 1.2, scale: () => m.S * 0.7, rotateX: 18, duration: 1.1, ease: 'power3.in' }, END + 0.1)
        .fromTo('.dive-end', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', immediateRender: false }, END + 0.8)
        .to({}, { duration: 0.6 }, END + 1.6);

      /* Mouse: o conjunto inclina seguindo o ponteiro */
      if (rig && finePointer.matches) {
        const cur = { ry: baseRY, rx: baseRX }, tgt = { ry: baseRY, rx: baseRX };
        const hero = $('.hero');
        hero.addEventListener('pointermove', (e) => {
          const r = hero.getBoundingClientRect();
          tgt.ry = baseRY + ((e.clientX - r.left) / r.width - 0.5) * 16;
          tgt.rx = baseRX - ((e.clientY - r.top) / r.height - 0.5) * 10;
        });
        hero.addEventListener('pointerleave', () => { tgt.ry = baseRY; tgt.rx = baseRX; });
        const tick = () => {
          cur.ry += (tgt.ry - cur.ry) * 0.06; cur.rx += (tgt.rx - cur.rx) * 0.06;
          const f = 1 - diveState.p;
          rig.style.transform = `rotateY(${(cur.ry * f).toFixed(2)}deg) rotateX(${(cur.rx * f).toFixed(2)}deg)`;
        };
        gsap.ticker.add(tick);
        return () => { gsap.ticker.remove(tick); rig.style.transform = ''; ScrollTrigger.removeEventListener('refreshInit', measure); root.classList.remove('diving'); };
      }
      /* Sem mouse: a inclinação base some durante o mergulho */
      const tick2 = () => { const f = 1 - diveState.p; rig.style.transform = `rotateY(${(baseRY * f).toFixed(2)}deg) rotateX(${(baseRX * f).toFixed(2)}deg)`; };
      gsap.ticker.add(tick2);
      return () => { gsap.ticker.remove(tick2); rig.style.transform = ''; ScrollTrigger.removeEventListener('refreshInit', measure); root.classList.remove('diving'); };
    };
    /* Espera as fontes para medir com a tipografia final (no máximo 1,5 s) */
    let heroStarted = false;
    const go = () => { if (!heroStarted) { heroStarted = true; ctx.add(startHero); root.classList.add('hero-ready'); ScrollTrigger.refresh(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 1500);

    /* ---- Faixas de texto que deslizam com a rolagem ---- */
    gsap.to('.t1', { xPercent: -22, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
    gsap.fromTo('.t2', { xPercent: -30 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: 0.4 } });

    /* ---- Manifesto: palavras acendem ---- */
    const mani = $('[data-words]');
    if (mani) {
      const words = splitWords(mani, 'word');
      gsap.fromTo(words, { opacity: 0.13 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: mani, start: 'top 78%', end: 'bottom 50%', scrub: true } });
      gsap.from('.chip-img', { scale: 0, rotate: -12, ease: 'back.out(2)', stagger: 0.2, scrollTrigger: { trigger: mani, start: 'top 75%', end: 'center 55%', scrub: 0.5 } });
    }

    /* ---- Títulos: palavras sobem ao entrar ---- */
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el, 'w');
      gsap.from(words, { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });

    /* ---- Serviços: pilha de cartões + parallax das fotos ---- */
    const cards = $$('.svc');
    cards.forEach((card, i) => {
      const img = $('.svc-media img', card);
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
      const items = [$('.svc-kicker', card), $('.svc-title', card), $('.svc-desc', card), ...$$('.deliv li', card), $('.svc-foot', card)];
      if (belowFold(card)) gsap.from(items, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: card, start: 'top 70%', once: true } });
      if (desk && cards[i + 1]) {
        gsap.to($('.svc-inner', card), { scale: 0.9, filter: 'brightness(0.45)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 25%', scrub: true } });
      }
    });

    /* ---- Processo: o site se constrói na tela ---- */
    const pin = $('.build-pin');
    if (pin) {
      const steps = $$('.bstep');
      const stageLabel = $('.scr-stage');
      const names = ['Briefing', 'Design', 'Desenvolvimento', 'Entrega'];
      const prog = $('.scr-progress span');
      let current = -1;
      const setStep = (i) => {
        if (i === current) return;
        current = i;
        steps.forEach((s, k) => s.classList.toggle('on', k === i));
        if (stageLabel) stageLabel.textContent = names[i];
      };
      setStep(0);
      const hidden = 'inset(100% 0% 0% 0%)', shown = 'inset(0% 0% 0% 0%)';
      gsap.set(['.l-wire', '.l-design', '.l-live'], { clipPath: hidden });
      const bt = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: pin, start: 'top top', end: 'bottom bottom', scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress;
            if (prog) prog.style.transform = `scaleX(${p})`;
            setStep(p < 1.6 / 7.6 ? 0 : p < 3.6 / 7.6 ? 1 : p < 5.6 / 7.6 ? 2 : 3);
          },
        },
      });
      bt.fromTo('.l-sketch img', { scale: 1.15 }, { scale: 1, duration: 1.2, ease: 'none' }, 0)
        .to('.l-wire', { clipPath: shown, duration: 1 }, 1)
        .from('.wb', { scale: 0.6, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.6)' }, 1.4)
        .to('.l-design', { clipPath: shown, duration: 1 }, 3)
        .from('.db', { y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'expo.out' }, 3.4)
        .to('.l-live', { clipPath: shown, duration: 1 }, 5)
        .from('.l-live img', { scale: 1.25, duration: 1.4, ease: 'none' }, 5)
        .from('.live-copy > *', { y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'expo.out' }, 5.6)
        .fromTo('.fake-cursor', { x: 140, y: 110, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 6.1)
        .to('.fake-cursor', { scale: 0.78, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 6.85)
        .to({}, { duration: 0.5 }, 7.1);
      const liveBtn = $('.live-btn');
      ScrollTrigger.create({ trigger: pin, start: 'top top', end: 'bottom bottom', onUpdate: (self) => liveBtn.classList.toggle('clicked', self.progress > 0.93) });
      if (desk) gsap.from('.screen', { rotateX: 12, rotateY: -14, scale: 0.9, transformPerspective: 1400, ease: 'none', scrollTrigger: { trigger: pin, start: 'top 90%', end: 'top top', scrub: true } });
    }

    /* ---- Projetos: galeria horizontal presa na rolagem (computador) ---- */
    const workPin = $('.work-pin');
    const track = $('.work-track');
    if (workPin && track && desk) {
      root.classList.add('desk-h');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const setH = () => { workPin.style.height = `${dist() + window.innerHeight}px`; };
      setH();
      ScrollTrigger.addEventListener('refreshInit', setH);
      const prog = $('.work-progress span');
      const ht = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: workPin, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => { if (prog) prog.style.transform = `scaleX(${self.progress})`; },
        },
      });
      $$('.proj').forEach((card, i) => {
        gsap.fromTo($('.proj-play', card), { y: i % 2 ? 40 : -20, rotate: i % 2 ? 2 : -2 }, {
          y: i % 2 ? -40 : 20, rotate: 0, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: ht, start: 'left right', end: 'right left', scrub: true },
        });
      });
      ctx.add(() => () => { ScrollTrigger.removeEventListener('refreshInit', setH); workPin.style.height = ''; root.classList.remove('desk-h'); });
    }

    /* ---- Fundo muda de tom entre as cenas ---- */
    const BASE = '#04091A';
    [['#projetos', '#01040E'], ['.build', '#030B24'], ['.cta-band', '#000207']].forEach(([sel, color]) => {
      const el = $(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 55%', end: 'bottom 45%',
        onToggle: (self) => gsap.to(root, { '--bg': self.isActive ? color : BASE, duration: 0.9, ease: 'power2.out', overwrite: 'auto' }),
      });
    });

    /* ---- Rótulos decodificam ao aparecer ---- */
    $$('.eyebrow').filter(belowFold).forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => scramble(el) });
    });

    /* ---- Entradas em lote (estudos, planos, diferenciais, FAQ) ---- */
    const batchReveal = (selector, vars = {}) => {
      const els = $$(selector).filter(belowFold);
      if (!els.length) return;
      gsap.set(els, { y: vars.y ?? 60, opacity: 0 });
      ScrollTrigger.batch(els, {
        start: 'top 88%', once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true, clearProps: 'transform' }),
      });
    };
    if (!desk) batchReveal('.proj', { y: 40 });
    batchReveal('.plan');
    batchReveal('.pe-row', { y: 30 });
    batchReveal('.diff-list li', { y: 30 });
    batchReveal('.faq-list details', { y: 24 });
    batchReveal('.contact-info > *', { y: 30 });
    batchReveal('.form');

    /* Preços contam ao aparecer */
    $$('.count').forEach((el) => {
      const to = Number(el.dataset.to);
      const o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); }, onComplete: () => { el.textContent = String(to); } }) });
    });

    /* Fotos: revelação por máscara + parallax */
    const dm = $('.diffs-media');
    if (dm) {
      gsap.fromTo(dm, { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: dm, start: 'top 80%', once: true } });
      gsap.fromTo('.diffs-media img', { yPercent: -6, scale: 1.15 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: dm, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    gsap.fromTo('.cta-media img', { yPercent: -8, scale: 1.1 }, { yPercent: 8, scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* Assinatura gigante no rodapé */
    gsap.from('.wordmark span', { yPercent: 100, duration: 1.4, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.wordmark', start: 'top 95%', once: true } });

    return () => { root.classList.remove('motion-ok', 'hero-ready'); root.style.removeProperty('--bg'); };
  });

  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();
