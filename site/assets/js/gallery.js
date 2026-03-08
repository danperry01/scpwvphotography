(function () {
  'use strict';

  /* ============================================================
     LIGHTBOX STATE
     ============================================================ */
  var lightbox = null;
  var lightboxImg = null;
  var currentPhotos = [];
  var currentIndex = 0;

  /* ============================================================
     BUILD LIGHTBOX DOM (once)
     ============================================================ */
  function buildLightbox() {
    if (document.getElementById('scp-lightbox')) {
      lightbox = document.getElementById('scp-lightbox');
      lightboxImg = lightbox.querySelector('.lightbox__img');
      return;
    }

    lightbox = document.createElement('div');
    lightbox.id = 'scp-lightbox';
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');

    lightbox.innerHTML = [
      '<button class="lightbox__close" aria-label="Close lightbox">&times;</button>',
      '<button class="lightbox__prev" aria-label="Previous image">&#8249;</button>',
      '<img class="lightbox__img" src="" alt="">',
      '<button class="lightbox__next" aria-label="Next image">&#8250;</button>'
    ].join('');

    document.body.appendChild(lightbox);
    lightboxImg = lightbox.querySelector('.lightbox__img');

    // Close button
    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);

    // Prev / Next
    lightbox.querySelector('.lightbox__prev').addEventListener('click', function (e) {
      e.stopPropagation();
      showLightboxAt(currentIndex - 1);
    });

    lightbox.querySelector('.lightbox__next').addEventListener('click', function (e) {
      e.stopPropagation();
      showLightboxAt(currentIndex + 1);
    });

    // Click backdrop to close
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        showLightboxAt(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        showLightboxAt(currentIndex + 1);
      }
    });
  }

  /* ============================================================
     LIGHTBOX CONTROLS
     ============================================================ */
  function openLightbox(photos, index) {
    currentPhotos = photos;
    currentIndex = index;
    showLightboxAt(currentIndex);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showLightboxAt(index) {
    if (currentPhotos.length === 0) return;
    // Wrap around
    if (index < 0) index = currentPhotos.length - 1;
    if (index >= currentPhotos.length) index = 0;
    currentIndex = index;

    var photo = currentPhotos[currentIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt || '';

    // Show/hide arrows based on count
    var prevBtn = lightbox.querySelector('.lightbox__prev');
    var nextBtn = lightbox.querySelector('.lightbox__next');
    if (currentPhotos.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = '';
      nextBtn.style.display = '';
    }
  }

  /* ============================================================
     HOME PAGE — GALLERY PREVIEW (featured photos, 2x2)
     ============================================================ */
  function renderGalleryPreview() {
    var container = document.getElementById('gallery-preview');
    if (!container) return;
    if (!window.SCP || !window.SCP.gallery || !window.SCP.gallery.photos) return;

    var homePage = window.SCP.gallery.homePage;
    var featured;
    if (homePage && homePage.length > 0) {
      var photoMap = {};
      window.SCP.gallery.photos.forEach(function (p) { photoMap[p.src] = p; });
      featured = homePage.map(function (src) { return photoMap[src]; }).filter(Boolean).slice(0, 4);
    } else {
      featured = window.SCP.gallery.photos.filter(function (p) {
        return p.featured === true && p.active !== false;
      }).slice(0, 4);
    }

    if (featured.length === 0) return;

    var html = '';
    featured.forEach(function (photo, i) {
      html += [
        '<div class="gallery-item" data-index="' + i + '" tabindex="0" role="button" aria-label="View photo: ' + photo.alt + '">',
        '  <img src="' + photo.src + '" alt="' + photo.alt + '" loading="lazy">',
        '  <div class="gallery-item__overlay"></div>',
        '</div>'
      ].join('\n');
    });

    container.innerHTML = html;

    // Attach click handlers
    var items = container.querySelectorAll('.gallery-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.getAttribute('data-index'), 10);
        openLightbox(featured, idx);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var idx = parseInt(item.getAttribute('data-index'), 10);
          openLightbox(featured, idx);
        }
      });
    });
  }

  /* ============================================================
     PORTFOLIO PAGE — FULL GALLERY WITH FILTER
     ============================================================ */
  var activeFilter = 'all';
  var allPhotos = [];

  function renderFullGallery() {
    var container = document.getElementById('gallery-grid');
    if (!container) return;
    if (!window.SCP || !window.SCP.gallery || !window.SCP.gallery.photos) return;

    allPhotos = window.SCP.gallery.photos.filter(function (p) {
      return p.active !== false;
    });

    renderFilterBar();
    renderGalleryItems(container, allPhotos);
  }

  function renderFilterBar() {
    var filterBar = document.getElementById('filter-bar');
    if (!filterBar) return;

    // Collect unique categories
    var categories = ['all'];
    allPhotos.forEach(function (photo) {
      if (photo.category && categories.indexOf(photo.category) === -1) {
        categories.push(photo.category);
      }
    });

    var categoryLabels = { all: 'All' };
    var definedCats = (window.SCP && window.SCP.gallery && window.SCP.gallery.categories) || [];
    definedCats.forEach(function (c) { categoryLabels[c.id] = c.label; });

    var html = '';
    categories.forEach(function (cat) {
      var label = categoryLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      var activeClass = cat === activeFilter ? ' active' : '';
      html += '<button class="filter-btn' + activeClass + '" data-category="' + cat + '">' + label + '</button>';
    });

    filterBar.innerHTML = html;

    // Attach filter button events
    var buttons = filterBar.querySelectorAll('.filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeFilter = btn.getAttribute('data-category');

        // Update active button
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        applyFilter();
      });
    });
  }

  function applyFilter() {
    var container = document.getElementById('gallery-grid');
    if (!container) return;

    var items = container.querySelectorAll('.gallery-item');
    var visiblePhotos = [];
    var visibleIndices = [];

    items.forEach(function (item) {
      var cat = item.getAttribute('data-category');
      if (activeFilter === 'all' || cat === activeFilter) {
        item.classList.remove('hidden');
        visiblePhotos.push(allPhotos[parseInt(item.getAttribute('data-photo-index'), 10)]);
        visibleIndices.push(parseInt(item.getAttribute('data-photo-index'), 10));
      } else {
        item.classList.add('hidden');
      }
    });

    // Re-bind lightbox to filtered set
    var visibleItems = container.querySelectorAll('.gallery-item:not(.hidden)');
    visibleItems.forEach(function (item, i) {
      // Remove old listeners by cloning
      var newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      var photoIdx = i;
      newItem.addEventListener('click', function () {
        openLightbox(visiblePhotos, photoIdx);
      });
      newItem.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(visiblePhotos, photoIdx);
        }
      });
    });
  }

  function renderGalleryItems(container, photos) {
    var html = '';
    photos.forEach(function (photo, i) {
      html += [
        '<div class="gallery-item" data-category="' + (photo.category || '') + '" data-photo-index="' + i + '" tabindex="0" role="button" aria-label="View photo: ' + photo.alt + '">',
        '  <img src="' + photo.src + '" alt="' + photo.alt + '" loading="lazy">',
        '  <div class="gallery-item__overlay"></div>',
        '</div>'
      ].join('\n');
    });

    container.innerHTML = html;

    // Attach click handlers — initial state (all visible)
    var items = container.querySelectorAll('.gallery-item');
    items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        openLightbox(photos, i);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(photos, i);
        }
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildLightbox();
    renderGalleryPreview();
    renderFullGallery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
