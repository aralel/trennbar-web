window.CYRUS_LINKS = {
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.aralel.trennbare',
  appStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_STORE_ID',
  supportEmail: 'support@example.com'
};

window.addEventListener('DOMContentLoaded', function () {
  var googleLinks = document.querySelectorAll('[data-store-link="google-play"]');
  var appStoreLinks = document.querySelectorAll('[data-store-link="app-store"]');
  var supportLinks = document.querySelectorAll('[data-support-email]');
  var appStoreConfigured = !window.CYRUS_LINKS.appStoreUrl.includes('YOUR_APP_STORE_ID');

  googleLinks.forEach(function (link) {
    link.setAttribute('href', window.CYRUS_LINKS.googlePlayUrl);
  });

  appStoreLinks.forEach(function (link) {
    if (appStoreConfigured) {
      link.setAttribute('href', window.CYRUS_LINKS.appStoreUrl);
    } else {
      link.setAttribute('href', '#');
      link.classList.add('is-disabled');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('title', 'Set the real App Store URL in website/app-links.js');
    }
  });

  supportLinks.forEach(function (link) {
    link.textContent = window.CYRUS_LINKS.supportEmail;
    link.setAttribute('href', 'mailto:' + window.CYRUS_LINKS.supportEmail);
  });

  var yearNodes = document.querySelectorAll('[data-current-year]');
  var currentYear = String(new Date().getFullYear());
  yearNodes.forEach(function (node) {
    node.textContent = currentYear;
  });
});
