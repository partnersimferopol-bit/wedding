(function () {
  const BG_IMAGE_SRC = 'assets/bg-wood-leaves.png';
  const bgImage = new Image();
  bgImage.src = BG_IMAGE_SRC;

  const TOTAL_STEPS = 6;
  const state = {
    step: 0,
    recipient: null,
    recipientOther: '',
    traits: [],
    occasion: null,
    occasionOther: '',
    words: '',
    details: { name: '', date: '', phrase: '' },
    style: null,
    giftId: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const progressWrap = $('#progress-wrap');
  const progressFill = $('#progress-fill');
  const progressLabel = $('#progress-label');

  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      const step = el.dataset?.step;
      if (step) {
        const host = el.querySelector('.step-icon');
        if (host) host.innerHTML = renderStepIcon(Number(step));
      }
    }
    document.body.classList.toggle('game-intro', id === 'screen-intro');
    document.body.classList.toggle('game-flow', id !== 'screen-intro');
    updateProgress();
  }

  function updateProgress() {
    if (state.step === 0) {
      progressWrap.classList.remove('visible');
      return;
    }
    if (state.step > TOTAL_STEPS) {
      progressWrap.classList.remove('visible');
      return;
    }
    progressWrap.classList.add('visible');
    const pct = (state.step / TOTAL_STEPS) * 100;
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `Шаг ${state.step} из ${TOTAL_STEPS}`;
    const stepIcon = $('#progress-step-icon');
    if (stepIcon) stepIcon.innerHTML = renderStepIcon(state.step);
    progressWrap.dataset.step = String(state.step);
  }

  function decorateNavButtons() {
    $$('[id^="btn-back-"]').forEach((btn) => {
      btn.classList.add('btn-with-icon');
      btn.innerHTML = `${renderIcon('btn-back', 'btn')}<span>Назад</span>`;
      btn.setAttribute('aria-label', 'Вернуться на предыдущий шаг');
    });
    $$('[id^="btn-next-"]').forEach((btn) => {
      btn.classList.add('btn-nav-next');
      btn.classList.remove('btn-primary');
      const label = (btn.dataset.navLabel || btn.textContent).trim();
      btn.dataset.navLabel = label;
      btn.innerHTML = `<span class="btn-nav-next-label">${escapeHtml(label)}</span>`;
      btn.setAttribute('aria-label', label);
      if (label.length > 12) btn.classList.add('btn-nav-next--long');
    });
    const shareIcon = $('#btn-share-icon');
    if (shareIcon) shareIcon.innerHTML = renderIcon('icon-share', 'btn');
    const restartIcon = $('#btn-restart-icon');
    if (restartIcon) restartIcon.innerHTML = renderIcon('icon-restart', 'btn');
  }

  function matchGift() {
    const ctx = {
      recipient: state.recipient,
      traits: state.traits,
      occasion: state.occasion,
    };

    for (const rule of MATCH_RULES) {
      if (rule.recipient) {
        const rec = Array.isArray(rule.recipient) ? rule.recipient : [rule.recipient];
        if (!rec.includes(ctx.recipient)) continue;
      }
      if (rule.occasion) {
        if (!rule.occasion.includes(ctx.occasion)) continue;
      }
      if (rule.traits) {
        const has = rule.traits.some((t) => ctx.traits.includes(t));
        if (!has) continue;
      }
      return rule.giftId;
    }
    return 19;
  }

  function personalizeGift(gift) {
    const g = { ...gift };
    let title = g.title;
    const name = state.details.name?.trim();
    if (gift.id === 18 && name) {
      title = `Звезда по имени ${name}`;
    }
    g.title = title;
    if (state.words.trim()) {
      g.text = `${g.text}\n\n«${state.words.trim()}» — ваши слова навсегда в дереве.`;
    }
    return g;
  }

  function renderCards(container, items, multi, selectedIds) {
    container.innerHTML = '';
    const grid = container.classList.contains('cards') ? container : container.parentElement;
    if (grid?.classList) {
      if (items.length > 6) grid.classList.add('single-col');
      else grid.classList.remove('single-col');
    }

    items.forEach((item) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card wood-panel';
      if (item.hasInput) card.classList.add('full-width');
      const sel = multi
        ? selectedIds.includes(item.id)
        : selectedIds === item.id;
      if (sel) card.classList.add('selected');
      card.dataset.id = item.id;
      card.innerHTML = `<span class="card-icon">${renderIcon(item.icon)}</span><span class="label">${item.label}</span>`;
      card.addEventListener('click', () => {
        if (multi) {
          const idx = state.traits.indexOf(item.id);
          if (idx >= 0) {
            state.traits.splice(idx, 1);
          } else if (state.traits.length < 3) {
            state.traits.push(item.id);
          }
          renderCards(container, items, true, state.traits);
          $('#btn-next-2').disabled = state.traits.length === 0;
        } else {
          state[container.dataset.field] = item.id;
          container.querySelectorAll('.card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          const nextBtn = container.closest('.screen')?.querySelector('[data-next]');
          if (nextBtn) nextBtn.disabled = false;
          const inputWrap = container.closest('.screen')?.querySelector('.input-other');
          if (inputWrap) {
            inputWrap.style.display = item.hasInput ? 'block' : 'none';
          }
        }
      });
      container.appendChild(card);
    });
  }

  function initStep1() {
    const c = $('#cards-recipient');
    c.dataset.field = 'recipient';
    renderCards(c, RECIPIENTS, false, state.recipient);
    $('#recipient-other-wrap').style.display =
      state.recipient === 'other' ? 'block' : 'none';
    $('#btn-next-1').disabled = !state.recipient;
  }

  function initStep2() {
    renderCards($('#cards-traits'), TRAITS, true, state.traits);
    $('#btn-next-2').disabled = state.traits.length === 0;
  }

  function initStep3() {
    const c = $('#cards-occasion');
    c.dataset.field = 'occasion';
    renderCards(c, OCCASIONS, false, state.occasion);
    $('#occasion-other-wrap').style.display =
      state.occasion === 'other' ? 'block' : 'none';
    $('#btn-next-3').disabled = !state.occasion;
  }

  function initStep6() {
    const c = $('#cards-style');
    c.dataset.field = 'style';
    renderCards(c, STYLES, false, state.style);
    $('#btn-next-6').disabled = !state.style;
  }

  function setResultImage(giftId, title) {
    const paths = getResultImagePaths(giftId);
    const webp = $('#gift-img-webp');
    const img = $('#gift-img');
    webp.srcset = paths.webp;
    img.src = paths.jpg;
    img.alt = paths.alt || `Подарок «${title}»`;
    img.classList.remove('is-loaded', 'has-error');
    img.onload = () => img.classList.add('is-loaded');
    img.onerror = () => {
      img.classList.add('has-error');
      img.alt = title;
    };
  }

  function preloadResultImage(giftId) {
    const paths = getResultImagePaths(giftId);
    [paths.webp, paths.jpg].forEach((src) => {
      const el = new Image();
      el.src = src;
    });
  }

  function showResult() {
    if (!state.giftId) state.giftId = matchGift();
    let gift = GIFTS[state.giftId] || GIFTS[19];
    gift = personalizeGift(gift);

    setResultImage(gift.id, gift.title);
    $('#gift-title').textContent = gift.title;
    $('#gift-text').textContent = gift.text;

    const ul = $('#products-list');
    ul.innerHTML = '';
    gift.products.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'wood-panel';
      li.innerHTML = `<span class="product-label">${p}</span>`;
      ul.appendChild(li);
    });

    showScreen('screen-result');
    $('#lead-success').classList.remove('show');
    $('#lead-form').style.display = 'block';
  }

  function runLoading() {
    state.giftId = matchGift();
    preloadResultImage(state.giftId);
    showScreen('screen-loading');
    setTimeout(showResult, 2800);
  }

  function loadBgImage() {
    return new Promise((resolve) => {
      if (bgImage.complete && bgImage.naturalWidth) {
        resolve(bgImage);
        return;
      }
      bgImage.onload = () => resolve(bgImage);
      bgImage.onerror = () => resolve(null);
    });
  }

  function drawWoodBackground(ctx, w, h, img) {
    if (img) {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#faf6f1');
      grad.addColorStop(1, '#f5ebe0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(250, 246, 241, 0.55)';
    ctx.fillRect(0, 0, w, h);
  }

  async function generateShareImage() {
    const gift = GIFTS[state.giftId] || GIFTS[19];
    const canvas = $('#share-canvas');
    const ctx = canvas.getContext('2d');
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    const img = await loadBgImage();
    drawWoodBackground(ctx, w, h, img);

    const panelX = 80;
    const panelY = 280;
    const panelW = w - 160;
    const panelH = 1100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    roundRect(ctx, panelX, panelY, panelW, panelH, 32);
    ctx.fill();

    ctx.fillStyle = '#5c4636';
    ctx.font = 'bold 48px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3Д-лес', w / 2, panelY + 100);

    ctx.fillStyle = '#3d2e24';
    ctx.font = 'bold 52px Segoe UI, sans-serif';
    wrapText(ctx, gift.title, w / 2, panelY + 300, panelW - 80, 60);

    ctx.fillStyle = '#5c4636';
    ctx.font = '34px Segoe UI, sans-serif';
    wrapText(ctx, 'Подарок из Будущего', w / 2, panelY + 720, panelW - 60, 42);

    ctx.fillStyle = '#c9a962';
    ctx.font = '30px Segoe UI, sans-serif';
    ctx.fillText('Создай свой подарок → 3d-les.ru', w / 2, h - 100);

    return canvas.toDataURL('image/png');
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function getShareMeta() {
    const gift = GIFTS[state.giftId] || GIFTS[19];
    return {
      title: `«${gift.title}» — Подарок из Будущего`,
      text:
        gift.text.length > 180
          ? `${gift.text.slice(0, 180)}… Создай свой подарок в 3Д-лес!`
          : `${gift.text} Создай свой подарок в 3Д-лес!`,
      url: window.location.href.split('#')[0],
    };
  }

  function downloadShareImage(dataUrl) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'podarok-iz-budushchego.png';
    a.click();
  }

  async function shareStory() {
    const dataUrl = await generateShareImage();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'podarok-iz-budushchego.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: 'Подарок из Будущего',
        text: (GIFTS[state.giftId] || GIFTS[19]).title,
        files: [file],
      });
    } else {
      downloadShareImage(dataUrl);
    }
  }

  async function shareVK() {
    const meta = getShareMeta();
    const dataUrl = await generateShareImage();
    downloadShareImage(dataUrl);

    const params = new URLSearchParams({
      url: meta.url,
      title: meta.title,
      comment: meta.text,
    });
    const vkUrl = `https://vk.com/share.php?${params.toString()}`;
    const w = 650;
    const h = 570;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);
    window.open(vkUrl, 'vk_share', `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n > 0) {
        ctx.fillText(line, x, yy);
        line = words[n] + ' ';
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
  }

  $('#btn-start').addEventListener('click', () => {
    state.step = 1;
    initStep1();
    showScreen('screen-q1');
  });

  $('#btn-back-1').addEventListener('click', () => {
    state.step = 0;
    showScreen('screen-intro');
  });

  $('#btn-next-1').addEventListener('click', () => {
    state.recipientOther = $('#recipient-other').value.trim();
    state.step = 2;
    initStep2();
    showScreen('screen-q2');
  });

  $('#btn-back-2').addEventListener('click', () => {
    state.step = 1;
    showScreen('screen-q1');
  });

  $('#btn-next-2').addEventListener('click', () => {
    state.step = 3;
    initStep3();
    showScreen('screen-q3');
  });

  $('#btn-back-3').addEventListener('click', () => {
    state.step = 2;
    showScreen('screen-q2');
  });

  $('#btn-next-3').addEventListener('click', () => {
    state.occasionOther = $('#occasion-other').value.trim();
    state.step = 4;
    showScreen('screen-q4');
  });

  $('#btn-back-4').addEventListener('click', () => {
    state.step = 3;
    showScreen('screen-q3');
  });

  $('#btn-next-4').addEventListener('click', () => {
    state.words = $('#words-input').value;
    state.step = 5;
    showScreen('screen-q5');
  });

  $('#btn-back-5').addEventListener('click', () => {
    state.step = 4;
    showScreen('screen-q4');
  });

  $('#btn-next-5').addEventListener('click', () => {
    state.details = {
      name: $('#detail-name').value.trim(),
      date: $('#detail-date').value.trim(),
      phrase: $('#detail-phrase').value.trim(),
    };
    state.step = 6;
    initStep6();
    showScreen('screen-q6');
  });

  $('#btn-back-6').addEventListener('click', () => {
    state.step = 5;
    showScreen('screen-q5');
  });

  $('#btn-next-6').addEventListener('click', () => {
    state.step = 7;
    runLoading();
  });

  $('#lead-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const lead = {
      name: $('#lead-name').value.trim(),
      contact: $('#lead-contact').value.trim(),
      comment: $('#lead-comment').value.trim(),
      gift: state.giftId,
      giftTitle: (GIFTS[state.giftId] || GIFTS[19]).title,
      answers: { ...state },
      at: new Date().toISOString(),
    };
    const key = 'gift_future_leads';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(lead);
    localStorage.setItem(key, JSON.stringify(list));

    $('#lead-success').classList.add('show');
    $('#lead-form').style.display = 'none';

    const tg = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(`Заявка: ${lead.name}, подарок «${lead.giftTitle}»`)}`;
    console.info('Lead saved:', lead);
    console.info('Для интеграции подключите webhook или Telegram Bot API. Данные в localStorage:', key);
  });

  $('#btn-share').addEventListener('click', async () => {
    try {
      await shareStory();
    } catch (err) {
      console.error(err);
      alert('Картинка сохранится в загрузки — добавьте её в сторис вручную.');
    }
  });

  $('#btn-vk').addEventListener('click', async () => {
    try {
      await shareVK();
    } catch (err) {
      console.error(err);
      alert('Не удалось открыть ВКонтакте. Попробуйте ещё раз.');
    }
  });

  $('#btn-restart').addEventListener('click', () => {
    Object.assign(state, {
      step: 0,
      recipient: null,
      recipientOther: '',
      traits: [],
      occasion: null,
      occasionOther: '',
      words: '',
      details: { name: '', date: '', phrase: '' },
      style: null,
      giftId: null,
    });
    showScreen('screen-intro');
  });

  function applyUiText() {
    if (typeof UI_TEXT === 'undefined') return;
    const start = $('#btn-start');
    if (start && UI_TEXT.introButton) start.textContent = UI_TEXT.introButton;
    const loading = document.querySelector('#screen-loading p');
    if (loading && UI_TEXT.loading) loading.textContent = UI_TEXT.loading;
    const productsH3 = document.querySelector('.products-block h3');
    if (productsH3 && UI_TEXT.productsTitle) productsH3.textContent = UI_TEXT.productsTitle;
    const leadH3 = document.querySelector('.lead-form h3');
    if (leadH3 && UI_TEXT.leadTitle) leadH3.textContent = UI_TEXT.leadTitle;
    const leadOk = $('#lead-success');
    if (leadOk && UI_TEXT.leadSuccess) leadOk.textContent = UI_TEXT.leadSuccess;
    const hints = document.querySelector('.hints');
    if (hints && typeof WORD_HINTS !== 'undefined') {
      hints.innerHTML = WORD_HINTS.map(
        (h) => `<button type="button" class="hint-chip">${escapeHtml(h)}</button>`
      ).join('');
      $$('.hint-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const ta = $('#words-input');
          const t = chip.textContent;
          ta.value = ta.value ? `${ta.value}\n${t}` : t;
        });
      });
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  decorateNavButtons();
  applyUiText();
  showScreen('screen-intro');
  document.body.classList.add('game-intro');
})();
