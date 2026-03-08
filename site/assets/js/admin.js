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
    var raw = atob(json.content.replace(/\n/g, ''));
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
      var isFeatured = photo.featured === true;
      html += [
        '<div class="admin-photo-item' + (isInactive ? ' admin-photo-item--inactive' : '') + '">',
        '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy">',
        isFeatured ? '  <div class="admin-photo-item__featured-badge">&#9733; Home</div>' : '',
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

    document.getElementById('photo-edit-preview').src   = photo.src;
    document.getElementById('photo-edit-alt').value     = photo.alt || '';
    document.getElementById('photo-edit-category').value = photo.category || 'sports';
    document.getElementById('photo-edit-featured').checked = photo.featured === true;
    document.getElementById('photo-edit-active').checked   = photo.active !== false;

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
    var featured = document.getElementById('photo-edit-featured').checked;
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
      data.gallery.photos[editingPhotoIndex].featured = featured;
      data.gallery.photos[editingPhotoIndex].active   = active;

      await writeContentFile(data, sha, 'Update photo metadata at index ' + editingPhotoIndex);

      // Update local state
      var local = window.SCP.gallery.photos[editingPhotoIndex];
      local.alt      = alt;
      local.category = category;
      local.featured = featured;
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

  async function addGalleryPhoto() {
    if (!gallerySelectedFile) return;

    var category = document.getElementById('gallery-category').value;
    var alt      = document.getElementById('gallery-alt').value.trim();
    var featured = document.getElementById('gallery-featured').checked;
    var uploadBtn = document.getElementById('add-gallery-photo');

    hideError('gallery-error');
    uploadBtn.disabled = true;
    showBanner('Uploading photo...', 'loading');

    try {
      var originalName = gallerySelectedFile.name;
      var ext = originalName.lastIndexOf('.') !== -1
        ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
        : '.jpg';
      var baseName = slugify(originalName.replace(/\.[^.]+$/, '')) || 'photo-' + Date.now();
      var filename = baseName + '-' + Date.now() + ext;
      var path = 'site/assets/images/gallery/' + category + '/' + filename;

      await uploadImage(path, gallerySelectedFile);

      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.gallery) data.gallery = {};
      if (!data.gallery.photos) data.gallery.photos = [];

      var newPhoto = {
        src: 'assets/images/gallery/' + category + '/' + filename,
        alt: alt || filename,
        category: category,
        featured: featured
      };

      data.gallery.photos.push(newPhoto);
      await writeContentFile(data, sha, 'Add gallery photo: ' + filename);

      // Update local state
      if (!window.SCP.gallery) window.SCP.gallery = {};
      if (!window.SCP.gallery.photos) window.SCP.gallery.photos = [];
      window.SCP.gallery.photos.push(newPhoto);

      showBanner('Photo added! Site deploying...', 'success');
      resetGalleryForm();
      renderGalleryGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      showError('gallery-error', err.message);
      uploadBtn.disabled = false;
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
    var featuredCb   = document.getElementById('gallery-featured');

    if (fileInput)   fileInput.value = '';
    if (placeholder) placeholder.style.display = 'block';
    if (previewWrap) previewWrap.style.display  = 'none';
    if (previewImg)  previewImg.src = '';
    if (altInput)    altInput.value = '';
    if (uploadBtn)   uploadBtn.disabled = true;
    if (featuredCb)  featuredCb.checked = false;
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

    if (photos.length === 0) {
      grid.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.85rem;">No photos uploaded yet.</p>';
      return;
    }

    var html = '';
    photos.forEach(function (photo, i) {
      html += [
        '<div class="admin-photo-item">',
        '  <img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt || '') + '" loading="lazy">',
        '  <div class="admin-photo-item__label">' + escapeHtml(photo.alt || photo.src) + '</div>',
        '  <button class="admin-photo-item__remove" data-index="' + i + '" title="Remove">&times;</button>',
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

    var uploadBtn = document.getElementById('upload-col-photos-btn');
    uploadBtn.disabled = true;
    showBanner('Uploading ' + colUploadQueue.length + ' photo(s)...', 'loading');

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

        await uploadImage(path, file);

        newPhotos.push({
          src: 'assets/images/collections/' + currentCollectionId + '/' + filename,
          alt: altText || filename
        });
      }

      // Write to content.js
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

      // Clear queue
      colUploadQueue = [];
      document.getElementById('col-upload-queue').innerHTML = '';
      uploadBtn.style.display = 'none';
      uploadBtn.disabled = false;

      renderCollectionPhotos(currentCollectionId);
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
      uploadBtn.disabled = false;
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
      grid.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.9rem;">No services defined.</p>';
      return;
    }

    var html = '';
    services.forEach(function (service, idx) {
      html += [
        '<div class="admin-service-card">',
        '  <img src="' + escapeHtml(service.image) + '" alt="' + escapeHtml(service.name) + '" class="admin-service-card__img">',
        '  <div class="admin-service-card__body">',
        '    <p class="admin-service-card__name">' + escapeHtml(service.name) + '</p>',
        '    <input type="file" id="svc-file-' + idx + '" accept="image/*" style="display:none">',
        '    <button class="btn btn--outline-dark" data-svc-index="' + idx + '" style="font-size:0.8rem; padding:0.4rem 0.9rem; width:100%;">Replace Cover</button>',
        '  </div>',
        '</div>'
      ].join('\n');
    });

    grid.innerHTML = html;

    // Attach events
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
  }

  async function updateServiceCover(serviceIndex, file) {
    var service = (window.SCP && window.SCP.services && window.SCP.services[serviceIndex]);
    if (!service) return;

    showBanner('Uploading service cover...', 'loading');

    try {
      var ext      = file.name.lastIndexOf('.') !== -1
        ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        : '.jpg';
      var filename = service.id + '-cover' + ext;
      var path     = 'site/assets/images/gallery/' + service.id + '/' + filename;

      await uploadImage(path, file);

      var result = await readContentFile();
      var data   = result.data;
      var sha    = result.sha;

      if (!data.services || !data.services[serviceIndex]) throw new Error('Service not found.');
      data.services[serviceIndex].image = 'assets/images/gallery/' + service.id + '/' + filename;

      await writeContentFile(data, sha, 'Update service cover: ' + service.id);

      window.SCP.services[serviceIndex].image = data.services[serviceIndex].image;

      showBanner('Service cover updated! Site deploying...', 'success');
      renderServicesGrid();
    } catch (err) {
      console.error(err);
      showBanner('Error: ' + err.message, 'error');
    }
  }

  /* ============================================================
     INIT ADMIN PANEL
     ============================================================ */
  function initAdmin() {
    initTabs();
    initGalleryUpload();
    initCollectionsTab();
    initPhotoEditModal();
    renderGalleryGrid();
    renderCollectionsList();
    renderServicesGrid();
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
