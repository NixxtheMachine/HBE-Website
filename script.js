function initRevealAnimations() {
  const targets = document.querySelectorAll('.reveal');
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((target, index) => {
    target.style.transitionDelay = `${Math.min(index * 50, 240)}ms`;
    observer.observe(target);
  });
}

function highlightCurrentNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path) link.classList.add('active');
  });
}

function initConsultationForm() {
  const form = document.getElementById('consultationForm');
  if (!form) return;
  if (form.action && form.action.includes('formspree.io')) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const summary = [
      `Name: ${data.name || ''}`,
      `Concern: ${data.concern || ''}`,
      `Preferred Contact: ${data.contact || ''}`,
      `Message: ${data.message || ''}`
    ].join('\n');

    const subject = encodeURIComponent('Private Consultation Request - Leicester Surgical Specialists');
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:info@leicestersurgicalspecialists.co.uk?subject=${subject}&body=${body}`;
    form.reset();
  });
}

function initExplainerToggles() {
  const toggles = document.querySelectorAll('[data-toggle-target]');
  if (toggles.length === 0) return;

  toggles.forEach((toggle) => {
    const targetId = toggle.getAttribute('data-toggle-target');
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const isCollapsed = target.classList.contains('is-collapsed');
      target.classList.toggle('is-collapsed', !isCollapsed);
      target.setAttribute('aria-hidden', String(!isCollapsed));
      toggle.setAttribute('aria-expanded', String(isCollapsed));

      if (isCollapsed) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initVideoPlayButtons() {
  const triggers = document.querySelectorAll('[data-play-video-target]');
  if (triggers.length === 0) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', async (event) => {
      const videoId = trigger.getAttribute('data-play-video-target');
      if (!videoId) return;
      const video = document.getElementById(videoId);
      if (!(video instanceof HTMLVideoElement)) return;

      event.preventDefault();

      const revealId = trigger.getAttribute('data-reveal-target');
      if (revealId) {
        const panel = document.getElementById(revealId);
        if (panel) panel.classList.remove('is-collapsed');
      }

      const anchor = trigger.getAttribute('href');
      if (anchor && anchor.startsWith('#')) {
        const target = document.querySelector(anchor);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        video.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      try {
        await video.play();
      } catch (_error) {
        // If browser blocks programmatic play, controls remain available to start manually.
      }
    });
  });
}

const MEDIA_TARGETS = {
  heroBackground: { type: 'image', elementId: 'heroBackgroundImage' },
  heroPortrait: { type: 'image', elementId: 'heroPortraitImage' },
  professionalPortrait: { type: 'image', elementId: 'professionalPortraitImage' },
  clinicalVideo: { type: 'video', elementId: 'clinicalVideoPlayer' },
  introVideo: { type: 'video', elementId: 'introHbeVideo' }
};

function normalizeMediaUrl(url) {
  if (!url) return '';
  const withoutQuery = String(url).split('?')[0].split('#')[0];
  const origin = window.location.origin;
  if (withoutQuery.startsWith(origin)) {
    return withoutQuery.slice(origin.length);
  }
  return withoutQuery;
}

function updatePresetActiveState(key, currentUrl) {
  const group = document.querySelector(`[data-preset-key="${key}"]`);
  if (!group) return;
  const normalizedCurrent = normalizeMediaUrl(currentUrl);
  const buttons = group.querySelectorAll('.preset-button');
  buttons.forEach((button) => {
    const presetUrl = normalizeMediaUrl(button.getAttribute('data-media-url'));
    const isActive = normalizedCurrent && presetUrl === normalizedCurrent;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(Boolean(isActive)));
  });
}

function applyMediaItem(key, url) {
  const target = MEDIA_TARGETS[key];
  if (!target || !url) return;
  const el = document.getElementById(target.elementId);
  if (!el) return;

  if (target.type === 'image') {
    el.src = url;
    updatePresetActiveState(key, url);
    return;
  }

  if (target.type === 'video' && el instanceof HTMLVideoElement) {
    el.src = url;
    el.load();
  }
}

async function loadMediaOverrides() {
  try {
    const response = await fetch('/api/media', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    Object.entries(data).forEach(([key, url]) => applyMediaItem(key, url));
  } catch (_error) {
    // Backend may not be running (e.g., GitHub Pages static mode).
  }
}

async function setMediaUrlValue(key, url, statusEl) {
  if (!key || !url) return;
  if (statusEl) statusEl.textContent = 'Applying preset...';
  try {
    const response = await fetch('/api/media/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, url })
    });
    if (!response.ok) throw new Error(`Save failed: ${response.status}`);
    const result = await response.json();
    applyMediaItem(result.key, result.url);
    if (statusEl) statusEl.textContent = 'Preset applied.';
  } catch (_error) {
    applyMediaItem(key, url);
    if (statusEl) statusEl.textContent = 'Preset applied locally (backend offline).';
  }
}

function initAdminPanelVisibility() {
  const panel = document.getElementById('adminMediaPanel');
  if (!panel) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') {
    panel.classList.remove('is-collapsed');
  }
}

async function uploadMediaFile(key, file, statusEl) {
  if (!file) return;
  statusEl.textContent = 'Uploading...';
  const body = new FormData();
  body.append('key', key);
  body.append('file', file);

  try {
    const response = await fetch('/api/upload', { method: 'POST', body });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const result = await response.json();
    applyMediaItem(key, result.url);
    statusEl.textContent = 'Upload complete.';
  } catch (_error) {
    statusEl.textContent = 'Upload failed. Backend may be offline.';
  }
}

function initAdminMediaUploads() {
  const cards = document.querySelectorAll('.upload-card');
  if (cards.length === 0) return;

  cards.forEach((card) => {
    const key = card.getAttribute('data-media-key');
    const input = card.querySelector('input[type="file"]');
    const zone = card.querySelector('.upload-drop-zone');
    const statusEl = card.querySelector('.upload-status');
    if (!key || !input || !zone || !statusEl) return;

    input.addEventListener('change', () => {
      const [file] = input.files || [];
      uploadMediaFile(key, file, statusEl);
    });

    zone.addEventListener('dragover', (event) => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('drag-over');
      const file = event.dataTransfer?.files?.[0];
      uploadMediaFile(key, file, statusEl);
    });
  });
}

function initMediaPresets() {
  const presetGroups = document.querySelectorAll('[data-preset-key]');
  if (presetGroups.length === 0) return;

  presetGroups.forEach((group) => {
    const key = group.getAttribute('data-preset-key');
    if (!key) return;
    const card = group.closest('.upload-card');
    const statusEl = card?.querySelector('.upload-status');
    const buttons = group.querySelectorAll('.preset-button');
    buttons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const url = button.getAttribute('data-media-url');
        setMediaUrlValue(key, url, statusEl);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  highlightCurrentNav();
  initRevealAnimations();
  initConsultationForm();
  initExplainerToggles();
  initVideoPlayButtons();
  initAdminPanelVisibility();
  initAdminMediaUploads();
  initMediaPresets();
  loadMediaOverrides();
});
