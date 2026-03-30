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

document.addEventListener('DOMContentLoaded', () => {
  highlightCurrentNav();
  initRevealAnimations();
  initConsultationForm();
  initExplainerToggles();
  initVideoPlayButtons();
});
