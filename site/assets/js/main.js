(function () {
  'use strict';

  /* ============================================================
     NAV TEMPLATE
     ============================================================ */
  var NAV_HTML = [
    '<nav class="nav">',
    '  <div class="nav__inner container">',
    '    <a href="index.html" class="nav__logo">',
    '      <img src="assets/images/logo/logo-nav.png" alt="SCP Photography" class="nav__logo-img">',
    '    </a>',
    '    <ul class="nav__links" id="nav-menu">',
    '      <li><a href="index.html">Home</a></li>',
    '      <li><a href="portfolio.html">Portfolio</a></li>',
    '      <li><a href="bookings.html" class="nav__cta">Book a Session</a></li>',
    '    </ul>',
    '    <button class="nav__toggle" id="nav-toggle" aria-label="Toggle navigation">',
    '      <span></span><span></span><span></span>',
    '    </button>',
    '  </div>',
    '</nav>'
  ].join('\n');

  /* ============================================================
     FOOTER TEMPLATE
     ============================================================ */
  var FOOTER_HTML = [
    '<footer class="footer">',
    '  <div class="footer__inner">',
    '    <img src="assets/images/logo/logo-nav.png" alt="SCP Photography" class="footer__logo-img">',
    '    <p class="footer__copy">&copy; 2026 SCP Photography. All rights reserved.</p>',
    '    <div class="footer__social">',
    '      <a href="https://www.instagram.com/scp_photography" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="footer__social-link">',
    '        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">',
    '          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
    '        </svg>',
    '      </a>',
    '    </div>',
    '  </div>',
    '</footer>'
  ].join('\n');

  /* ============================================================
     INJECT NAV & FOOTER
     ============================================================ */
  function injectNav() {
    var root = document.getElementById('nav-root');
    if (root) {
      root.innerHTML = NAV_HTML;
    }
  }

  function injectFooter() {
    var root = document.getElementById('footer-root');
    if (root) {
      root.innerHTML = FOOTER_HTML;
    }
  }

  /* ============================================================
     ACTIVE NAV LINK
     ============================================================ */
  function setActiveNavLink() {
    var path = window.location.pathname;
    var href = window.location.href;

    // Determine current page
    var currentPage = 'index.html';
    if (path.indexOf('portfolio') !== -1 || href.indexOf('portfolio') !== -1) {
      currentPage = 'portfolio.html';
    } else if (path.indexOf('bookings') !== -1 || href.indexOf('bookings') !== -1) {
      currentPage = 'bookings.html';
    } else if (path === '/' || path.indexOf('index') !== -1 || path === '' || path.match(/\/$/)) {
      currentPage = 'index.html';
    }

    var navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    var links = navMenu.querySelectorAll('a');
    links.forEach(function (link) {
      var linkHref = link.getAttribute('href');
      if (linkHref === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ============================================================
     MOBILE NAV TOGGLE
     ============================================================ */
  function initMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.querySelector('.nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      nav.classList.toggle('nav--open');
    });

    // Close nav when a link is clicked
    var navMenu = document.getElementById('nav-menu');
    if (navMenu) {
      var links = navMenu.querySelectorAll('a');
      links.forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('nav--open');
        });
      });
    }

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        nav.classList.remove('nav--open');
      }
    });
  }

  /* ============================================================
     RENDER SERVICE CARDS
     ============================================================ */
  function renderServiceCards() {
    var grid = document.getElementById('services-grid');
    if (!grid) return;
    if (!window.SCP || !window.SCP.services) return;

    var html = '';
    window.SCP.services.forEach(function (service) {
      html += [
        '<div class="service-card">',
        '  <img src="' + service.image + '" alt="' + service.name + '" class="service-card__img">',
        '  <div class="service-card__body">',
        '    <h3 class="service-card__name">' + service.name + '</h3>',
        '    <p class="service-card__desc">' + service.description + '</p>',
        '    <p class="service-card__price">' + service.pricePrefix + service.price + '</p>',
        '    <a href="bookings.html" class="btn btn--accent service-card__cta">Book a Session</a>',
        '  </div>',
        '</div>'
      ].join('\n');
    });

    grid.innerHTML = html;
  }

  /* ============================================================
     RENDER PACKAGE CARDS
     ============================================================ */
  function renderPackageCards() {
    var grid = document.getElementById('packages-grid');
    if (!grid) return;
    if (!window.SCP || !window.SCP.packages) return;

    var html = '';
    window.SCP.packages.forEach(function (pkg) {
      var bulletsHtml = pkg.bullets.map(function (bullet) {
        return '<li>' + bullet + '</li>';
      }).join('\n');

      html += [
        '<div class="package-card">',
        '  <p class="package-card__label">' + pkg.label + '</p>',
        '  <p class="package-card__price">$' + pkg.price + '</p>',
        '  <hr class="package-card__divider">',
        '  <ul class="package-card__bullets">',
        bulletsHtml,
        '  </ul>',
        '</div>'
      ].join('\n');
    });

    grid.innerHTML = html;
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    injectNav();
    injectFooter();
    setActiveNavLink();
    initMobileNav();
    renderServiceCards();
    renderPackageCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
