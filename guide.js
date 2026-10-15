/* ---------- How to Use guide: screenshot lightbox and contents ---------- */
(function () {
  var dialog = document.getElementById('shotLightbox');
  var img = document.getElementById('shotLightboxImg');
  var caption = document.getElementById('shotLightboxCaption');
  var closeBtn = document.getElementById('shotLightboxClose');
  var lastTrigger = null;

  // Without <dialog> support the buttons simply open the full image
  var canUseDialog = dialog && typeof dialog.showModal === 'function';

  document.querySelectorAll('.shot-zoom').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var full = btn.getAttribute('data-full');
      var thumb = btn.querySelector('img');
      if (!canUseDialog) { window.open(full, '_blank', 'noopener'); return; }
      lastTrigger = btn;
      img.src = full;
      img.alt = thumb ? thumb.alt : '';
      var fig = btn.closest('figure');
      var cap = fig ? fig.querySelector('figcaption') : null;
      caption.textContent = cap ? cap.textContent : '';
      dialog.showModal();
      closeBtn.focus();
    });
  });

  if (canUseDialog) {
    closeBtn.addEventListener('click', function () { dialog.close(); });
    // A click on the backdrop (outside the image) closes it
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      img.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    });
  }

  // Contents start collapsed on small screens, open beside the guide on wide ones
  var toc = document.getElementById('guideToc');
  var wide = window.matchMedia('(min-width: 1080px)');
  function syncToc() { if (toc) toc.open = wide.matches; }
  syncToc();
  if (wide.addEventListener) wide.addEventListener('change', syncToc);

  // On small screens, close the contents after picking a step
  if (toc) {
    toc.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (!wide.matches) toc.open = false; });
    });
  }

  // Highlight the step currently in view
  var links = {};
  document.querySelectorAll('.guide-toc a[href^="#step-"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = links[entry.target.id];
        if (!link) return;
        if (current) { current.classList.remove('is-current'); current.removeAttribute('aria-current'); }
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'step');
        current = link;
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.guide-step').forEach(function (step) { spy.observe(step); });
  }
})();
