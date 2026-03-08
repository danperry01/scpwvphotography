(function () {
  'use strict';

  /* ============================================================
     CONSTANTS
     ============================================================ */
  var REPO_OWNER    = 'danperry01';
  var REPO_NAME     = 'scpwvphotography';
  var CONTENT_FILE  = 'site/data/content.js';
  var PASSWORD_HASH = '9b351d271fabc1619d03c90efd214db39693793a3f8be72855bad0172c74402a';

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

  function slugify(str) {
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function showError(elId, msg) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
  }

  function hideError(elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
  }

  /* ============================================================
     DEPLOY BANNER
     ============================================================ */
  function showBanner(msg, type) {
    var banner = document.getElementById('deploy-banner');
    var msgEl  = document.getElementById('deploy-message');
    if (!banner || !msgEl) return;
    banner.className = 'deploy-banner' +
      (type === 'success' ? ' success' : type === 'error' ? ' error' : '');
    msgEl.textContent = msg;
    banner.style.display = 'block';
    // Only auto-dismiss success; errors stay until next action
    if (type === 'success') {
      setTimeout(function () { banner.style.display = 'none'; }, 5000);
    }
  }

  /* ============================================================
     GITHUB API HELPERS
     ============================================================ */
  function getToken() {
    return localStorage.getItem('scp_github_token');
  }

  async function readContentFile() {
    var res = await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + CONTENT_FILE,
      { headers: { Authorization: 'token ' + getToken(), Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error('Failed to read content file: ' + res.status);
    var json = await res.json();
    var bytes = Uint8Array.from(atob(json.content.replace(/\n/g, '')), function (c) { return c.charCodeAt(0); });
    var raw = new TextDecoder('utf-8').decode(bytes);
    var match = raw.match(/\/\* DATA_START \*\/\s*([\s\S]*?)\s*\/\* DATA_END \*\//);
    if (!match) throw new Error('Could not parse content.js format');
    return { data: JSON.parse(match[1]), sha: json.sha };
  }

  function buildContentJs(data) {
    return 'window.SCP = /* DATA_START */\n' + JSON.stringify(data, null, 2) + '\n/* DATA_END */;\n';
  }

  async function writeContentFile(data, sha, message) {
    var raw     = buildContentJs(data);
    var encoded = btoa(unescape(encodeURIComponent(raw)));
    var res = await fetch(
      'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + CONTENT_FILE,
      {
        method: 'PUT',
        headers: {
          Authorization: 'token ' + getToken(),
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message, content: encoded, sha: sha })
      }
    );
    if (!res.ok) {
      var errBody = await res.text();
      throw new Error('Failed to write content file: ' + res.status + ' ' + errBody);
    }
  }

  async function uploadImage(path, file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = async function (e) {
        try {
          var base64 = e.target.result.split(',')[1];
          var sha;
          var check = await fetch(
            'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path,
            { headers: { Authorization: 'token ' + getToken() } }
          );
          if (check.ok) {
            var checkJson = await check.json();
            sha = checkJson.sha;
          }
          var body = { message: 'Upload image: ' + path, content: base64 };
          if (sha) body.sha = sha;
          var res = await fetch(
            'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path,
            {
              method: 'PUT',
              headers: { Authorization: 'token ' + getToken(), 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            }
          );
          if (!res.ok) {
            var errBody = await res.text();
            reject(new Error('Upload failed: ' + res.status + ' ' + errBody));
          } else {
            resolve(path);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () { reject(new Error('FileReader error')); };
      reader.readAsDataURL(file);
    });
  }

  /* ============================================================
     AUTH — PASSWORD HASHING
     ============================================================ */
  async function hashPassword(password) {
    var encoder = new TextEncoder();
    var data    = encoder.encode(password);
    var hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    var hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /* ============================================================
     AUTH FLOW
     ============================================================ */
  function showPanel(panelId) {
    ['password-gate', 'token-gate', 'admin-panel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = (id === panelId) ? (id === 'admin-panel' ? 'block' : 'flex') : 'none';
    });
  }

  function checkAuth() {
    var authed = sessionStorage.getItem('scp_admin_auth') === '1';
    if (!authed) {
      showPanel('password-gate');
      return;
    }
    checkToken();
  }

  function checkToken() {
    var token = getToken();
    if (!token) {
      showPanel('token-gate');
      return;
    }
    showPanel('admin-panel');
    initAdmin();
  }

  function initPasswordGate() {
    var submitBtn  = document.getElementById('password-submit');
    var pwInput    = document.getElementById('admin-password');

    if (!submitBtn || !pwInput) return;

    var doCheck = async function () {
      var val = pwInput.value;
      if (!val) { showError('password-error', 'Please enter a password.'); return; }
      hideError('password-error');
      try {
        var hex = await hashPassword(val);
        if (hex === PASSWORD_HASH) {
          sessionStorage.setItem('scp_admin_auth', '1');
          checkToken();
        } else {
          showError('password-error', 'Incorrect password.');
          pwInput.value = '';
          pwInput.focus();
        }
      } catch (err) {
        showError('password-error', 'Error checking password.');
      }
    };

    submitBtn.addEventListener('click', doCheck);
    pwInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doCheck();
    });
  }

  function initTokenGate() {
    var submitBtn   = document.getElementById('token-submit');
    var tokenInput  = document.getElementById('github-token');

    if (!submitBtn || !tokenInput) return;

    var doSave = function () {
      var val = tokenInput.value.trim();
      if (!val) { showError('token-error', 'Please enter a valid token.'); return; }
      hideError('token-error');
      localStorage.setItem('scp_github_token', val);
      showPanel('admin-panel');
      initAdmin();
    };

    submitBtn.addEventListener('click', doSave);
    tokenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSave();
    });
  }

  function initLogout() {
    var btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      sessionStorage.removeItem('scp_admin_auth');
      window.location.reload();
    });
  }

  /* ============================================================
     TAB SWITCHING
     ============================================================ */
  function initTabs() {
    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var target = tab.getAttribute('data-tab');
        document.querySelectorAll('.admin-tab-content').forEach(function (panel) {
          panel.classList.remove('active');
        });
        var targetPanel = document.getElementById('tab-' + target);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  /* ============================================================
     HOME PAGE HIGHLIGHTS
     ============================================================ */
  var homeHighlights  = []; // ordered array of photo src strings (max 4)
  var pickerSlotIndex = null;

  function initHomeHighlights() {
    homeHighlights = ((window.SCP && window.SCP.gallery && window.SCP.gallery.homePage) || []).slice(0, 4);
    renderHomeHighlights();

    var cancelBtn = document.getElementById('photo-picker-cancel');
    var modal     = document.getElementById('photo-picker-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closePhotoPicker);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closePhotoPicker();
      });
    }
  }

  function renderHomeHighlights() {
    var grid = document.getElementById('home-highlights-grid');
    if (!grid) return;

    var photos   = (window.SCP && window.SCP.gallery && window.SCP.gallery.photos) || [];
    var photoMap = {};
    photos.forEach(function (p) { photoMap[p.src] = p; });

    var html = '';
    for (var i = 0; i < 4; i++) {
      var src   = homeHighlights[i];
      var photo = src ? photoMap[src] : null;

      if (photo) {
        var canLeft  = i > 0;
        var canRight = i < homeHighlights.length - 1;
        html += [
          '<div class="home-highlight-slot">',
          '  <div class="home-highlight-slot__num">' + (i + 1) + '</div>',
          '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" class="home-highlight-slot__img">',
          '  <div class="home-highlight-slot__actions">',
          canLeft  ? '<button class="hh-arrow" data-slot="' + i + '" data-dir="-1" title="Move left">&#8592;</button>' : '<span class="hh-arrow-placeholder"></span>',
          canRight ? '<button class="hh-arrow" data-slot="' + i + '" data-dir="1"  title="Move right">&#8594;</button>' : '<span class="hh-arrow-placeholder"></span>',
          '    <button class="hh-change" data-slot="' + i + '">Change</button>',
          '    <button class="hh-remove" data-slot="' + i + '" title="Remove">&times;</button>',
          '  </div>',
          '</div>'
        ].join('\n');
      } else {
        html += [
          '<div class="home-highlight-slot home-highlight-slot--empty">',
          '  <div class="home-highlight-slot__num">' + (i + 1) + '</div>',
          '  <button class="hh-add" data-slot="' + i + '">',
          '    <span style="font-size:1.75rem; line-height:1;">+</span>',
          '    <span>Add Photo</span>',
          '  </button>',
          '</div>'
        ].join('\n');
      }
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.hh-add, .hh-change').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openPhotoPicker(parseInt(btn.getAttribute('data-slot'), 10));
      });
    });

    grid.querySelectorAll('.hh-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        homeHighlights.splice(parseInt(btn.getAttribute('data-slot'), 10), 1);
        renderHomeHighlights();
        saveHomeHighlights();
      });
    });

    grid.querySelectorAll('.hh-arrow').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slot = parseInt(btn.getAttribute('data-slot'), 10);
        var dir  = parseInt(btn.getAttribute('data-dir'), 10);
        var tmp  = homeHighlights[slot];
        homeHighlights[slot]       = homeHighlights[slot + dir];
        homeHighlights[slot + dir] = tmp;
        renderHomeHighlights();
        saveHomeHighlights();
      });
    });
  }

  function openPhotoPicker(slotIndex) {
    pickerSlotIndex = slotIndex;
    var modal = document.getElementById('photo-picker-modal');
    var grid  = document.getElementById('photo-picker-grid');
    if (!modal || !grid) return;

    var photos = ((window.SCP && window.SCP.gallery && window.SCP.gallery.photos) || [])
      .filter(function (p) { return p.active !== false; });

    var html = '';
    photos.forEach(function (photo) {
      var isSelected = homeHighlights.indexOf(photo.src) !== -1;
      html += [
        '<div class="admin-photo-item photo-picker-item' + (isSelected ? ' photo-picker-item--selected' : '') + '" data-src="' + escapeHtml(photo.src) + '">',
        '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy">',
        '  <div class="admin-photo-item__label">' + escapeHtml(photo.alt || photo.src) + '</div>',
        isSelected ? '  <div class="photo-picker-check">&#10003;</div>' : '',
        '</div>'
      ].filter(Boolean).join('\n');
    });

    grid.innerHTML = html || '<p style="color:var(--color-text-muted);">No photos in gallery yet.</p>';

    grid.querySelectorAll('.photo-picker-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var src = item.getAttribute('data-src');
        // Remove if already in another slot
        var existing = homeHighlights.indexOf(src);
        if (existing !== -1) homeHighlights.splice(existing, 1);
        // Place at target slot
        homeHighlights.splice(pickerSlotIndex, 0, src);
        homeHighlights = homeHighlights.slice(0, 4);
        closePhotoPicker();
        renderHomeHighlights();
        saveHomeHighlights();
      });
    });

    modal.style.display = 'flex';
  }

  function closePhotoPicker() {
    var modal = document.getElementById('photo-picker-modal');
    if (modal) modal.style.display = 'none';
    pickerSlotIndex = null;
  }

  async function saveHomeHighlights() {
    var statusEl = document.getElementById('highlights-status');
    if (statusEl) {
      statusEl.textContent = 'Saving\u2026';
      statusEl.className   = 'upload-status';
      statusEl.style.display = 'block';
    }
    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery) data.gallery = {};
      data.gallery.homePage = homeHighlights.slice();

      await writeContentFile(data, sha, 'Update home page highlights');

      if (!window.SCP.gallery) window.SCP.gallery = {};
      window.SCP.gallery.homePage = homeHighlights.slice();

      if (statusEl) {
        statusEl.textContent = '\u2713 Saved. Site is rebuilding \u2014 live site updates in ~2 minutes.';
        statusEl.className   = 'upload-status upload-status--ok';
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = 'Error saving: ' + err.message;
        statusEl.className   = 'upload-status upload-status--error';
      }
    }
  }

  /* ============================================================
     GALLERY TAB
     ============================================================ */
  var gallerySelectedFile = null;
  var editingPhotoIndex   = null;

  function renderGalleryGrid() {
    var grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;
    var photos = (window.SCP && window.SCP.gallery && window.SCP.gallery.photos) || [];

    if (photos.length === 0) {
      grid.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No photos yet.</p>';
      return;
    }

    var html = '';
    photos.forEach(function (photo, i) {
      var isInactive = photo.active === false;
      html += [
        '<div class="admin-photo-item' + (isInactive ? ' admin-photo-item--inactive' : '') + '">',
        '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy">',
        isInactive ? '  <div class="admin-photo-item__hidden-badge">Hidden</div>' : '',
        '  <div class="admin-photo-item__label">' + escapeHtml(photo.alt || photo.src) + '</div>',
        '  <button class="admin-photo-item__edit-btn" data-index="' + i + '" title="Edit photo">&#9998;</button>',
        '  <button class="admin-photo-item__remove" data-index="' + i + '" title="Remove photo">&times;</button>',
        '</div>'
      ].filter(Boolean).join('\n');
    });

    grid.innerHTML = html;

    grid.querySelectorAll('.admin-photo-item__remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        removeGalleryPhoto(idx);
      });
    });

    grid.querySelectorAll('.admin-photo-item__edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        openPhotoEditModal(idx);
      });
    });
  }

  /* ============================================================
     PHOTO EDIT MODAL
     ============================================================ */
  function openPhotoEditModal(index) {
    var photos = (window.SCP && window.SCP.gallery && window.SCP.gallery.photos) || [];
    var photo  = photos[index];
    if (!photo) return;

    editingPhotoIndex = index;

    document.getElementById('photo-edit-preview').src    = photo.src;
    document.getElementById('photo-edit-alt').value      = photo.alt || '';
    document.getElementById('photo-edit-active').checked = photo.active !== false;
    populateCategorySelects(photo.category || '');

    hideError('photo-edit-error');
    document.getElementById('photo-edit-modal').style.display = 'flex';
  }

  function closePhotoEditModal() {
    document.getElementById('photo-edit-modal').style.display = 'none';
    editingPhotoIndex = null;
  }

  async function savePhotoEdit() {
    if (editingPhotoIndex === null) return;

    var alt      = document.getElementById('photo-edit-alt').value.trim();
    var category = document.getElementById('photo-edit-category').value;
    var active   = document.getElementById('photo-edit-active').checked;
    var saveBtn  = document.getElementById('photo-edit-save');

    hideError('photo-edit-error');
    saveBtn.disabled = true;
    showBanner('Saving changes...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery || !data.gallery.photos || !data.gallery.photos[editingPhotoIndex]) {
        throw new Error('Photo not found in data.');
      }

      data.gallery.photos[editingPhotoIndex].alt      = alt;
      data.gallery.photos[editingPhotoIndex].category = category;
      data.gallery.photos[editingPhotoIndex].active   = active;

      await writeContentFile(data, sha, 'Update photo metadata at index ' + editingPhotoIndex);

      // Update local state
      var local = window.SCP.gallery.photos[editingPhotoIndex];
      local.alt      = alt;
      local.category = category;
      local.active   = active;

      showBanner('Photo updated. Site deploying...', 'success');
      saveBtn.disabled = false;
      closePhotoEditModal();
      renderGalleryGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      showError('photo-edit-error', err.message);
      saveBtn.disabled = false;
    }
  }

  function initPhotoEditModal() {
    var saveBtn   = document.getElementById('photo-edit-save');
    var cancelBtn = document.getElementById('photo-edit-cancel');
    var modal     = document.getElementById('photo-edit-modal');

    if (saveBtn)   saveBtn.addEventListener('click', savePhotoEdit);
    if (cancelBtn) cancelBtn.addEventListener('click', closePhotoEditModal);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closePhotoEditModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        closePhotoEditModal();
      }
    });
  }

  function initGalleryUpload() {
    var uploadArea    = document.getElementById('gallery-upload-area');
    var fileInput     = document.getElementById('gallery-file-input');
    var browseLink    = document.getElementById('gallery-browse-link');
    var placeholder   = document.getElementById('gallery-upload-placeholder');
    var previewWrap   = document.getElementById('gallery-preview-wrap');
    var previewImg    = document.getElementById('gallery-preview-img');
    var uploadBtn     = document.getElementById('add-gallery-photo');

    if (!uploadArea || !fileInput) return;

    browseLink.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });

    uploadArea.addEventListener('click', function () {
      if (gallerySelectedFile) return;
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function () {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      var file = e.dataTransfer.files[0];
      if (file) handleGalleryFileSelect(file);
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) handleGalleryFileSelect(fileInput.files[0]);
    });

    function handleGalleryFileSelect(file) {
      if (!file.type.match(/image\//)) {
        showError('gallery-error', 'Please select an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError('gallery-error', 'File is too large. Max 10MB.');
        return;
      }
      hideError('gallery-error');
      gallerySelectedFile = file;
      uploadBtn.disabled  = false;

      var reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        placeholder.style.display = 'none';
        previewWrap.style.display  = 'block';
      };
      reader.readAsDataURL(file);
    }

    uploadBtn.addEventListener('click', addGalleryPhoto);
  }

  function setGalleryStatus(msg, isError) {
    var el = document.getElementById('gallery-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'upload-status' + (isError ? ' upload-status--error' : ' upload-status--ok');
    el.style.display = msg ? 'block' : 'none';
  }

  async function addGalleryPhoto() {
    if (!gallerySelectedFile) return;

    var category  = document.getElementById('gallery-category').value;
    var alt       = document.getElementById('gallery-alt').value.trim();
    var uploadBtn = document.getElementById('add-gallery-photo');

    hideError('gallery-error');
    setGalleryStatus('');
    uploadBtn.disabled    = true;
    uploadBtn.textContent = 'Step 1/2: Uploading image…';

    try {
      var originalName = gallerySelectedFile.name;
      var ext = originalName.lastIndexOf('.') !== -1
        ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
        : '.jpg';
      var baseName = slugify(originalName.replace(/\.[^.]+$/, '')) || 'photo-' + Date.now();
      var filename = baseName + '-' + Date.now() + ext;
      var path = 'site/assets/images/gallery/' + category + '/' + filename;

      await uploadImage(path, gallerySelectedFile);

      uploadBtn.textContent = 'Step 2/2: Saving changes…';

      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery) data.gallery = {};
      if (!data.gallery.photos) data.gallery.photos = [];

      var newPhoto = {
        src: 'assets/images/gallery/' + category + '/' + filename,
        alt: alt || filename,
        category: category
      };

      data.gallery.photos.push(newPhoto);
      await writeContentFile(data, sha, 'Add gallery photo: ' + filename);

      // Update local state
      if (!window.SCP.gallery) window.SCP.gallery = {};
      if (!window.SCP.gallery.photos) window.SCP.gallery.photos = [];
      window.SCP.gallery.photos.push(newPhoto);

      setGalleryStatus('✓ Photo saved! The site is rebuilding — changes will appear in about 2 minutes.');
      resetGalleryForm();
      renderGalleryGrid();
    } catch (err) {
      console.error(err);
      setGalleryStatus('Upload failed: ' + err.message, true);
      showError('gallery-error', err.message);
      uploadBtn.disabled    = false;
      uploadBtn.textContent = 'Upload Photo';
    }
  }

  function resetGalleryForm() {
    gallerySelectedFile = null;
    var fileInput    = document.getElementById('gallery-file-input');
    var placeholder  = document.getElementById('gallery-upload-placeholder');
    var previewWrap  = document.getElementById('gallery-preview-wrap');
    var previewImg   = document.getElementById('gallery-preview-img');
    var altInput     = document.getElementById('gallery-alt');
    var uploadBtn    = document.getElementById('add-gallery-photo');
    if (fileInput)   fileInput.value = '';
    if (placeholder) placeholder.style.display = 'block';
    if (previewWrap) previewWrap.style.display  = 'none';
    if (previewImg)  previewImg.src = '';
    if (altInput)    altInput.value = '';
    if (uploadBtn)   { uploadBtn.disabled = true; uploadBtn.textContent = 'Upload Photo'; }
  }

  async function removeGalleryPhoto(index) {
    if (!confirm('Remove this photo from the gallery?')) return;

    showBanner('Removing photo...', 'loading');
    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery || !data.gallery.photos) throw new Error('Gallery not found.');
      data.gallery.photos.splice(index, 1);

      await writeContentFile(data, sha, 'Remove gallery photo at index ' + index);

      window.SCP.gallery.photos.splice(index, 1);
      showBanner('Photo removed. Site deploying...', 'success');
      renderGalleryGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  /* ============================================================
     COLLECTIONS TAB
     ============================================================ */
  var currentCollectionId   = null;
  var colUploadQueue        = []; // [{file, altText}]

  function renderCollectionsList() {
    var list = document.getElementById('admin-collections-list');
    if (!list) return;
    var collections = (window.SCP && window.SCP.collections) || [];

    if (collections.length === 0) {
      list.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No collections yet. Click "+ New Collection" to get started.</p>';
      return;
    }

    var html = '';
    collections.forEach(function (col) {
      var photoCount = (col.photos && col.photos.length) || 0;
      var isPublic   = col.isPublic === true;
      var coverImg   = col.cover
        ? '<img src="' + escapeHtml(col.cover) + '" alt="" class="admin-collection-item__cover">'
        : '<div class="admin-collection-item__cover-placeholder">No cover</div>';

      html += [
        '<div class="admin-collection-item" data-col-id="' + escapeHtml(col.id) + '">',
        '  ' + coverImg,
        '  <div class="admin-collection-item__info">',
        '    <div class="admin-collection-item__name">' + escapeHtml(col.name) + '</div>',
        '    <div class="admin-collection-item__meta">' + escapeHtml(col.date || '') + (col.date ? ' &middot; ' : '') + photoCount + ' photo' + (photoCount !== 1 ? 's' : '') + '</div>',
        '  </div>',
        '  <span class="admin-collection-item__badge ' + (isPublic ? 'badge-public' : 'badge-private') + '">' + (isPublic ? 'Public' : 'Private') + '</span>',
        '</div>'
      ].join('\n');
    });

    list.innerHTML = html;

    list.querySelectorAll('.admin-collection-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = item.getAttribute('data-col-id');
        var col = findCollectionById(id);
        if (col) openCollectionEdit(col);
      });
    });
  }

  function findCollectionById(id) {
    var collections = (window.SCP && window.SCP.collections) || [];
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].id === id) return collections[i];
    }
    return null;
  }

  function generateId(name) {
    var base    = slugify(name) || 'collection';
    var suffix  = Math.random().toString(36).substring(2, 6);
    return base + '-' + suffix;
  }

  function generateKey() {
    return Math.random().toString(36).substring(2, 10);
  }

  function openCollectionEdit(col) {
    currentCollectionId = col ? col.id : null;
    colUploadQueue      = [];

    var editView  = document.getElementById('collection-edit-view');
    var listView  = document.getElementById('collections-list-view');
    var titleEl   = document.getElementById('collection-edit-title');
    var nameInput = document.getElementById('col-name');
    var dateInput = document.getElementById('col-date');
    var descInput = document.getElementById('col-desc');
    var pubCb     = document.getElementById('col-public');
    var linkWrap  = document.getElementById('col-link-wrap');
    var photosSection = document.getElementById('collection-photos-section');

    if (!editView || !listView) return;

    listView.style.display = 'none';
    editView.style.display = 'block';
    hideError('collection-error');

    if (col) {
      titleEl.textContent   = 'Edit Collection';
      nameInput.value       = col.name || '';
      dateInput.value       = col.date || '';
      descInput.value       = col.description || '';
      pubCb.checked         = col.isPublic === true;
      photosSection.style.display = 'block';
      renderCollectionPhotos(col.id);
    } else {
      // New collection
      titleEl.textContent   = 'New Collection';
      nameInput.value       = '';
      dateInput.value       = '';
      descInput.value       = '';
      pubCb.checked         = false;
      photosSection.style.display = 'none';
      document.getElementById('admin-col-photos-grid').innerHTML = '';
      document.getElementById('col-upload-queue').innerHTML      = '';
      document.getElementById('upload-col-photos-btn').style.display = 'none';
    }

    // Show/hide shareable link based on public state
    updateShareableLink(col);
    linkWrap.style.display = 'block'; // always show after save
    if (!col) linkWrap.style.display = 'none';
  }

  function updateShareableLink(col) {
    if (!col) return;
    var linkInput = document.getElementById('col-link');
    if (!linkInput) return;
    var base = window.location.origin + '/collection.html';
    var link = col.isPublic
      ? base + '?id=' + encodeURIComponent(col.id)
      : base + '?id=' + encodeURIComponent(col.id) + '&key=' + encodeURIComponent(col.key || '');
    linkInput.value = link;
  }

  function initCollectionsTab() {
    var newBtn     = document.getElementById('new-collection-btn');
    var backBtn    = document.getElementById('back-to-collections');
    var savBtn     = document.getElementById('save-collection-btn');
    var pubCb      = document.getElementById('col-public');
    var copyBtn    = document.getElementById('copy-col-link');
    var delBtn     = document.getElementById('delete-collection-btn');

    if (newBtn) {
      newBtn.addEventListener('click', function () {
        openCollectionEdit(null);
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        document.getElementById('collection-edit-view').style.display = 'none';
        document.getElementById('collections-list-view').style.display = 'block';
        currentCollectionId = null;
        colUploadQueue      = [];
        renderCollectionsList();
      });
    }

    if (savBtn) {
      savBtn.addEventListener('click', saveCollection);
    }

    if (pubCb) {
      pubCb.addEventListener('change', function () {
        var col = findCollectionById(currentCollectionId);
        if (col) {
          col.isPublic = pubCb.checked;
          updateShareableLink(col);
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var linkInput = document.getElementById('col-link');
        if (!linkInput || !linkInput.value) return;
        navigator.clipboard.writeText(linkInput.value).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(function () {
          // Fallback
          linkInput.select();
          document.execCommand('copy');
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        });
      });
    }

    if (delBtn) {
      delBtn.addEventListener('click', deleteCollection);
    }

    // Collection photo upload
    initCollectionPhotoUpload();
  }

  async function saveCollection() {
    var nameInput = document.getElementById('col-name');
    var dateInput = document.getElementById('col-date');
    var descInput = document.getElementById('col-desc');
    var pubCb     = document.getElementById('col-public');
    var savBtn    = document.getElementById('save-collection-btn');
    var linkWrap  = document.getElementById('col-link-wrap');
    var photosSection = document.getElementById('collection-photos-section');

    hideError('collection-error');

    var name = nameInput.value.trim();
    if (!name) {
      showError('collection-error', 'Collection name is required.');
      return;
    }

    savBtn.disabled = true;
    showBanner('Saving collection...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.collections) data.collections = [];

      var isNew = !currentCollectionId;
      var col;

      if (isNew) {
        // Generate new collection
        var newId  = generateId(name);
        var newKey = generateKey();
        col = {
          id:          newId,
          name:        name,
          date:        dateInput.value.trim(),
          description: descInput.value.trim(),
          cover:       '',
          isPublic:    pubCb.checked,
          key:         newKey,
          photos:      []
        };
        data.collections.push(col);
        currentCollectionId = newId;
      } else {
        // Update existing
        for (var i = 0; i < data.collections.length; i++) {
          if (data.collections[i].id === currentCollectionId) {
            data.collections[i].name        = name;
            data.collections[i].date        = dateInput.value.trim();
            data.collections[i].description = descInput.value.trim();
            data.collections[i].isPublic    = pubCb.checked;
            col = data.collections[i];
            break;
          }
        }
        if (!col) throw new Error('Collection not found in data.');
      }

      await writeContentFile(data, sha, (isNew ? 'Create' : 'Update') + ' collection: ' + name);

      // Update local window.SCP
      if (!window.SCP.collections) window.SCP.collections = [];
      if (isNew) {
        window.SCP.collections.push(col);
      } else {
        for (var j = 0; j < window.SCP.collections.length; j++) {
          if (window.SCP.collections[j].id === currentCollectionId) {
            window.SCP.collections[j].name        = col.name;
            window.SCP.collections[j].date        = col.date;
            window.SCP.collections[j].description = col.description;
            window.SCP.collections[j].isPublic    = col.isPublic;
            break;
          }
        }
      }

      showBanner('Collection saved! Site deploying...', 'success');
      savBtn.disabled = false;

      // Show shareable link and photos section
      linkWrap.style.display    = 'block';
      photosSection.style.display = 'block';
      updateShareableLink(col);
      renderCollectionPhotos(currentCollectionId);

      if (isNew) {
        document.getElementById('collection-edit-title').textContent = 'Edit Collection';
      }
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      showError('collection-error', err.message);
      savBtn.disabled = false;
    }
  }

  function renderCollectionPhotos(collectionId) {
    var grid = document.getElementById('admin-col-photos-grid');
    if (!grid) return;

    var col = findCollectionById(collectionId);
    var photos = (col && col.photos) || [];
    var currentCover = col ? (col.cover || '') : '';

    if (photos.length === 0) {
      grid.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.85rem;">No photos uploaded yet.</p>';
      return;
    }

    var html = '';
    photos.forEach(function (photo, i) {
      var isCover = photo.src === currentCover;
      html += [
        '<div class="admin-photo-item' + (isCover ? ' admin-photo-item--is-cover' : '') + '">',
        '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt || '') + '" loading="lazy">',
        isCover ? '  <div class="admin-photo-item__cover-badge">Cover</div>' : '',
        '  <div class="admin-photo-item__label">' + escapeHtml(photo.alt || photo.src) + '</div>',
        '  <button class="admin-photo-item__remove" data-index="' + i + '" title="Remove">&times;</button>',
        isCover ? '' : '  <button class="admin-photo-item__set-cover" data-index="' + i + '" title="Set as cover">Set Cover</button>',
        '</div>'
      ].join('\n');
    });
    grid.innerHTML = html;

    grid.querySelectorAll('.admin-photo-item__remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        removeCollectionPhoto(collectionId, idx);
      });
    });

    grid.querySelectorAll('.admin-photo-item__set-cover').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        setCollectionCover(collectionId, photos[idx].src);
      });
    });
  }

  async function setCollectionCover(collectionId, src) {
    showBanner('Setting cover...', 'loading');
    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      for (var i = 0; i < data.collections.length; i++) {
        if (data.collections[i].id === collectionId) {
          data.collections[i].cover = src;
          break;
        }
      }

      await writeContentFile(data, sha, 'Set cover for collection: ' + collectionId);

      var localCol = findCollectionById(collectionId);
      if (localCol) localCol.cover = src;

      showBanner('Cover updated! Site deploying...', 'success');
      renderCollectionPhotos(collectionId);
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  async function removeCollectionPhoto(collectionId, index) {
    if (!confirm('Remove this photo from the collection?')) return;

    showBanner('Removing photo...', 'loading');
    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      for (var i = 0; i < data.collections.length; i++) {
        if (data.collections[i].id === collectionId) {
          data.collections[i].photos.splice(index, 1);
          // Update cover if needed
          if (data.collections[i].photos.length > 0) {
            data.collections[i].cover = data.collections[i].photos[0].src;
          } else {
            data.collections[i].cover = '';
          }
          break;
        }
      }

      await writeContentFile(data, sha, 'Remove photo from collection: ' + collectionId);

      // Update local
      var localCol = findCollectionById(collectionId);
      if (localCol) {
        localCol.photos.splice(index, 1);
        localCol.cover = localCol.photos.length > 0 ? localCol.photos[0].src : '';
      }

      showBanner('Photo removed. Site deploying...', 'success');
      renderCollectionPhotos(collectionId);
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  function initCollectionPhotoUpload() {
    var uploadArea = document.getElementById('col-upload-area');
    var fileInput  = document.getElementById('col-file-input');
    var browseLink = document.getElementById('col-browse-link');
    var queueGrid  = document.getElementById('col-upload-queue');
    var uploadBtn  = document.getElementById('upload-col-photos-btn');

    if (!uploadArea || !fileInput) return;

    browseLink.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });

    uploadArea.addEventListener('click', function () {
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function () {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      addFilesToQueue(Array.from(e.dataTransfer.files));
    });

    fileInput.addEventListener('change', function () {
      addFilesToQueue(Array.from(fileInput.files));
      fileInput.value = '';
    });

    if (uploadBtn) {
      uploadBtn.addEventListener('click', uploadCollectionPhotos);
    }
  }

  function addFilesToQueue(files) {
    var queueGrid = document.getElementById('col-upload-queue');
    var uploadBtn = document.getElementById('upload-col-photos-btn');

    files.forEach(function (file) {
      if (!file.type.match(/image\//)) return;
      var entry = { file: file, altText: '' };
      colUploadQueue.push(entry);

      var item = document.createElement('div');
      item.className = 'upload-queue-item';

      var img = document.createElement('img');
      var altInput = document.createElement('input');
      altInput.type        = 'text';
      altInput.placeholder = 'Caption / alt text';
      altInput.className   = 'upload-queue-item__alt';
      altInput.addEventListener('input', function () {
        entry.altText = altInput.value;
      });

      var removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.className   = 'upload-queue-item__remove';
      removeBtn.addEventListener('click', function () {
        var idx = colUploadQueue.indexOf(entry);
        if (idx !== -1) colUploadQueue.splice(idx, 1);
        item.parentNode.removeChild(item);
        if (colUploadQueue.length === 0) uploadBtn.style.display = 'none';
      });

      var reader = new FileReader();
      reader.onload = function (e) { img.src = e.target.result; };
      reader.readAsDataURL(file);

      item.appendChild(img);
      item.appendChild(altInput);
      item.appendChild(removeBtn);
      queueGrid.appendChild(item);
    });

    if (uploadBtn && colUploadQueue.length > 0) {
      uploadBtn.style.display = 'inline-flex';
    }
  }

  async function uploadCollectionPhotos() {
    if (!currentCollectionId) {
      alert('Please save the collection first before uploading photos.');
      return;
    }
    if (colUploadQueue.length === 0) return;

    var uploadBtn   = document.getElementById('upload-col-photos-btn');
    var statusEl    = document.getElementById('col-upload-status');
    var total       = colUploadQueue.length;

    function setColStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className   = 'upload-status' + (isError ? ' upload-status--error' : ' upload-status--ok');
      statusEl.style.display = msg ? 'block' : 'none';
    }

    uploadBtn.disabled = true;
    setColStatus('');

    try {
      var newPhotos = [];

      for (var i = 0; i < colUploadQueue.length; i++) {
        var entry    = colUploadQueue[i];
        var file     = entry.file;
        var altText  = entry.altText.trim();
        var ext      = file.name.lastIndexOf('.') !== -1
          ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
          : '.jpg';
        var baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'photo';
        var filename = baseName + '-' + Date.now() + '-' + i + ext;
        var path     = 'site/assets/images/collections/' + currentCollectionId + '/' + filename;

        uploadBtn.textContent = 'Step ' + (i + 1) + '/' + (total + 1) + ': Uploading photo ' + (i + 1) + ' of ' + total + '\u2026';
        await uploadImage(path, file);

        newPhotos.push({
          src: 'assets/images/collections/' + currentCollectionId + '/' + filename,
          alt: altText || filename
        });
      }

      // Write to content.js
      uploadBtn.textContent = 'Step ' + (total + 1) + '/' + (total + 1) + ': Saving changes\u2026';
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      for (var j = 0; j < data.collections.length; j++) {
        if (data.collections[j].id === currentCollectionId) {
          if (!data.collections[j].photos) data.collections[j].photos = [];
          newPhotos.forEach(function (p) { data.collections[j].photos.push(p); });
          // Set cover if not already set
          if (!data.collections[j].cover && data.collections[j].photos.length > 0) {
            data.collections[j].cover = data.collections[j].photos[0].src;
          }
          break;
        }
      }

      await writeContentFile(data, sha, 'Add ' + newPhotos.length + ' photo(s) to collection: ' + currentCollectionId);

      // Update local window.SCP
      var localCol = findCollectionById(currentCollectionId);
      if (localCol) {
        if (!localCol.photos) localCol.photos = [];
        newPhotos.forEach(function (p) { localCol.photos.push(p); });
        if (!localCol.cover && localCol.photos.length > 0) {
          localCol.cover = localCol.photos[0].src;
        }
      }

      showBanner('Photos uploaded. Site deploying...', 'success');
      setColStatus('\u2713 ' + total + ' photo' + (total !== 1 ? 's' : '') + ' saved! The site is rebuilding \u2014 changes will appear in about 2 minutes.');

      // Clear queue
      colUploadQueue = [];
      document.getElementById('col-upload-queue').innerHTML = '';
      uploadBtn.style.display = 'none';
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Selected Photos';

      renderCollectionPhotos(currentCollectionId);
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      setColStatus('Upload failed: ' + err.message, true);
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Selected Photos';
    }
  }

  async function deleteCollection() {
    var col = findCollectionById(currentCollectionId);
    var name = (col && col.name) ? col.name : 'this collection';

    if (!confirm('Permanently delete "' + name + '"? This cannot be undone.')) return;

    showBanner('Deleting collection...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      data.collections = data.collections.filter(function (c) {
        return c.id !== currentCollectionId;
      });

      await writeContentFile(data, sha, 'Delete collection: ' + currentCollectionId);

      window.SCP.collections = window.SCP.collections.filter(function (c) {
        return c.id !== currentCollectionId;
      });

      showBanner('Collection deleted. Site deploying...', 'success');

      // Go back to list
      document.getElementById('collection-edit-view').style.display = 'none';
      document.getElementById('collections-list-view').style.display = 'block';
      currentCollectionId = null;
      colUploadQueue      = [];
      renderCollectionsList();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  /* ============================================================
     SERVICES TAB
     ============================================================ */
  function renderServicesGrid() {
    var grid = document.getElementById('admin-services-grid');
    if (!grid) return;
    var services = (window.SCP && window.SCP.services) || [];

    if (services.length === 0) {
      grid.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No services yet. Add one using the form above.</p>';
      return;
    }

    var html = '';
    services.forEach(function (service, idx) {
      var imgSrc = service.image || '';
      html += [
        '<div class="admin-service-card">',
        '  <div class="admin-service-card__cover">',
        imgSrc
          ? '    <img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(service.name) + '" class="admin-service-card__img">'
          : '    <div class="admin-service-card__no-cover">No cover image</div>',
        '    <input type="file" id="svc-file-' + idx + '" accept="image/*" style="display:none">',
        '    <button class="btn btn--outline-dark admin-service-card__replace-btn" data-svc-index="' + idx + '">Replace Cover</button>',
        '  </div>',
        '  <div class="admin-service-card__body">',
        '    <div class="form-group" style="margin-bottom:0.6rem;">',
        '      <label style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">Service Name</label>',
        '      <input type="text" id="svc-name-' + idx + '" value="' + escapeHtml(service.name) + '">',
        '    </div>',
        '    <div style="display:flex; gap:0.5rem;">',
        '      <div class="form-group" style="flex:1; margin-bottom:0.6rem;">',
        '        <label style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">Prefix</label>',
        '        <input type="text" id="svc-prefix-' + idx + '" value="' + escapeHtml(service.pricePrefix || '$') + '" placeholder="$">',
        '      </div>',
        '      <div class="form-group" style="flex:2; margin-bottom:0.6rem;">',
        '        <label style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">Price</label>',
        '        <input type="text" id="svc-price-' + idx + '" value="' + escapeHtml(service.price || '') + '" placeholder="100">',
        '      </div>',
        '    </div>',
        '    <div class="form-group" style="margin-bottom:0.75rem;">',
        '      <label style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em;">Description</label>',
        '      <textarea id="svc-desc-' + idx + '" rows="3" style="resize:vertical;">' + escapeHtml(service.description || '') + '</textarea>',
        '    </div>',
        '    <div style="display:flex; gap:0.5rem;">',
        '      <button class="btn btn--primary" data-svc-save="' + idx + '" style="flex:1; font-size:0.85rem; padding:0.5rem 1rem;">Save</button>',
        '      <button class="btn btn--outline-dark" data-svc-remove="' + escapeHtml(service.id) + '" style="font-size:0.85rem; padding:0.5rem 0.75rem; border-color:#dc2626; color:#dc2626;">Remove</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('\n');
    });

    grid.innerHTML = html;

    grid.querySelectorAll('[data-svc-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-svc-index'), 10);
        document.getElementById('svc-file-' + idx).click();
      });
    });

    services.forEach(function (service, idx) {
      var fileInput = document.getElementById('svc-file-' + idx);
      if (!fileInput) return;
      fileInput.addEventListener('change', function () {
        if (fileInput.files[0]) updateServiceCover(idx, fileInput.files[0]);
      });
    });

    grid.querySelectorAll('[data-svc-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-svc-save'), 10);
        saveServiceDetails(idx, btn);
      });
    });

    grid.querySelectorAll('[data-svc-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeService(btn.getAttribute('data-svc-remove'));
      });
    });
  }

  async function saveServiceDetails(serviceIndex, btn) {
    var service = (window.SCP && window.SCP.services && window.SCP.services[serviceIndex]);
    if (!service) return;

    var name   = (document.getElementById('svc-name-' + serviceIndex) || {}).value.trim();
    var prefix = (document.getElementById('svc-prefix-' + serviceIndex) || {}).value.trim();
    var price  = (document.getElementById('svc-price-' + serviceIndex) || {}).value.trim();
    var desc   = (document.getElementById('svc-desc-' + serviceIndex) || {}).value.trim();

    if (!name) { showBanner('Service name cannot be empty.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Saving\u2026';

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      var svcIdx = data.services.findIndex(function (s) { return s.id === service.id; });
      if (svcIdx === -1) throw new Error('Service not found in data.');

      data.services[svcIdx].name        = name;
      data.services[svcIdx].pricePrefix = prefix;
      data.services[svcIdx].price       = price;
      data.services[svcIdx].description = desc;

      await writeContentFile(data, sha, 'Update service details: ' + service.id);

      window.SCP.services[serviceIndex].name        = name;
      window.SCP.services[serviceIndex].pricePrefix = prefix;
      window.SCP.services[serviceIndex].price       = price;
      window.SCP.services[serviceIndex].description = desc;

      showBanner('Service updated! Site deploying...', 'success');
      btn.textContent = '\u2713 Saved';
      setTimeout(function () { btn.disabled = false; btn.textContent = 'Save Details'; }, 2000);
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Details';
    }
  }

  async function updateServiceCover(serviceIndex, file) {
    var service = (window.SCP && window.SCP.services && window.SCP.services[serviceIndex]);
    if (!service) return;

    var btn = document.querySelector('[data-svc-index="' + serviceIndex + '"]');
    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Step 1/2: Uploading\u2026'; }

      var ext      = file.name.lastIndexOf('.') !== -1
        ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        : '.jpg';
      var filename = service.id + '-cover' + ext;
      var path     = 'site/assets/images/gallery/' + service.id + '/' + filename;

      await uploadImage(path, file);

      if (btn) btn.textContent = 'Step 2/2: Saving\u2026';

      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      var svcIdx = data.services.findIndex(function (s) { return s.id === service.id; });
      if (svcIdx === -1) throw new Error('Service not found in data.');
      data.services[svcIdx].image = 'assets/images/gallery/' + service.id + '/' + filename;

      await writeContentFile(data, sha, 'Update service cover: ' + service.id);

      window.SCP.services[serviceIndex].image = data.services[svcIdx].image;

      showBanner('Service cover updated! Site deploying...', 'success');
      renderServicesGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Replace Cover'; }
    }
  }

  async function addService() {
    var nameInput = document.getElementById('new-service-name');
    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) { showError('service-add-error', 'Please enter a service name.'); return; }

    var id = slugify(name);
    if (!id) { showError('service-add-error', 'Invalid service name.'); return; }

    var services = (window.SCP && window.SCP.services) || [];
    if (services.find(function (s) { return s.id === id; })) {
      showError('service-add-error', 'A service with that name already exists.');
      return;
    }

    hideError('service-add-error');
    showBanner('Adding service...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.services) data.services = [];
      var newService = { id: id, name: name, price: '100', pricePrefix: '$', image: '', description: '' };
      data.services.push(newService);

      await writeContentFile(data, sha, 'Add service: ' + name);

      if (!window.SCP.services) window.SCP.services = [];
      window.SCP.services.push(newService);

      nameInput.value = '';
      showBanner('Service added. Site deploying...', 'success');
      renderServicesGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      showError('service-add-error', err.message);
    }
  }

  async function removeService(id) {
    var services = (window.SCP && window.SCP.services) || [];
    var svc = services.find(function (s) { return s.id === id; });
    var label = svc ? svc.name : id;
    if (!confirm('Remove service "' + label + '"? This only removes it from the site — no photos are deleted.')) return;

    showBanner('Removing service...', 'loading');
    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (data.services) data.services = data.services.filter(function (s) { return s.id !== id; });

      await writeContentFile(data, sha, 'Remove service: ' + id);

      if (window.SCP.services) window.SCP.services = window.SCP.services.filter(function (s) { return s.id !== id; });

      showBanner('Service removed. Site deploying...', 'success');
      renderServicesGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  function initServicesAdmin() {
    var addBtn = document.getElementById('add-service-btn');
    var input  = document.getElementById('new-service-name');
    if (addBtn) addBtn.addEventListener('click', addService);
    if (input)  input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addService();
    });
    renderServicesGrid();
  }

  /* ============================================================
     GALLERY CATEGORIES
     ============================================================ */
  function getCategories() {
    return (window.SCP && window.SCP.gallery && window.SCP.gallery.categories) || [];
  }

  function populateCategorySelects(selectedValue) {
    var cats = getCategories();
    var selects = [
      document.getElementById('gallery-category'),
      document.getElementById('photo-edit-category')
    ];
    selects.forEach(function (sel) {
      if (!sel) return;
      var current = selectedValue !== undefined ? selectedValue : sel.value;
      sel.innerHTML = cats.map(function (c) {
        return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.label) + '</option>';
      }).join('');
      if (current) sel.value = current;
    });
  }

  function renderCategoriesAdmin() {
    var list = document.getElementById('admin-categories-list');
    if (!list) return;
    var cats = getCategories();
    if (cats.length === 0) {
      list.innerHTML = '<p style="color:var(--color-text-muted); font-size:0.9rem;">No categories yet.</p>';
      return;
    }
    list.innerHTML = cats.map(function (c) {
      return [
        '<div class="category-chip">',
        '  <span>' + escapeHtml(c.label) + '</span>',
        '  <button class="category-chip__remove" data-id="' + escapeHtml(c.id) + '" title="Remove category">&times;</button>',
        '</div>'
      ].join('');
    }).join('');

    list.querySelectorAll('.category-chip__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeCategory(btn.getAttribute('data-id'));
      });
    });
  }

  async function addCategory() {
    var input = document.getElementById('new-category-input');
    var label = input ? input.value.trim() : '';
    if (!label) { showError('category-error', 'Please enter a category name.'); return; }

    var id = slugify(label);
    if (!id) { showError('category-error', 'Invalid category name.'); return; }

    var cats = getCategories();
    if (cats.some(function (c) { return c.id === id; })) {
      showError('category-error', 'A category with that name already exists.');
      return;
    }

    hideError('category-error');
    showBanner('Saving category...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery) data.gallery = {};
      if (!data.gallery.categories) data.gallery.categories = [];
      data.gallery.categories.push({ id: id, label: label });

      await writeContentFile(data, sha, 'Add gallery category: ' + label);

      if (!window.SCP.gallery) window.SCP.gallery = {};
      if (!window.SCP.gallery.categories) window.SCP.gallery.categories = [];
      window.SCP.gallery.categories.push({ id: id, label: label });

      input.value = '';
      showBanner('Category added. Site deploying...', 'success');
      renderCategoriesAdmin();
      populateCategorySelects();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      showError('category-error', err.message);
    }
  }

  async function removeCategory(id) {
    var photos = (window.SCP && window.SCP.gallery && window.SCP.gallery.photos) || [];
    var inUse  = photos.some(function (p) { return p.category === id; });
    var cats   = getCategories();
    var cat    = cats.find(function (c) { return c.id === id; });
    var label  = cat ? cat.label : id;

    var msg = inUse
      ? 'Photos are currently assigned to "' + label + '". Removing it won\'t delete the photos, but they will have no category filter. Continue?'
      : 'Remove category "' + label + '"?';
    if (!confirm(msg)) return;

    showBanner('Removing category...', 'loading');

    try {
      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      data.gallery.categories = data.gallery.categories.filter(function (c) { return c.id !== id; });

      await writeContentFile(data, sha, 'Remove gallery category: ' + id);

      window.SCP.gallery.categories = window.SCP.gallery.categories.filter(function (c) { return c.id !== id; });

      showBanner('Category removed. Site deploying...', 'success');
      renderCategoriesAdmin();
      populateCategorySelects();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  function initCategoriesAdmin() {
    var addBtn = document.getElementById('add-category-btn');
    var input  = document.getElementById('new-category-input');
    if (addBtn) addBtn.addEventListener('click', addCategory);
    if (input)  input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addCategory();
    });
    renderCategoriesAdmin();
    populateCategorySelects();
  }

  /* ============================================================
     INIT ADMIN PANEL
     ============================================================ */
  async function initAdmin() {
    // Always load live data from GitHub before rendering any UI.
    // The CDN-served content.js can be minutes stale after a save,
    // so reading window.SCP directly would show outdated state.
    showBanner('Loading\u2026', 'loading');
    try {
      var result = await readContentFile();
      window.SCP = result.data;
      var banner = document.getElementById('deploy-banner');
      if (banner) banner.style.display = 'none';
    } catch (err) {
      console.error('initAdmin: could not load from GitHub', err);
      showBanner('Warning: Could not load latest data from GitHub. Check your token. Showing cached version.', 'error');
    }

    initTabs();
    initHomeHighlights();
    initCategoriesAdmin();
    initServicesAdmin();
    initGalleryUpload();
    initCollectionsTab();
    initPhotoEditModal();
    renderGalleryGrid();
    renderCollectionsList();
  }

  /* ============================================================
     BOOTSTRAP
     ============================================================ */
  function bootstrap() {
    initPasswordGate();
    initTokenGate();
    initLogout();
    checkAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

}());
