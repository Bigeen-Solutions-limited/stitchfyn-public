/* ---------- Site config — set both before going public ---------- */
// TODO(owner): your real Formspree endpoint, e.g. https://formspree.io/f/abcd1234
var FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
// TODO(owner): the production web app origin, no trailing slash, e.g. https://app.stitchfyn.com
var APP_URL = '';

$(function () {

  var isLocalPreview = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  /* ---------- Links into the web app ---------- */
  // Hidden until APP_URL is set, so visitors never hit a dead "Sign in".
  $('[data-app-link]').each(function () {
    var $link = $(this);
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
    var code = $.trim($('#sealCode').val()).toUpperCase();
    if (!/^[A-Z0-9-]{4,40}$/.test(code)) {
      $('#verifyError').text('Enter the seal code exactly as it appears, e.g. FSS-7A21-9K04.');
      return;
    }
    $('#verifyError').text('');
    window.open(APP_URL + '/public/seals/' + encodeURIComponent(code), '_blank', 'noopener');
  });
  $('#sealCode').on('input', function () { $('#verifyError').text(''); });

  /* ---------- Nav scroll state ---------- */
  var $nav = $('#nav');

  function updateNavOnScroll() {
    if ($(window).scrollTop() > 40) {
      $nav.addClass('is-scrolled');
    } else {
      $nav.removeClass('is-scrolled');
    }
  }
  updateNavOnScroll();
  $(window).on('scroll', updateNavOnScroll);

  /* ---------- Mobile nav burger ---------- */
  var $burger = $('#navBurger');
  $burger.on('click', function () {
    var isOpen = $nav.toggleClass('menu-open').hasClass('menu-open');
    $burger.attr('aria-expanded', isOpen);
  });

  $('.nav-overlay-link, .nav-overlay-cta').on('click', function () {
    $nav.removeClass('menu-open');
    $burger.attr('aria-expanded', false);
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $('a[href^="#"]').on('click', function (e) {
    var targetId = $(this).attr('href');
    var $target = targetId.length > 1 ? $(targetId) : $('html');
    if ($target.length) {
      e.preventDefault();
      // Honour CSS scroll-margin-top, so a target can clear the fixed nav
      var margin = parseFloat($target.css('scroll-margin-top')) || 0;
      $('html, body').animate({ scrollTop: $target.offset() ? $target.offset().top - margin : 0 }, 600);
      if (targetId.length > 1 && history.replaceState) history.replaceState(null, '', targetId);
    }
  });

  /* ---------- Scroll-triggered fade-up ---------- */
  var observer = new IntersectionObserver(function (entries) {
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
  var statObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var $el = $(entry.target);
      var target = parseInt($el.data('target'), 10);
      var prefix = $el.data('prefix') || '';
      var suffix = $el.data('suffix') || '';
      var duration = 1200;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * target);
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
  var stickyCta = document.getElementById('stickyCta');
  var heroVisible = true;
  var foundingVisible = false;

  function updateStickyCta() {
    stickyCta.hidden = false;
    if (!heroVisible && !foundingVisible) {
      stickyCta.classList.add('is-shown');
    } else {
      stickyCta.classList.remove('is-shown');
    }
  }

  var stickyObserver = new IntersectionObserver(function (entries) {
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

  /* ---------- Founding Tailor form ---------- */
  var $form = $('#foundingForm');
  var $success = $('#foundingSuccess');
  var $alert = $('#formAlert');

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
    var digits = value.replace(/\D/g, '');
    return /^0\d{10}$/.test(digits) || /^234\d{10}$/.test(digits);
  }

  $form.on('submit', function (e) {
    e.preventDefault();

    var valid = true;
    var $firstErrorRow = null;
    var fields = ['fullName', 'shopName', 'city', 'whatsapp', 'experience', 'staffCount'];

    fields.forEach(function (name) {
      var $input = $form.find('[name="' + name + '"]');
      var $row = $input.closest('.form-row');
      clearError($row);

      var value = $.trim($input.val());
      var message = null;

      if (!value) {
        message = 'This field is required.';
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

    var fullName = $.trim($form.find('[name="fullName"]').val());
    var firstName = fullName.split(' ')[0];

    var payload = {
      fullName: fullName,
      shopName: $.trim($form.find('[name="shopName"]').val()),
      city: $.trim($form.find('[name="city"]').val()),
      whatsapp: $.trim($form.find('[name="whatsapp"]').val()),
      experience: $form.find('[name="experience"]').val(),
      staffCount: $form.find('[name="staffCount"]').val()
    };

    var $submitBtn = $form.find('.form-submit');
    $submitBtn.prop('disabled', true).text('Sending...');
    $alert.prop('hidden', true);

    // A placeholder endpoint only fakes success in a local preview. On a real
    // host it shows the retry alert instead, so a lead is never silently lost.
    var endpointIsPlaceholder = FORMSPREE_ENDPOINT.indexOf('YOUR_FORM_ID') !== -1;

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

    var shareText = 'I just applied to be a StitchFYN Founding Tailor — free during the ' +
      'founding period, 50 spots only. Every tailor with a December story should see this: ' +
      window.location.href;
    $('#shareWhatsapp').attr('href', 'https://wa.me/?text=' + encodeURIComponent(shareText));

    $success.prop('hidden', false);
    if (stickyCta) { stickyCta.classList.remove('is-shown'); }
  }

});
