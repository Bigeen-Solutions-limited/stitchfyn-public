/* ---------- Site config ---------- */
// The production web app origin, no trailing slash (D-M8). Turns on the Sign in
// and Apply (sign-up) links and the seal check. scripts/sync-partials.mjs also
// writes it into the pages' Sign in and Apply links, so run it after changing this.
const APP_URL = 'https://app.stitchfyn.com';
// Cloudflare Web Analytics (DEC-012): page views only, no cookies. Paste the site
// token from the Cloudflare dashboard to turn it on; while it is empty nothing
// loads. Leave it empty if automatic setup is on for the Pages project instead.
const CF_ANALYTICS_TOKEN = '';

/* ---------- Cloudflare Web Analytics ---------- */
(function () {
  if (!CF_ANALYTICS_TOKEN) return;
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_ANALYTICS_TOKEN }));
  document.head.appendChild(beacon);
})();

/* ---------- Old one-page links ---------- */
// The site used to be one long page. Old section links on the home page
// (/#how, /#faq, ...) go to the page that now holds that content. The part
// after # never reaches the server, so _redirects cannot do this.
// /#pattern and /#people still exist on the home page, so they stay.
(function () {
  if (document.body.getAttribute('data-page') !== 'home') return;
  const moved = {
    '#how': '/how-it-works',
    '#platform': '/features',
    '#proof': '/features#proof',
    '#verify': '/verify',
    '#faq': '/faq',
    '#founding': '/early-adopters#founding'
  };
  const target = moved[location.hash];
  if (target) location.replace(target);
})();

$(function () {

  /* ---------- Links into the web app ---------- */
  // Hidden until APP_URL is set, so visitors never hit a dead "Sign in".
  $('[data-app-link]').each(function () {
    const $link = $(this);
    if (APP_URL) {
      $link.attr('href', APP_URL + $link.data('app-link'));
    } else {
      $link.hide();
    }
  });
  if (!APP_URL) $('[data-app-required]').hide();

  /* ---------- Fabric Safety Seal lookup ---------- */
  $('#verifyForm').on('submit', function (e) {
    e.preventDefault();
    const code = $.trim($('#sealCode').val()).toUpperCase();
    if (!/^[A-Z0-9-]{4,40}$/.test(code)) {
      $('#verifyError').text('Enter the seal code exactly as it appears, e.g. FSS-7A21-9K04.');
      return;
    }
    $('#verifyError').text('');
    window.open(APP_URL + '/public/seals/' + encodeURIComponent(code), '_blank', 'noopener');
  });
  $('#sealCode').on('input', function () { $('#verifyError').text(''); });

  /* ---------- Nav scroll state ---------- */
  const $nav = $('#nav');
  // Pages with no green header under the nav keep the white bar at the top too
  const solidNav = $nav.is('[data-nav-solid]');

  function updateNavOnScroll() {
    if (solidNav) return;
    if ($(window).scrollTop() > 40) {
      $nav.addClass('is-scrolled');
    } else {
      $nav.removeClass('is-scrolled');
    }
  }
  updateNavOnScroll();
  $(window).on('scroll', updateNavOnScroll);

  /* ---------- Mobile nav burger ---------- */
  const $burger = $('#navBurger');
  $burger.on('click', function () {
    const isOpen = $nav.toggleClass('menu-open').hasClass('menu-open');
    $burger.attr('aria-expanded', isOpen).attr('aria-label', isOpen ? 'Close menu' : 'Open menu');
    $('body').toggleClass('menu-locked', isOpen);
  });

  function closeMenu() {
    $nav.removeClass('menu-open');
    $burger.attr('aria-expanded', false).attr('aria-label', 'Open menu');
    $('body').removeClass('menu-locked');
  }

  $('.nav-overlay-link, .nav-overlay-cta').on('click', closeMenu);

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $nav.hasClass('menu-open')) {
      closeMenu();
      $burger.trigger('focus');
    }
  });

  // Leaving the phone layout with the menu open must not strand the page locked
  $(window).on('resize', function () {
    if (window.innerWidth > 960) closeMenu();
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $('a[href^="#"]').on('click', function (e) {
    const targetId = $(this).attr('href');
    const $target = targetId.length > 1 ? $(targetId) : $('html');
    if ($target.length) {
      e.preventDefault();
      // Honour CSS scroll-margin-top, so a target can clear the fixed nav
      const margin = parseFloat($target.css('scroll-margin-top')) || 0;
      $('html, body').animate({ scrollTop: $target.offset() ? $target.offset().top - margin : 0 }, 600);
      if (targetId.length > 1 && history.replaceState) history.replaceState(null, '', targetId);
    }
  });

  /* ---------- Scroll-triggered fade-up ---------- */
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(function (el) {
    observer.observe(el);
  });

  /* ---------- Stat counter animation ---------- */
  const statObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const $el = $(entry.target);
      const target = parseInt($el.data('target'), 10);
      const prefix = $el.data('prefix') || '';
      const suffix = $el.data('suffix') || '';
      const duration = 1200;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        $el.text(prefix + current + suffix);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          $el.text(prefix + target + suffix);
        }
      }
      requestAnimationFrame(step);
      statObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  // Only counted numbers animate; word tiles ("One tap") have no data-target
  document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
    statObserver.observe(el);
  });

  /* ---------- Sticky mobile CTA bar ---------- */
  const stickyCta = document.getElementById('stickyCta');
  let heroVisible = true;
  let foundingVisible = false;

  function updateStickyCta() {
    stickyCta.hidden = false;
    if (!heroVisible && !foundingVisible) {
      stickyCta.classList.add('is-shown');
    } else {
      stickyCta.classList.remove('is-shown');
    }
  }

  const stickyObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target.classList.contains('hero')) heroVisible = entry.isIntersecting;
      if (entry.target.id === 'founding') foundingVisible = entry.isIntersecting;
    });
    updateStickyCta();
  }, { threshold: 0.05 });

  // Only the landing page has the sticky bar, hero and form; other pages share this script
  if (stickyCta && document.querySelector('.hero') && document.getElementById('founding')) {
    stickyObserver.observe(document.querySelector('.hero'));
    stickyObserver.observe(document.getElementById('founding'));
  }

});
