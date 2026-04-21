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
})();
