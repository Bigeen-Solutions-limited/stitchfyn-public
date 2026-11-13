/* ---------- Site config ---------- */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/movwonva';
// TODO(owner): the production web app origin, no trailing slash, e.g. https://app.stitchfyn.com
const APP_URL = '';

/* ---------- Old one-page links ---------- */
// The site used to be one long page. Old section links on the home page
// (/#how, /#faq, ...) go to the page that now holds that content. The part
// after # never reaches the server, so _redirects cannot do this.
// /#pattern and /#people still exist on the home page, so they stay.
(function () {
  if (document.body.getAttribute('data-page') !== 'home') return;
  const moved = {
    '#how': 'how-it-works.html',
    '#platform': 'features.html',
    '#proof': 'features.html#proof',
    '#verify': 'verify.html',
    '#faq': 'faq.html',
    '#founding': 'early-adopters.html#founding'
  };
  const target = moved[location.hash];
  if (target) location.replace(target);
})();

$(function () {

  const isLocalPreview = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

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

  document.querySelectorAll('.stat-number').forEach(function (el) {
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

  /* ---------- Early Adopter form ---------- */
  const $form = $('#foundingForm');
  const $success = $('#foundingSuccess');
  const $alert = $('#formAlert');

  function setError($row, message) {
    $row.addClass('has-error');
    $row.find('.form-error').text(message);
  }

  function clearError($row) {
    $row.removeClass('has-error');
    $row.find('.form-error').text('');
  }

  // Clear a field's error the moment the user starts fixing it
  $form.on('input change', 'input, select', function () {
    clearError($(this).closest('.form-row'));
    $alert.prop('hidden', true);
  });

  // Accept 080XXXXXXXX (11 digits) or +234 formats — don't reject a real lead
  // over formatting.
  function isValidNigerianPhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  $form.on('submit', function (e) {
    e.preventDefault();

    let valid = true;
    let $firstErrorRow = null;
    const fields = ['ownerFullName', 'companyName', 'ownerEmail', 'country', 'whatsapp'];

    fields.forEach(function (name) {
      const $input = $form.find('[name="' + name + '"]');
      const $row = $input.closest('.form-row');
      clearError($row);

      const value = $.trim($input.val());
      let message = null;

      if (!value) {
        message = 'This field is required.';
      } else if (name === 'ownerEmail' && !isValidEmail(value)) {
        message = 'Enter a valid email address, e.g. you@example.com.';
      } else if (name === 'whatsapp' && !isValidNigerianPhone(value)) {
        message = 'Enter a valid WhatsApp number, e.g. 08012345678.';
      }

      if (message) {
        setError($row, message);
        valid = false;
        if (!$firstErrorRow) $firstErrorRow = $row;
      }
    });

    if (!valid) {
      $firstErrorRow.find('input, select').trigger('focus');
      return;
    }

    const ownerFullName = $.trim($form.find('[name="ownerFullName"]').val());
    const firstName = ownerFullName.split(' ')[0];
    const companyName = $.trim($form.find('[name="companyName"]').val());

    // Field names match the system admin's Create Company form
    const payload = {
      ownerFullName: ownerFullName,
      companyName: companyName,
      ownerEmail: $.trim($form.find('[name="ownerEmail"]').val()),
      country: $.trim($form.find('[name="country"]').val()),
      whatsapp: $.trim($form.find('[name="whatsapp"]').val()),
      _subject: 'Early Adopter application: ' + companyName,
      _gotcha: $form.find('[name="_gotcha"]').val()
    };

    const $submitBtn = $form.find('.form-submit');
    $submitBtn.prop('disabled', true).text('Sending...');
    $alert.prop('hidden', true);

    // A placeholder endpoint only fakes success in a local preview. On a real
    // host it shows the retry alert instead, so a lead is never silently lost.
    const endpointIsPlaceholder = FORMSPREE_ENDPOINT.indexOf('YOUR_FORM_ID') !== -1;

    $.ajax({
      url: FORMSPREE_ENDPOINT,
      method: 'POST',
      data: payload,
      dataType: 'json'
    }).done(function () {
      showSuccess(firstName);
    }).fail(function () {
      if (endpointIsPlaceholder && isLocalPreview) {
        showSuccess(firstName);
        return;
      }
      // Keep the lead: re-enable the button, keep their details, show retry.
      $submitBtn.prop('disabled', false).text('Apply Now');
      $alert.prop('hidden', false);
    });
  });

  function showSuccess(firstName) {
    $form.hide();
    $('.trust-row').hide();
    $success.find('.founding-success-msg').text(
      'Application received, ' + firstName + '. We will reach you on WhatsApp within 48 hours ' +
      'to set up your workshop. Thank you for trusting us with your December.'
    );

    const shareText = 'I just applied to be a StitchFYN Early Adopter — free during the ' +
      'early access period, 50 spots only. Every tailor with a December story should see this: ' +
      window.location.href;
    $('#shareWhatsapp').attr('href', 'https://wa.me/?text=' + encodeURIComponent(shareText));

    $success.prop('hidden', false);
    if (stickyCta) { stickyCta.classList.remove('is-shown'); }
  }

});
