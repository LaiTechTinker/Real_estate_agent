/* ==========================================================================
   Asai — Premium Real Estate Landing Page · script.js
   1 Data · 2 Helpers · 3 Properties (render/filter/favourites)
   4 Dialogs · 5 Hero carousel · 6 Navigation · 7 Contact form · 8 Init
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 1. DATA (demonstration listings — replace with real data) ---------- */
  const unsplash = (id, width = 900) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`;

  /*
   * Fields: id, name, location, type (House | Apartment | Duplex | Land),
   * status (For Sale | For Rent), bedrooms/bathrooms (null for land), area (m²),
   * price (number, ₦), priceLabel (suffix such as "/year"), image, imageAlt,
   * featured (shown before "View All"), description.
   */
  const PROPERTIES = [
    {
      id: 'p1', name: 'Luxury 4 Bedroom Duplex', location: 'Lekki, Lagos', type: 'Duplex',
      status: 'For Sale', bedrooms: 4, bathrooms: 5, area: 350, price: 450000000, priceLabel: '',
      image: unsplash('photo-1600585154340-be6161a56a0c'),
      imageAlt: 'Contemporary duplex with a swimming pool at dusk', featured: true,
      description: 'A contemporary duplex with open-plan living, large glass frontage and a private pool. Demonstration listing.',
    },
    {
      id: 'p2', name: '2 Bedroom Apartment', location: 'Victoria Island, Lagos', type: 'Apartment',
      status: 'For Sale', bedrooms: 2, bathrooms: 2, area: 120, price: 180000000, priceLabel: '',
      image: unsplash('photo-1545324418-cc1a3fa10c00'),
      imageAlt: 'Modern apartment building with balconies', featured: true,
      description: 'A bright apartment in a modern residential building close to business and leisure. Demonstration listing.',
    },
    {
      id: 'p3', name: 'Modern 3 Bedroom House', location: 'Abuja', type: 'House',
      status: 'For Rent', bedrooms: 3, bathrooms: 3, area: 250, price: 5000000, priceLabel: '/year',
      image: unsplash('photo-1564013799919-ab600027ffc6'),
      imageAlt: 'Premium modern house with a landscaped front', featured: true,
      description: 'A well-finished family house in a quiet neighbourhood, available for annual rent. Demonstration listing.',
    },
    {
      id: 'p4', name: 'Land for Sale', location: 'Ibeju-Lekki, Lagos', type: 'Land',
      status: 'For Sale', bedrooms: null, bathrooms: null, area: 500, price: 75000000, priceLabel: '',
      image: unsplash('photo-1500382017468-9049fed747ef'),
      imageAlt: 'Green residential land parcel ready for development', featured: true,
      description: 'A cleared, development-ready plot in a fast-growing corridor. Demonstration listing.',
    },
    {
      id: 'p5', name: 'Executive 5 Bedroom Detached Duplex', location: 'Maitama, Abuja', type: 'Duplex',
      status: 'For Sale', bedrooms: 5, bathrooms: 6, area: 520, price: 620000000, priceLabel: '',
      image: unsplash('photo-1600047509807-ba8f99d2cdde'),
      imageAlt: 'Large detached duplex with a manicured garden', featured: false,
      description: 'A spacious detached duplex with generous entertaining areas and a private garden. Demonstration listing.',
    },
    {
      id: 'p6', name: '3 Bedroom Serviced Apartment', location: 'Ikoyi, Lagos', type: 'Apartment',
      status: 'For Rent', bedrooms: 3, bathrooms: 3, area: 160, price: 12000000, priceLabel: '/year',
      image: unsplash('photo-1460317442991-0ec209397118'),
      imageAlt: 'Serviced apartment block with a modern facade', featured: false,
      description: 'A serviced apartment with modern finishes in a central, well-connected location. Demonstration listing.',
    },
    {
      id: 'p7', name: 'Contemporary 4 Bedroom House', location: 'Lekki Phase 1, Lagos', type: 'House',
      status: 'For Sale', bedrooms: 4, bathrooms: 4, area: 300, price: 280000000, priceLabel: '',
      image: unsplash('photo-1580587771525-78b9dba3b914'),
      imageAlt: 'Contemporary house with a pitched roof and large windows', featured: false,
      description: 'A contemporary family home with light-filled rooms and a covered terrace. Demonstration listing.',
    },
    {
      id: 'p8', name: 'Residential Land, Guzape', location: 'Guzape, Abuja', type: 'Land',
      status: 'For Sale', bedrooms: null, bathrooms: null, area: 800, price: 45000000, priceLabel: '',
      image: unsplash('photo-1470071459604-3b5ec3a7fe05'),
      imageAlt: 'Open land with rolling green hills', featured: false,
      description: 'A generous residential plot suited to a private home or a small development. Demonstration listing.',
    },
  ];

  // Price bands in naira: [min, max) — max is exclusive.
  const PRICE_RANGES = {
    any: [0, Infinity],
    'under-50': [0, 50e6],
    '50-150': [50e6, 150e6],
    '150-300': [150e6, 300e6],
    'above-300': [300e6, Infinity],
  };

  const FAV_KEY = 'asai:favorites';
  const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480">' +
    '<rect width="800" height="480" fill="#17232D"/>' +
    '<g fill="none" stroke="#D8AD55" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M290 260l110-90 110 90"/><path d="M320 240v90h160v-90"/><path d="M375 330v-55h50v55"/></g></svg>'
  );

  const HERO_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#101820"/><stop offset="1" stop-color="#2a3a48"/></linearGradient></defs>' +
    '<rect width="1600" height="900" fill="url(#g)"/></svg>'
  );

  /* ---------- 2. HELPERS ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const prefersReducedMotion = () =>
    Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const formatNaira = (value) => '₦' + Number(value).toLocaleString('en-NG');

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  // Builds <svg><use href="#i-name"/></svg> from the inline sprite in index.html.
  function icon(name, className = 'icon') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.appendChild(use);
    return svg;
  }

  function scrollToTarget(target) {
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  // Replace an image with a branded placeholder if it fails to load.
  function handleImageFailure(img) {
    if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    // Hero slides get a plain navy gradient so the large icon doesn't sit behind the text.
    img.src = img.closest('.hero__slide') ? HERO_FALLBACK : FALLBACK_IMAGE;
  }

  function announce(message) {
    const live = $('#liveStatus');
    if (live) live.textContent = message;
  }

  /* ---------- 3. PROPERTIES ---------- */
  const state = {
    mode: 'featured', // 'featured' | 'all' | 'search'
    filters: { location: '', type: 'all', price: 'any' },
    favorites: loadFavorites(),
  };

  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      return new Set(Array.isArray(stored) ? stored : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(state.favorites)));
    } catch (error) {
      /* Storage unavailable (private mode, etc.): favourites last for this visit only. */
    }
  }

  const hasActiveFilters = (f) => f.location !== '' || f.type !== 'all' || f.price !== 'any';

  function matchesFilters(property, filters) {
    const location = filters.location.toLowerCase();
    if (location && !property.location.toLowerCase().includes(location)) return false;
    if (filters.type !== 'all' && property.type !== filters.type) return false;
    const [min, max] = PRICE_RANGES[filters.price] || PRICE_RANGES.any;
    return property.price >= min && property.price < max;
  }

  function getVisibleProperties() {
    if (state.mode === 'search') return PROPERTIES.filter((p) => matchesFilters(p, state.filters));
    if (state.mode === 'all') return PROPERTIES;
    return PROPERTIES.filter((p) => p.featured);
  }

  function featureItem(iconName, display, srText) {
    const item = el('li');
    item.appendChild(icon(iconName));
    item.appendChild(el('span', null, display));
    item.appendChild(el('span', 'sr-only', srText));
    return item;
  }

  function createCard(property) {
    const card = el('article', 'property-card');
    card.dataset.id = property.id;

    const media = el('div', 'property-card__media');
    const img = el('img');
    img.src = property.image;
    img.alt = property.imageAlt;
    img.width = 900;
    img.height = 462;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);

    const badge = el('span', 'badge' + (property.status === 'For Rent' ? ' badge--rent' : ''), property.status);
    media.appendChild(badge);

    const fav = el('button', 'fav-btn');
    fav.type = 'button';
    fav.dataset.action = 'favorite';
    fav.appendChild(icon('heart'));
    setFavoriteState(fav, property, state.favorites.has(property.id));
    media.appendChild(fav);

    const body = el('div', 'property-card__body');
    body.appendChild(el('h3', 'property-card__title', property.name));

    const location = el('p', 'property-card__location');
    location.appendChild(icon('pin'));
    location.appendChild(el('span', null, property.location));
    body.appendChild(location);

    const features = el('ul', 'property-card__features');
    const beds = property.bedrooms === null ? '–' : String(property.bedrooms);
    const baths = property.bathrooms === null ? '–' : String(property.bathrooms);
    features.appendChild(featureItem('bed', beds, property.bedrooms === null ? 'Bedrooms: not applicable' : 'bedrooms'));
    features.appendChild(featureItem('bath', baths, property.bathrooms === null ? 'Bathrooms: not applicable' : 'bathrooms'));
    features.appendChild(featureItem('area', `${property.area} m²`, 'floor area'));
    body.appendChild(features);

    const footer = el('div', 'property-card__footer');
    const price = el('p', 'property-card__price', formatNaira(property.price));
    if (property.priceLabel) price.appendChild(el('small', null, property.priceLabel));
    footer.appendChild(price);

    const arrow = el('button', 'arrow-btn');
    arrow.type = 'button';
    arrow.dataset.action = 'details';
    arrow.setAttribute('aria-label', `View details: ${property.name}`);
    arrow.setAttribute('aria-haspopup', 'dialog');
    arrow.appendChild(icon('arrow-right'));
    footer.appendChild(arrow);
    body.appendChild(footer);

    card.append(media, body);
    return card;
  }

  function setFavoriteState(button, property, isFavorite) {
    button.setAttribute('aria-pressed', String(isFavorite));
    button.setAttribute(
      'aria-label',
      isFavorite ? `Remove ${property.name} from favourites` : `Add ${property.name} to favourites`
    );
  }

  function toggleFavorite(button) {
    const card = button.closest('.property-card');
    const property = PROPERTIES.find((p) => p.id === (card && card.dataset.id));
    if (!property) return;
    const isFavorite = !state.favorites.has(property.id);
    if (isFavorite) state.favorites.add(property.id);
    else state.favorites.delete(property.id);
    saveFavorites();
    setFavoriteState(button, property, isFavorite);
    announce(isFavorite ? `${property.name} saved to favourites.` : `${property.name} removed from favourites.`);
  }

  function renderProperties() {
    const grid = $('#propertyGrid');
    if (!grid) return;
    const list = getVisibleProperties();

    grid.replaceChildren(...list.map(createCard));
    grid.hidden = list.length === 0;

    const empty = $('#emptyState');
    if (empty) empty.hidden = list.length > 0;

    const bar = $('#resultsBar');
    const barText = $('#resultsText');
    const isSearch = state.mode === 'search';
    if (bar && barText) {
      bar.hidden = !isSearch;
      barText.textContent = list.length === 1 ? '1 property matches your search' : `${list.length} properties match your search`;
    }

    const viewAllLabel = $('#viewAllLabel');
    if (viewAllLabel) viewAllLabel.textContent = state.mode === 'all' ? 'Show Featured Only' : 'View All Properties';

    if (isSearch) {
      announce(list.length === 0 ? 'No properties match your search.' : `${list.length} properties found.`);
    }
  }

  function readFilters() {
    const location = $('#locationInput');
    const type = $('#typeSelect');
    const price = $('#priceSelect');
    return {
      location: location ? location.value.trim().slice(0, 60) : '',
      type: type ? type.value : 'all',
      price: price ? price.value : 'any',
    };
  }

  function writeFilters(filters) {
    const location = $('#locationInput');
    const type = $('#typeSelect');
    const price = $('#priceSelect');
    if (location) location.value = filters.location;
    if (type) type.value = filters.type;
    if (price) price.value = filters.price;
  }

  function applySearch(filters) {
    state.filters = filters;
    state.mode = hasActiveFilters(filters) ? 'search' : 'all';
    renderProperties();
    scrollToTarget($('#properties'));
  }

  function resetFilters(mode = 'featured') {
    state.filters = { location: '', type: 'all', price: 'any' };
    state.mode = mode;
    writeFilters(state.filters);
    renderProperties();
  }

  function initProperties() {
    const grid = $('#propertyGrid');
    if (!grid) return;
    renderProperties();

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      if (button.dataset.action === 'favorite') toggleFavorite(button);
      if (button.dataset.action === 'details') {
        const card = button.closest('.property-card');
        const property = PROPERTIES.find((p) => p.id === (card && card.dataset.id));
        if (property) openPropertyDialog(property, button);
      }
    });

    const form = $('#searchForm');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        applySearch(readFilters());
      });
    }

    const viewAll = $('#viewAllBtn');
    if (viewAll) {
      viewAll.addEventListener('click', () => {
        if (state.mode === 'all') {
          resetFilters('featured');
        } else {
          resetFilters('all');
        }
        scrollToTarget($('#properties'));
      });
    }

    // "Clear filters" / "Reset filters" buttons.
    document.addEventListener('click', (event) => {
      const resetBtn = event.target.closest('[data-action="reset"]');
      if (resetBtn) resetFilters('featured');
    });

    // Footer property-type links apply a filter.
    $$('[data-filter-type]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const filters = { location: '', type: link.dataset.filterType, price: 'any' };
        writeFilters(filters);
        applySearch(filters);
      });
    });
  }

  /* ---------- 4. DIALOGS ---------- */
  const returnFocus = new Map(); // dialog -> element to refocus on close

  function lockScroll(locked) {
    document.documentElement.classList.toggle('is-locked', locked);
  }

  function openDialog(dialog, opener) {
    if (!dialog) return;
    returnFocus.set(dialog, opener || document.activeElement);
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    lockScroll(true);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function initDialogs() {
    $$('dialog.modal').forEach((dialog) => {
      // Fires for the close button, Escape key and programmatic close().
      dialog.addEventListener('close', () => {
        if (!$$('dialog.modal[open]').length) lockScroll(false);
        const target = returnFocus.get(dialog);
        returnFocus.delete(dialog);
        if (target && typeof target.focus === 'function' && document.contains(target)) target.focus();
        if (dialog.id === 'contactDialog') resetContactForm();
      });
      // Click on the backdrop (the dialog element itself) closes it.
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open]');
      if (opener) {
        event.preventDefault();
        closeMobileMenu();
        const dialog = document.getElementById(opener.dataset.open);
        // Opening from inside another dialog: hand over cleanly.
        const parent = opener.closest('dialog');
        if (parent) {
          returnFocus.delete(parent);
          closeDialog(parent);
        }
        openDialog(dialog, parent ? null : opener);
        return;
      }
      const closer = event.target.closest('[data-close]');
      if (closer) closeDialog(closer.closest('dialog'));
    });
  }

  let activeProperty = null;

  function openPropertyDialog(property, opener) {
    const dialog = $('#propertyDialog');
    if (!dialog) return;
    activeProperty = property;

    const image = $('#pdImage');
    image.removeAttribute('data-fallback-applied');
    image.src = property.image;
    image.alt = property.imageAlt;

    const status = $('#pdStatus');
    status.textContent = property.status;
    status.className = 'badge' + (property.status === 'For Rent' ? ' badge--rent' : '');

    $('#pdType').textContent = property.type;
    $('#pdTitle').textContent = property.name;
    $('#pdLocation').textContent = property.location;
    $('#pdPrice').textContent = formatNaira(property.price) + property.priceLabel;
    $('#pdDesc').textContent = property.description;

    const list = $('#pdFeatures');
    list.replaceChildren();
    const items = [];
    if (property.bedrooms !== null) items.push(['bed', `${property.bedrooms} bedrooms`]);
    if (property.bathrooms !== null) items.push(['bath', `${property.bathrooms} bathrooms`]);
    items.push(['area', `${property.area} m²`]);
    items.push(['home', property.type]);
    items.forEach(([name, label]) => {
      const li = el('li');
      li.appendChild(icon(name));
      li.appendChild(el('span', null, label));
      list.appendChild(li);
    });

    openDialog(dialog, opener);
  }

  function initPropertyEnquiry() {
    const button = $('#pdEnquire');
    if (!button) return;
    button.addEventListener('click', () => {
      const property = activeProperty;
      const propertyDialog = $('#propertyDialog');
      returnFocus.delete(propertyDialog);
      closeDialog(propertyDialog);
      openDialog($('#contactDialog'), null);
      if (property) {
        const message = $('#cfMessage');
        const inquiry = $('#cfType');
        if (message && !message.value) message.value = `Hello, I'd like more information about "${property.name}" (${property.location}).`;
        if (inquiry && !inquiry.value) inquiry.value = property.status === 'For Rent' ? 'Renting a property' : 'Buying a property';
      }
    });
  }

  /* ---------- 5. HERO CAROUSEL ---------- */
  function initCarousel() {
    const hero = $('#home');
    const slides = $$('.hero__slide');
    const dots = $$('.hero__dot');
    if (!hero || slides.length === 0) return;

    let index = 0;
    let timer = null;
    const INTERVAL = 7000;

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        const img = $('img', slide);
        if (active && img) img.loading = 'eager';
      });
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function stop() { window.clearInterval(timer); timer = null; }
    function start() {
      if (prefersReducedMotion() || timer) return;
      timer = window.setInterval(() => goTo(index + 1), INTERVAL);
    }
    function restart() { stop(); start(); }

    dots.forEach((dot) => dot.addEventListener('click', () => { goTo(Number(dot.dataset.slide)); restart(); }));
    const prev = $('#heroPrev');
    const next = $('#heroNext');
    if (prev) prev.addEventListener('click', () => { goTo(index - 1); restart(); });
    if (next) next.addEventListener('click', () => { goTo(index + 1); restart(); });

    // Pause while the user is interacting with the hero.
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    start();
  }

  /* ---------- 6. NAVIGATION ---------- */
  function closeMobileMenu() {
    const header = $('#siteHeader');
    const toggle = $('#navToggle');
    if (!header || !header.classList.contains('is-open')) return;
    header.classList.remove('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  }

  function initNavigation() {
    const header = $('#siteHeader');
    const toggle = $('#navToggle');
    const nav = $('#primaryNav');
    if (!header) return;

    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = !header.classList.contains('is-open');
        header.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        closeMobileMenu();
        if (toggle) toggle.focus();
      }
    });

    // Close the menu if the viewport grows past the mobile breakpoint.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) closeMobileMenu();
    });

    // Smooth scrolling for in-page links (data-open / data-filter-type links are handled elsewhere).
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.hasAttribute('data-open') || link.hasAttribute('data-filter-type')) return;
      const hash = link.getAttribute('href');
      if (hash.length < 2) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      closeMobileMenu();
      scrollToTarget(target);
      if (window.history && window.history.replaceState) window.history.replaceState(null, '', hash);
    });

    // Solid header background after scrolling past the top.
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Highlight the nav link for the section in view.
    const links = $$('.nav__link[data-section]', nav || document);
    if ('IntersectionObserver' in window && links.length) {
      const setActive = (id) => links.forEach((link) => {
        const active = link.dataset.section === id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      ['home', 'services', 'properties', 'about'].forEach((id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      });
    }

    // Header search icon focuses the location field.
    const searchBtn = $('#headerSearchBtn');
    const locationInput = $('#locationInput');
    if (searchBtn && locationInput) {
      searchBtn.addEventListener('click', () => {
        closeMobileMenu();
        const hero = $('#home');
        if (hero) hero.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        locationInput.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- 7. CONTACT FORM (demonstration: no backend, nothing is sent) ---------- */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

  function fieldMessage(input) {
    const value = input.value.trim();
    if (input.required && !value) {
      return input.tagName === 'SELECT' ? 'Please choose an inquiry type.' : 'This field is required.';
    }
    if (input.id === 'cfName' && value && value.length < 2) return 'Enter your full name.';
    if (input.id === 'cfEmail' && value && !EMAIL_PATTERN.test(value)) return 'Enter a valid email address, such as name@example.com.';
    if (input.id === 'cfPhone' && value && !PHONE_PATTERN.test(value)) return 'Enter a valid phone number, or leave it blank.';
    if (input.id === 'cfMessage' && value && value.length < 10) return 'Please write at least 10 characters.';
    return '';
  }

  function showFieldError(input, message) {
    const wrapper = input.closest('.field');
    const error = $(`[data-error-for="${input.id}"]`);
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
    if (error) error.textContent = message; // textContent: user input is never parsed as HTML
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function resetContactForm() {
    const form = $('#contactForm');
    const success = $('#formSuccess');
    if (form) {
      form.reset();
      $$('input, select, textarea', form).forEach((input) => showFieldError(input, ''));
    }
    if (success) success.hidden = true;
  }

  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    const fields = $$('input, select, textarea', form);

    fields.forEach((input) => {
      input.addEventListener('blur', () => showFieldError(input, fieldMessage(input)));
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') showFieldError(input, fieldMessage(input));
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let firstInvalid = null;
      fields.forEach((input) => {
        const message = fieldMessage(input);
        showFieldError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const name = $('#cfName').value.trim().split(/\s+/)[0];
      const success = $('#formSuccess');
      const text = $('#formSuccessText');
      if (success && text) {
        text.textContent = `Thanks, ${name}. Your details passed validation. This is a demonstration form, so nothing was sent or stored.`;
        success.hidden = false;
        success.focus();
      }
      form.reset();
    });
  }

  /* ---------- 8. INIT ---------- */
  function init() {
    // Image fallbacks: capture-phase listener (image errors don't bubble).
    document.addEventListener('error', (event) => handleImageFailure(event.target), true);
    $$('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.src) handleImageFailure(img); });

    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    initDialogs();
    initProperties();
    initPropertyEnquiry();
    initCarousel();
    initNavigation();
    initContactForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
