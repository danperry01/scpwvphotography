/**
 * scp-data.js
 *
 * Loads site data from the GitHub API instead of the Cloudflare CDN.
 * This means changes saved through the admin appear within seconds,
 * not after the full Cloudflare Pages rebuild cycle (2-5 min).
 *
 * Strategy:
 *  1. If localStorage has fresh data (< 30s old), use it immediately.
 *  2. Always fetch from GitHub API in the background to refresh the cache.
 *  3. Fire the custom "scp:ready" event once the DOM is ready AND data is set.
 *
 * All page scripts listen for "scp:ready" instead of "DOMContentLoaded".
 */
(function () {
  'use strict';

  var OWNER      = 'danperry01';
  var REPO       = 'scpwvphotography';
  var PATH       = 'site/data/content.js';
  var CACHE_KEY  = 'scp_data_v2';
  var CACHE_TS   = 'scp_data_ts';
  var CACHE_TTL  = 30 * 1000; // 30 seconds

  var domReady  = false;
  var dataReady = false;

  /* ----------------------------------------------------------
     Attempt to fire scp:ready — only when both DOM and data
     are set.
  ---------------------------------------------------------- */
  function tryFire() {
    if (domReady && dataReady) {
      document.dispatchEvent(new CustomEvent('scp:ready'));
    }
  }

  /* ----------------------------------------------------------
     DOM readiness
  ---------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      domReady = true;
      tryFire();
    });
  } else {
    domReady = true;
  }

  /* ----------------------------------------------------------
     localStorage helpers
  ---------------------------------------------------------- */
  function getCached() {
    try {
      var ts  = parseInt(localStorage.getItem(CACHE_TS) || '0', 10);
      var raw = localStorage.getItem(CACHE_KEY);
      if (raw && (Date.now() - ts) < CACHE_TTL) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TS, String(Date.now()));
    } catch (e) {}
  }

  /* ----------------------------------------------------------
     GitHub API fetch + parse
  ---------------------------------------------------------- */
  function fetchFromGitHub() {
    var url = 'https://api.github.com/repos/' + OWNER + '/' + REPO +
              '/contents/' + PATH;
    return fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      cache: 'no-store'
    })
    .then(function (r) {
      if (!r.ok) throw new Error('GitHub API ' + r.status);
      return r.json();
    })
    .then(function (json) {
      var bytes = Uint8Array.from(
        atob(json.content.replace(/\n/g, '')),
        function (c) { return c.charCodeAt(0); }
      );
      var raw   = new TextDecoder('utf-8').decode(bytes);
      var match = raw.match(/\/\* DATA_START \*\/([\s\S]*?)\/\* DATA_END \*\//);
      if (!match) throw new Error('Could not parse data format');
      return JSON.parse(match[1].trim());
    });
  }

  /* ----------------------------------------------------------
     Main loading logic
  ---------------------------------------------------------- */
  var cached = getCached();

  if (cached) {
    // Use cache immediately so the page renders without waiting
    window.SCP = cached;
    dataReady  = true;
    tryFire();

    // Refresh in background — update cache + window.SCP silently
    fetchFromGitHub().then(function (data) {
      window.SCP = data;
      setCache(data);
    }).catch(function () {
      // Background refresh failed — cached data still in use, that's fine
    });

  } else {
    // No valid cache — must wait for fresh data before firing scp:ready
    fetchFromGitHub().then(function (data) {
      window.SCP = data;
      setCache(data);
      dataReady  = true;
      tryFire();
    }).catch(function () {
      // GitHub fetch failed — fall back to whatever window.SCP was set to
      // by the CDN-served content.js (admin.html keeps that script tag)
      dataReady = true;
      tryFire();
    });
  }

}());
