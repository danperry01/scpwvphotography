(function () {
  'use strict';

  /* ============================================================
     LIGHTBOX (inline — reuses gallery.js lightbox if available)
     ============================================================ */
  var lightbox = null;
  var lightboxImg = null;
  var currentPhotos = [];
  var currentIndex = 0;

  function buildLightbox() {
    // Reuse if gallery.js already built it
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

    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);

    lightbox.querySelector('.lightbox__prev').addEventListener('click', function (e) {
      e.stopPropagation();
      showLightboxAt(currentIndex - 1);
    });

    lightbox.querySelector('.lightbox__next').addEventListener('click', function (e) {
      e.stopPropagation();
      showLightboxAt(currentIndex + 1);
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

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
    if (index < 0) index = currentPhotos.length - 1;
    if (index >= currentPhotos.length) index = 0;
    currentIndex = index;

    var photo = currentPhotos[currentIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt || '';

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
     COLLECTIONS LISTING PAGE
     ============================================================ */
  function renderCollectionsGrid() {
    var grid = document.getElementById('collections-grid');
    if (!grid) return;
    if (!window.SCP || !window.SCP.collections) {
      grid.innerHTML = '<p style="color: var(--color-text-muted);">No collections yet. Check back soon.</p>';
      return;
    }

    var publicCollections = window.SCP.collections.filter(function (c) {
      return c.isPublic === true;
    });

    if (publicCollections.length === 0) {
      grid.innerHTML = '<p style="color: var(--color-text-muted);">No collections yet. Check back soon.</p>';
      return;
    }

    var html = '';
    publicCollections.forEach(function (c) {
      var photoCount = (c.photos && c.photos.length) ? c.photos.length : 0;
      var coverSrc = c.cover || '';
      var coverImg = coverSrc
        ? '<img src="' + coverSrc + '" alt="' + escapeHtml(c.name) + '" loading="lazy">'
        : '<div style="width:100%;height:100%;background:var(--color-bg);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:0.85rem;">No cover</div>';

      html += [
        '<a href="collection.html?id=' + encodeURIComponent(c.id) + '" class="collection-card">',
        '  <div class="collection-card__img-wrap">',
        '    ' + coverImg,
        '  </div>',
        '  <div class="collection-card__body">',
        '    <h3 class="collection-card__name">' + escapeHtml(c.name) + '</h3>',
        '    <p class="collection-card__date">' + escapeHtml(c.date || '') + '</p>',
        '    <p class="collection-card__count">' + photoCount + ' photo' + (photoCount !== 1 ? 's' : '') + '</p>',
        '  </div>',
        '</a>'
      ].join('\n');
    });

    grid.innerHTML = html;
  }

  /* ============================================================
     SINGLE COLLECTION VIEW PAGE
     ============================================================ */
  function renderCollectionView() {
    var container = document.getElementById('collection-view');
    if (!container) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var key = params.get('key');

    if (!id) {
      container.innerHTML = '<div class="container" style="padding: 4rem 1.5rem;"><p style="color: var(--color-text-muted);">Collection not found.</p></div>';
      return;
    }

    if (!window.SCP || !window.SCP.collections) {
      container.innerHTML = '<div class="container" style="padding: 4rem 1.5rem;"><p style="color: var(--color-text-muted);">Collection not found.</p></div>';
      return;
    }

    var collection = null;
    for (var i = 0; i < window.SCP.collections.length; i++) {
      if (window.SCP.collections[i].id === id) {
        collection = window.SCP.collections[i];
        break;
      }
    }

    if (!collection) {
      container.innerHTML = '<div class="container" style="padding: 4rem 1.5rem;"><p style="color: var(--color-text-muted);">Collection not found.</p></div>';
      return;
    }

    // Access check: if not public, require matching key
    if (!collection.isPublic && collection.key !== key) {
      container.innerHTML = [
        '<div class="container" style="padding: 4rem 1.5rem; text-align: center;">',
        '  <p style="font-size: 1.5rem; margin-bottom: 1rem;">&#128274;</p>',
        '  <p style="color: var(--color-text-muted);">This collection is private. You may need a different link.</p>',
        '</div>'
      ].join('\n');
      return;
    }

    // Render collection
    var photos = collection.photos || [];
    var photoCount = photos.length;

    // Build header
    var headerHtml = [
      '<div class="collection-view-header">',
      '  <h1 style="font-family: var(--font-serif); color: var(--color-navy); font-size: clamp(1.8rem, 4vw, 2.5rem); margin-bottom: 0.5rem;">' + escapeHtml(collection.name) + '</h1>',
      collection.date ? '  <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">' + escapeHtml(collection.date) + '</p>' : '',
      collection.description ? '  <p style="color: var(--color-text-muted); max-width: 560px; margin: 0 auto;">' + escapeHtml(collection.description) + '</p>' : '',
      '  <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 0.75rem;">' + photoCount + ' photo' + (photoCount !== 1 ? 's' : '') + '</p>',
      '</div>'
    ].join('\n');

    // Build photo grid
    var gridHtml = '';
    if (photos.length > 0) {
      gridHtml += '<div class="gallery-grid" id="collection-photo-grid" style="margin-bottom: 2.5rem;">';
      photos.forEach(function (photo, i) {
        gridHtml += [
          '<div class="gallery-item" data-col-index="' + i + '" tabindex="0" role="button" aria-label="View photo: ' + escapeHtml(photo.alt || '') + '">',
          '  <img src="' + photo.src + '" alt="' + escapeHtml(photo.alt || '') + '" loading="lazy">',
          '  <div class="gallery-item__overlay"></div>',
          '</div>'
        ].join('\n');
      });
      gridHtml += '</div>';
    } else {
      gridHtml = '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem 0;">No photos in this collection yet.</p>';
    }

    // Download button
    var downloadHtml = photos.length > 0 ? [
      '<div style="text-align: center; padding-bottom: 3rem;">',
      '  <button class="btn btn--outline-dark" id="download-all-btn">Download All Photos</button>',
      '</div>'
    ].join('\n') : '';

    container.innerHTML = [
      '<section class="page-hero">',
      '  <div class="container">',
      headerHtml,
      '  </div>',
      '</section>',
      '<section class="section">',
      '  <div class="container">',
      gridHtml,
      downloadHtml,
      '  </div>',
      '</section>'
    ].join('\n');

    // Attach lightbox to photos
    if (photos.length > 0) {
      var items = container.querySelectorAll('.gallery-item');
      items.forEach(function (item) {
        var idx = parseInt(item.getAttribute('data-col-index'), 10);
        item.addEventListener('click', function () {
          openLightbox(photos, idx);
        });
        item.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(photos, idx);
          }
        });
      });
    }

    // Download all button
    var dlBtn = document.getElementById('download-all-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        alert('Contact SCP Photography to request your full resolution files.');
      });
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildLightbox();

    if (document.getElementById('collections-grid')) {
      renderCollectionsGrid();
    }

    if (document.getElementById('collection-view')) {
      renderCollectionView();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
