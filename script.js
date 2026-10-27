// ============================================================
//  НАШ МАЛЕНЬКИЙ САЙТ — ЛОГИКА
// ============================================================

(function () {
  'use strict';

  // ---------- УТИЛИТЫ ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const pad = (n) => String(n).padStart(2, '0');

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const toast = (msg) => {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  const vibrate = (pattern) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  // ---------- ПЛАВАЮЩИЕ ЧАСТИЦЫ ----------
  function initParticles() {
    const container = $('#particles');
    if (!container) return;
    const symbols = ['♡', '❤', '✦', '❀'];
    const count = window.innerWidth < 640 ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.fontSize = (10 + Math.random() * 14) + 'px';
      p.style.animationDuration = (15 + Math.random() * 20) + 's';
      p.style.animationDelay = (Math.random() * 20) + 's';
      p.style.color = Math.random() > 0.5 ? 'var(--cherry)' : 'var(--burgundy-soft)';
      container.appendChild(p);
    }
  }

  // ---------- REVEAL ON SCROLL ----------
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  // ---------- HERO ----------
  function initHero() {
    const heroImg = $('#heroImage');
    const heroPhotoEmpty = $('#heroPhotoEmpty');
    if (heroImg && photos.length > 0) {
      heroImg.src = photos[0].src;
      heroImg.addEventListener('load', () => {
        heroPhotoEmpty.hidden = true;
      }, { once: true });
      heroImg.addEventListener('error', () => {
        heroImg.hidden = true;
        heroPhotoEmpty.hidden = false;
      }, { once: true });
    } else {
      heroImg.hidden = true;
    }

    $('#openWorldBtn').addEventListener('click', () => {
      $('#counter').scrollIntoView({ behavior: 'smooth' });
    });

    $('#surpriseHeroBtn').addEventListener('click', () => {
      openSurprise();
    });
  }

  // ---------- RELATIONSHIP COUNTER ----------
  function initCounter() {
    const start = CONFIG.startDate;
    const twoWeeks = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    const daysEl = $('#countDays');
    const hoursEl = $('#countHours');
    const minutesEl = $('#countMinutes');
    const secondsEl = $('#countSeconds');
    const milestone = $('#milestoneBanner');
    const nextEl = $('#nextAnniversary');

    const update = () => {
      const now = new Date();
      let diff = now - start;
      if (diff < 0) diff = 0;

      const totalSeconds = Math.floor(diff / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);

      daysEl.textContent = totalDays;
      hoursEl.textContent = totalHours % 24;
      minutesEl.textContent = totalMinutes % 60;
      secondsEl.textContent = totalSeconds % 60;

      // Юбилей 28 октября
      const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      if (sameDay(now, twoWeeks)) {
        milestone.hidden = false;
      } else {
        milestone.hidden = true;
      }

      if (now < start) {
        const daysToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        nextEl.textContent = `До начала нашей истории: ${daysToStart} ${pluralDays(daysToStart)}.`;
      } else if (now >= twoWeeks) {
        const next = new Date(start);
        next.setMonth(next.getMonth() + 1);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        const daysToNext = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
        nextEl.textContent = `До следующего маленького юбилея: ${daysToNext} ${pluralDays(daysToNext)}.`;
      } else {
        const daysToTwoWeeks = Math.ceil((twoWeeks - now) / (1000 * 60 * 60 * 24));
        nextEl.textContent = `До наших первых двух недель: ${daysToTwoWeeks} ${pluralDays(daysToTwoWeeks)}.`;
      }
    };

    update();
    setInterval(update, 1000);
  }

  function pluralDays(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
    return 'дней';
  }

  // ---------- PHOTO GALLERY ----------
  let currentLightboxIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;
  let galleryPhotos = [];

  function initGallery() {
    const grid = $('#galleryGrid');
    const empty = $('#galleryEmpty');

    galleryPhotos = photos.slice();
    if (galleryPhotos.length === 0) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }

    galleryPhotos.forEach((p) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `gallery-item size-${p.size || 'square'}`;
      item.setAttribute('aria-label', p.caption ? `Открыть фото: ${p.caption}` : 'Открыть фотографию');
      const image = document.createElement('img');
      image.src = p.src;
      image.alt = p.caption || 'Фотография из нашей галереи';
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        item.remove();
        galleryPhotos = galleryPhotos.filter((photo) => photo !== p);
        if (galleryPhotos.length === 0) {
          grid.hidden = true;
          empty.hidden = false;
        }
      }, { once: true });
      item.appendChild(image);
      if (p.caption) {
        const caption = document.createElement('span');
        caption.className = 'gallery-caption';
        caption.textContent = p.caption;
        item.appendChild(caption);
      }
      item.addEventListener('click', () => openLightbox(galleryPhotos.indexOf(p)));
      grid.appendChild(item);
    });

    // Lightbox controls
    $('#lightboxClose').addEventListener('click', closeLightbox);
    $('#lightboxPrev').addEventListener('click', () => navLightbox(-1));
    $('#lightboxNext').addEventListener('click', () => navLightbox(1));

    $('#lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });

    // Swipe
    const lb = $('#lightbox');
    lb.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) navLightbox(1);
        else navLightbox(-1);
      }
    }, { passive: true });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight') navLightbox(1);
    });
  }

  function openLightbox(i) {
    currentLightboxIndex = i;
    renderLightbox();
    $('#lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    $('#lightbox').hidden = true;
    document.body.style.overflow = '';
  }

  function navLightbox(dir) {
    if (galleryPhotos.length === 0) {
      closeLightbox();
      return;
    }
    currentLightboxIndex = (currentLightboxIndex + dir + galleryPhotos.length) % galleryPhotos.length;
    renderLightbox();
  }

  function renderLightbox() {
    const p = galleryPhotos[currentLightboxIndex];
    $('#lightboxImg').src = p.src;
    $('#lightboxCaption').textContent = p.caption || '';
  }

  // ---------- COMPLIMENTS ----------
  let complimentQueue = [];
  let complimentSeen = 0;

  function initCompliments() {
    complimentQueue = shuffle(compliments);
    const env = $('#envelope');
    const card = $('#complimentCard');
    const text = $('#complimentText');
    const nextBtn = $('#nextComplimentBtn');
    const progress = $('#complimentsProgress');

    // Прогресс-точки
    compliments.forEach(() => {
      const dot = document.createElement('span');
      progress.appendChild(dot);
    });

    env.addEventListener('click', () => {
      env.classList.add('opened');
      setTimeout(() => {
        env.hidden = true;
        card.hidden = false;
        showNextCompliment();
      }, 600);
    });

    nextBtn.addEventListener('click', () => {
      if (complimentSeen >= compliments.length) {
        // Перемешиваем заново
        complimentQueue = shuffle(compliments);
        complimentSeen = 0;
        $$('#complimentsProgress span').forEach((d) => d.classList.remove('seen'));
      }
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = '';
      showNextCompliment();
      vibrate(15);
    });

    function showNextCompliment() {
      text.textContent = complimentQueue[complimentSeen];
      progress.children[complimentSeen].classList.add('seen');
      complimentSeen++;
      if (complimentSeen >= compliments.length) {
        nextBtn.textContent = 'Начать сначала ♡';
      } else {
        nextBtn.textContent = 'Ещё один комплимент';
      }
    }
  }

  // ---------- PICKUP LINES ----------
  let pickupQueue = [];
  let pickupSeen = 0;
  let currentPickup = '';
  const FAV_KEY = 'ourStory:favPickups';

  function initPickup() {
    pickupQueue = shuffle(pickupLines);
    pickupSeen = 0;

    // Подкат дня (по дате)
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % pickupLines.length;
    $('#pickupDayText').textContent = pickupLines[dayIndex];

    const current = $('#pickupCurrent');
    const newBtn = $('#newPickupBtn');
    const favBtn = $('#favPickupBtn');
    const copyBtn = $('#copyPickupBtn');
    const favsContainer = $('#pickupFavorites');
    const favsList = $('#pickupFavList');

    newBtn.addEventListener('click', () => {
      if (pickupSeen >= pickupLines.length) {
        pickupQueue = shuffle(pickupLines);
        pickupSeen = 0;
      }
      currentPickup = pickupQueue[pickupSeen];
      current.style.opacity = 0;
      setTimeout(() => {
        current.textContent = currentPickup;
        current.style.opacity = 1;
      }, 200);
      pickupSeen++;
      vibrate(15);
    });

    favBtn.addEventListener('click', () => {
      if (!currentPickup) {
        toast('Сначала нажми «Новый подкат»');
        return;
      }
      const favs = loadFavs();
      if (favs.includes(currentPickup)) {
        toast('Уже в избранном ♡');
        return;
      }
      favs.push(currentPickup);
      saveFavs(favs);
      renderFavs();
      toast('Добавлено в избранное ♡');
      vibrate([10, 30, 10]);
    });

    copyBtn.addEventListener('click', async () => {
      if (!currentPickup) {
        toast('Сначала нажми «Новый подкат»');
        return;
      }
      try {
        await navigator.clipboard.writeText(currentPickup);
        toast('Скопировано');
      } catch {
        toast('Не удалось скопировать');
      }
    });

    function loadFavs() {
      try {
        return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
      } catch {
        return [];
      }
    }
    function saveFavs(arr) {
      localStorage.setItem(FAV_KEY, JSON.stringify(arr));
    }
    function renderFavs() {
      const favs = loadFavs();
      if (favs.length === 0) {
        favsContainer.hidden = true;
        return;
      }
      favsContainer.hidden = false;
      favsList.innerHTML = '';
      favs.forEach((f, i) => {
        const li = document.createElement('li');
        li.textContent = f;
        const rm = document.createElement('button');
        rm.innerHTML = '✕';
        rm.setAttribute('aria-label', 'Удалить');
        rm.addEventListener('click', () => {
          const arr = loadFavs();
          arr.splice(i, 1);
          saveFavs(arr);
          renderFavs();
        });
        li.appendChild(rm);
        favsList.appendChild(li);
      });
    }

    renderFavs();
  }

  // ---------- LOVE LETTER ----------
  function initLetter() {
    const env = $('#letterEnvelope');
    const paper = $('#letterPaper');
    const content = $('#letterContent');
    const sig = $('#letterSignature');

    // Рендерим письмо
    content.innerHTML = loveLetter.paragraphs
      .map((p) => `<p>${p}</p>`)
      .join('');
    sig.textContent = loveLetter.signature;

    env.addEventListener('click', () => {
      env.classList.add('opened');
      setTimeout(() => {
        env.hidden = true;
        paper.hidden = false;
      }, 800);
    });
  }

  // ---------- OPEN WHEN ----------
  function initOpenWhen() {
    const grid = $('#openwhenGrid');
    const modal = $('#openwhenModal');

    openWhenLetters.forEach((l) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'openwhen-card';
      const title = document.createElement('span');
      title.textContent = l.title;
      card.appendChild(title);
      card.addEventListener('click', () => {
        $('#openwhenTitle').textContent = l.title;
        $('#openwhenBody').textContent = l.body;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
      });
      grid.appendChild(card);
    });

    $('#openwhenClose').addEventListener('click', closeOpenWhen);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeOpenWhen();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeOpenWhen();
    });

    function closeOpenWhen() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // ---------- TIMELINE ----------
  function initTimeline() {
    const list = $('#timelineList');
    timeline.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'timeline-item' + (item.isFuture ? ' future' : '');
      el.innerHTML = `
        <div class="timeline-date">${item.date}</div>
        <h3 class="timeline-title">${item.title}</h3>
        <p class="timeline-desc">${item.description}</p>
        ${item.photo ? `<div class="timeline-photo"><img src="${item.photo}" alt="" loading="lazy" /></div>` : ''}
      `;
      list.appendChild(el);
    });
  }

  // ---------- WHY YOU ----------
  let whyQueue = [];
  let whySeen = 0;

  function initWhyYou() {
    whyQueue = shuffle(whyYouReasons);
    const btn = $('#whyyouBtn');
    const answer = $('#whyyouAnswer');
    const text = $('#whyyouText');

    btn.addEventListener('click', () => {
      if (whySeen >= whyYouReasons.length) {
        whyQueue = shuffle(whyYouReasons);
        whySeen = 0;
      }
      text.textContent = whyQueue[whySeen];
      answer.hidden = false;
      answer.style.animation = 'none';
      void answer.offsetWidth;
      answer.style.animation = '';
      whySeen++;
      vibrate(15);
    });
  }

  // ---------- SECRET SURPRISE ----------
  function initSurprise() {
    $('#openSurpriseBtn').addEventListener('click', openSurprise);
    $('#surpriseBackBtn').addEventListener('click', () => {
      closeSurprise();
      setTimeout(() => {
        $('#gallery').scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !$('#surpriseOverlay').hidden) closeSurprise();
    });
  }

  function openSurprise() {
    const overlay = $('#surpriseOverlay');
    const hearts = $('#surpriseHearts');
    hearts.innerHTML = '';
    const symbols = ['♡', '❤', '✦'];
    for (let i = 0; i < 40; i++) {
      const h = document.createElement('span');
      h.className = 'surprise-heart';
      h.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      h.style.left = Math.random() * 100 + '%';
      h.style.fontSize = (16 + Math.random() * 28) + 'px';
      h.style.animationDuration = (4 + Math.random() * 6) + 's';
      h.style.animationDelay = Math.random() * 3 + 's';
      hearts.appendChild(h);
    }
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    vibrate([20, 50, 20, 50, 20]);
  }

  function closeSurprise() {
    $('#surpriseOverlay').hidden = true;
    document.body.style.overflow = '';
  }

  // ---------- RANDOM LOVE BUTTON ----------
  let loveQueue = [];
  let loveSeen = 0;

  function initFloatingLove() {
    loveQueue = shuffle(loveMessages);
    const btn = $('#floatingLoveBtn');
    btn.addEventListener('click', () => {
      if (loveSeen >= loveMessages.length) {
        loveQueue = shuffle(loveMessages);
        loveSeen = 0;
      }
      toast(loveQueue[loveSeen]);
      loveSeen++;
      vibrate(20);
    });
  }

  // ---------- MUSIC PLAYER ----------
  function initMusic() {
    const player = $('#musicPlayer');
    const audio = $('#audioEl');
    const toggle = $('#musicToggle');
    const icon = $('#musicIcon');
    const status = $('#musicStatus');
    const volume = $('#musicVolume');

    audio.src = 'public/audio/our-song.mp3';
    audio.volume = parseFloat(volume.value);

    audio.addEventListener('canplay', () => {
      player.hidden = false;
      audio.play().catch(() => {
        status.textContent = 'Нажми ▶, чтобы включить';
      });
    }, { once: true });
    audio.addEventListener('error', () => {
      player.hidden = true;
    });

    let playing = false;
    toggle.addEventListener('click', () => {
      if (playing) {
        audio.pause();
        icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
        toggle.setAttribute('aria-label', 'Играть музыку');
        playing = false;
      } else {
        audio.play().catch(() => toast('Не удалось запустить музыку'));
      }
    });
    audio.addEventListener('playing', () => {
      status.textContent = 'Сейчас играет';
      player.classList.add('is-playing');
      icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      toggle.setAttribute('aria-label', 'Поставить музыку на паузу');
      playing = true;
    });
    audio.addEventListener('pause', () => {
      status.textContent = 'Пауза';
      player.classList.remove('is-playing');
      playing = false;
      icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      toggle.setAttribute('aria-label', 'Играть музыку');
    });

    volume.addEventListener('input', () => {
      audio.volume = parseFloat(volume.value);
    });
  }

  // ---------- INIT ----------
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initReveal();
    initHero();
    initCounter();
    initGallery();
    initCompliments();
    initPickup();
    initLetter();
    initOpenWhen();
    initTimeline();
    initWhyYou();
    initSurprise();
    initFloatingLove();
    initMusic();
  });
})();