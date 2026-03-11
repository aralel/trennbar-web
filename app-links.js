window.addEventListener('DOMContentLoaded', function () {
  var yearNodes = document.querySelectorAll('[data-current-year]');
  var currentYear = String(new Date().getFullYear());
  yearNodes.forEach(function (node) {
    node.textContent = currentYear;
  });
});
