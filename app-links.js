(function () {
  var APP_STORE_URL = 'https://apps.apple.com/us/app/cyrus-cylinder/id6760327600';
  var GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.aralel.trennbare';
  var userAgent = navigator.userAgent || '';
  var platform = navigator.platform || '';
  var touchPoints = navigator.maxTouchPoints || 0;

  var prefersAppleStore = /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Mac/i.test(platform) && touchPoints > 1);

  var preferredStoreUrl = prefersAppleStore ? APP_STORE_URL : GOOGLE_PLAY_URL;

  document.querySelectorAll('[data-current-year]').forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll('[data-store-link="smart-store"]').forEach(function (node) {
    node.setAttribute('href', preferredStoreUrl);
  });

  /*
   * Publishes the sticky header's real height as --site-header-height, which
   * the explorer's sticky table header and facet column anchor to.
   *
   * It cannot be a constant: the header bar wraps to two or three rows on a
   * narrow screen, so a hard-coded offset leaves the table header either
   * overlapping the site header or floating below it. Lives here rather than
   * in explorer.js because it describes the header, and the ranking pages need
   * it without loading the explorer script.
   */
  var siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    var publishHeaderHeight = function () {
      document.documentElement.style.setProperty(
        '--site-header-height',
        siteHeader.offsetHeight + 'px'
      );
    };

    publishHeaderHeight();

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(publishHeaderHeight).observe(siteHeader);
    } else {
      window.addEventListener('resize', publishHeaderHeight);
    }
  }
})();
