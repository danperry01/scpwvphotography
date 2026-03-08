(function () {
  'use strict';

  /* ============================================================
     EMAILJS CONFIGURATION
     Replace these values with your actual EmailJS credentials.
     Sign up at https://www.emailjs.com/ to get your service ID,
     template ID, and public key.
     ============================================================ */
  var EMAILJS_SERVICE_ID  = 'service_qmjj90d';
  var EMAILJS_TEMPLATE_ID = 'template_hwsf0sr';
  var EMAILJS_PUBLIC_KEY  = 'B96025OtQvB7_kfFF';

  /* ============================================================
     STATE
     ============================================================ */
  var currentStep = 1;
  var formData = {
    sessionType: '',
    sessionName: '',
    sessionPrice: '',
    name: '',
    email: '',
    phone: '',
    date: '',
    message: ''
  };

  /* ============================================================
     DOM REFS (populated after DOMContentLoaded)
     ============================================================ */
  var els = {};

  function cacheElements() {
    els.form         = document.getElementById('booking-form');
    els.success      = document.getElementById('form-success');
    els.sessionOpts  = document.getElementById('session-options');
    els.step1        = document.getElementById('step-1');
    els.step2        = document.getElementById('step-2');
    els.step3        = document.getElementById('step-3');
    els.next1        = document.getElementById('next-1');
    els.next2        = document.getElementById('next-2');
    els.back2        = document.getElementById('back-2');
    els.back3        = document.getElementById('back-3');
    els.submitBtn    = document.getElementById('submit-btn');
    els.stepNums     = [
      document.getElementById('step-num-1'),
      document.getElementById('step-num-2'),
      document.getElementById('step-num-3')
    ];
    els.errorSession = document.getElementById('error-session');
    els.errorName    = document.getElementById('error-name');
    els.errorEmail   = document.getElementById('error-email');
    els.errorSubmit  = document.getElementById('error-submit');
    els.inputName    = document.getElementById('name');
    els.inputEmail   = document.getElementById('email');
    els.inputPhone   = document.getElementById('phone');
    els.inputDate    = document.getElementById('date');
    els.inputMessage = document.getElementById('message');
  }

  /* ============================================================
     STEP INDICATORS
     ============================================================ */
  function updateStepIndicators(active) {
    els.stepNums.forEach(function (num, i) {
      var stepNum = i + 1;
      num.classList.remove('active', 'done');
      if (stepNum < active) {
        num.classList.add('done');
        num.textContent = '\u2713'; // checkmark
      } else if (stepNum === active) {
        num.classList.add('active');
        num.textContent = String(stepNum);
      } else {
        num.textContent = String(stepNum);
      }
    });
  }

  /* ============================================================
     SHOW / HIDE STEPS
     ============================================================ */
  function goToStep(step) {
    // Hide all steps
    [els.step1, els.step2, els.step3].forEach(function (s) {
      if (s) s.classList.remove('active');
    });

    var target = document.getElementById('step-' + step);
    if (target) target.classList.add('active');

    currentStep = step;
    updateStepIndicators(step);

    // Scroll to top of form
    var container = document.querySelector('.booking-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ============================================================
     RENDER SESSION OPTIONS (Step 1)
     ============================================================ */
  function renderSessionOptions() {
    if (!els.sessionOpts) return;
    if (!window.SCP || !window.SCP.services) return;

    var html = '';
    window.SCP.services.forEach(function (service) {
      html += [
        '<div class="session-option">',
        '  <input type="radio" name="session-type" id="session-' + service.id + '" value="' + service.id + '">',
        '  <label for="session-' + service.id + '">',
        '    <div class="session-option__name">' + service.name + '</div>',
        '    <div class="session-option__price">' + service.pricePrefix + service.price + '</div>',
        '  </label>',
        '</div>'
      ].join('\n');
    });

    els.sessionOpts.innerHTML = html;

    // Listen for radio changes to clear error
    var radios = els.sessionOpts.querySelectorAll('input[type="radio"]');
    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        hideError(els.errorSession);
      });
    });
  }

  /* ============================================================
     VALIDATION HELPERS
     ============================================================ */
  function showError(el, msg) {
    if (!el) return;
    if (msg) el.textContent = msg;
    el.classList.add('show');
  }

  function hideError(el) {
    if (!el) return;
    el.classList.remove('show');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /* ============================================================
     STEP 1 VALIDATION
     ============================================================ */
  function validateStep1() {
    var radios = document.querySelectorAll('input[name="session-type"]');
    var selected = null;
    radios.forEach(function (r) {
      if (r.checked) selected = r;
    });

    if (!selected) {
      showError(els.errorSession, 'Please select a session type to continue.');
      return false;
    }

    hideError(els.errorSession);

    // Store selection
    formData.sessionType = selected.value;

    // Find matching service for name and price
    var service = (window.SCP.services || []).find(function (s) {
      return s.id === selected.value;
    });
    if (service) {
      formData.sessionName  = service.name;
      formData.sessionPrice = service.pricePrefix + service.price;
    }

    return true;
  }

  /* ============================================================
     STEP 2 VALIDATION
     ============================================================ */
  function validateStep2() {
    var valid = true;

    var name = els.inputName ? els.inputName.value.trim() : '';
    if (!name) {
      showError(els.errorName, 'Please enter your name.');
      valid = false;
    } else {
      hideError(els.errorName);
    }

    var email = els.inputEmail ? els.inputEmail.value.trim() : '';
    if (!email || !isValidEmail(email)) {
      showError(els.errorEmail, 'Please enter a valid email address.');
      valid = false;
    } else {
      hideError(els.errorEmail);
    }

    if (valid) {
      formData.name  = name;
      formData.email = email;
      formData.phone = els.inputPhone ? els.inputPhone.value.trim() : '';
    }

    return valid;
  }

  /* ============================================================
     COLLECT STEP 3 DATA
     ============================================================ */
  function collectStep3() {
    formData.date    = els.inputDate    ? els.inputDate.value    : '';
    formData.message = els.inputMessage ? els.inputMessage.value : '';
  }

  /* ============================================================
     SET MIN DATE ON DATE INPUT
     ============================================================ */
  function setMinDate() {
    if (!els.inputDate) return;
    var today = new Date();
    var yyyy  = today.getFullYear();
    var mm    = String(today.getMonth() + 1).padStart(2, '0');
    var dd    = String(today.getDate()).padStart(2, '0');
    els.inputDate.min = yyyy + '-' + mm + '-' + dd;
  }

  /* ============================================================
     SUBMISSION
     ============================================================ */
  function handleSubmit(e) {
    e.preventDefault();
    collectStep3();

    var templateParams = {
      session_type:  formData.sessionName,
      session_price: formData.sessionPrice,
      from_name:     formData.name,
      from_email:    formData.email,
      phone:         formData.phone || 'Not provided',
      preferred_date: formData.date || 'Not specified',
      message:       formData.message || 'No additional notes.'
    };

    // Disable submit button to prevent double-submission
    if (els.submitBtn) {
      els.submitBtn.disabled = true;
      els.submitBtn.textContent = 'Sending...';
    }

    hideError(els.errorSubmit);

    // Check if EmailJS is available and configured
    if (
      typeof window.emailjs !== 'undefined' &&
      EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
      EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
    ) {
      // Initialize EmailJS with public key if not already done
      if (EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      }

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function () {
          showSuccess();
        })
        .catch(function (err) {
          console.error('EmailJS error:', err);
          if (els.submitBtn) {
            els.submitBtn.disabled = false;
            els.submitBtn.textContent = 'Send Inquiry';
          }
          showError(
            els.errorSubmit,
            'Something went wrong sending your inquiry. Please try emailing us directly at scp.wvphotography@gmail.com.'
          );
        });
    } else {
      // EmailJS not configured — log data and show success for local testing
      console.log('EmailJS not configured. Form submission data:', templateParams);
      // Simulate brief delay for UX
      setTimeout(showSuccess, 600);
    }
  }

  function showSuccess() {
    if (els.form) {
      els.form.style.display = 'none';
    }
    var stepsEl = document.getElementById('form-steps');
    if (stepsEl) stepsEl.style.display = 'none';

    if (els.success) {
      els.success.classList.add('show');
    }
  }

  /* ============================================================
     EVENT LISTENERS
     ============================================================ */
  function attachEvents() {
    // Step 1 → 2
    if (els.next1) {
      els.next1.addEventListener('click', function () {
        if (validateStep1()) goToStep(2);
      });
    }

    // Step 2 → 1 (back)
    if (els.back2) {
      els.back2.addEventListener('click', function () {
        goToStep(1);
      });
    }

    // Step 2 → 3
    if (els.next2) {
      els.next2.addEventListener('click', function () {
        if (validateStep2()) goToStep(3);
      });
    }

    // Step 3 → 2 (back)
    if (els.back3) {
      els.back3.addEventListener('click', function () {
        goToStep(2);
      });
    }

    // Form submission
    if (els.form) {
      els.form.addEventListener('submit', handleSubmit);
    }

    // Clear errors on input
    if (els.inputName) {
      els.inputName.addEventListener('input', function () { hideError(els.errorName); });
    }
    if (els.inputEmail) {
      els.inputEmail.addEventListener('input', function () { hideError(els.errorEmail); });
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    cacheElements();
    renderSessionOptions();
    attachEvents();
    setMinDate();
    updateStepIndicators(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
