/*
 * Client-side filtering for the dictionary explorer.
 *
 * Everything this file touches is already in the page: Jekyll renders all 3,383
 * word rows and every facet count at build time, so with JavaScript off the
 * page is still a complete, readable dictionary. This script only narrows what
 * is on screen and recounts the facets against the current selection.
 */
(function () {
  'use strict';

  var explorerRoot = document.querySelector('[data-explorer]');
  if (!explorerRoot) {
    return;
  }

  var FACET_NAMES = ['prefix', 'suffix'];

  /*
   * An affix filter can legitimately be the empty string — "words with no
   * prefix" is a real bucket of 948 entries — so an unset filter cannot also be
   * "". `null` means unset, and the URL carries this sentinel for the empty
   * bucket. No German affix in the data is parenthesised, so it cannot collide.
   */
  var NONE_PARAM_VALUE = '(none)';

  var searchInput = document.getElementById('word-search');
  var resultCount = document.getElementById('result-count');
  var activeFilters = document.getElementById('active-filters');
  var clearButton = document.getElementById('clear-filters');
  var emptyState = document.getElementById('empty-state');
  var tableBody = document.getElementById('word-rows');

  var collator = new Intl.Collator('de', { sensitivity: 'base' });
  var numberFormat = new Intl.NumberFormat('en-US');

  /*
   * Folds the diacritics German search terms are most often typed without, so
   * "uber" finds "überaktiv" and "gross" finds "Großdeutschland". Applied to the
   * haystacks once up front and to the query on every keystroke.
   */
  function foldForSearch(value) {
    return value
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /*
   * The haystack is read out of the cells the row already renders — the word in
   * column 1 and the stem in column 3 — rather than duplicated into `data-`
   * attributes. Across 3,383 rows that duplication was a meaningful slice of
   * the page, and it could go stale against the visible text.
   */
  var WORD_CELL_INDEX = 0;
  var STEM_CELL_INDEX = 2;

  var wordRows = Array.prototype.map.call(tableBody.rows, function (rowElement) {
    return {
      element: rowElement,
      prefix: rowElement.dataset.prefix,
      suffix: rowElement.dataset.suffix,
      haystack: foldForSearch(
        rowElement.cells[WORD_CELL_INDEX].textContent +
          ' ' +
          rowElement.cells[STEM_CELL_INDEX].textContent,
      ),
      isVisible: true,
    };
  });

  var totalWordCount = wordRows.length;

  /* Each panel's buttons, plus the order Jekyll rendered them in (count-first),
     which the sort toggle restores. */
  var facetPanels = {};
  FACET_NAMES.forEach(function (facetName) {
    var listElement = document.querySelector('[data-facet-list="' + facetName + '"]');
    var items = Array.prototype.slice.call(
      listElement.querySelectorAll('[data-facet-item="' + facetName + '"]'),
    );

    facetPanels[facetName] = {
      listElement: listElement,
      // Both orders are computed once. Sorting on demand would have to re-read
      // the DOM, and the count order has to survive filtering unchanged — see
      // reorderFacetList.
      itemsInCountOrder: items,
      itemsInAlphaOrder: items.slice().sort(function (left, right) {
        var leftValue = left.querySelector('.facet-button').dataset.value;
        var rightValue = right.querySelector('.facet-button').dataset.value;
        // The "no prefix" bucket is not a word, so it leads the list rather
        // than sorting under the empty string.
        if (leftValue === '') return -1;
        if (rightValue === '') return 1;
        return collator.compare(leftValue, rightValue);
      }),
      buttons: items.map(function (item, index) {
        var button = item.querySelector('.facet-button');
        return {
          item: item,
          element: button,
          value: button.dataset.value,
          countElement: button.querySelector('[data-count]'),
          barElement: button.querySelector('[data-bar]'),
          // Where this option ranks across the whole dictionary, used to break
          // ties so equal counts never shuffle against each other.
          countRank: index,
          currentCount: Number(button.dataset.total),
        };
      }),
      sortMode: 'count',
    };
  });

  var filters = { prefix: null, suffix: null, query: '' };

  function affixLabel(facetName, value) {
    return value === '' ? 'no ' + facetName : value;
  }

  /* --------------------------------------------------------------- filter - */

  function rowMatches(row, ignoredFacet, foldedQuery) {
    if (ignoredFacet !== 'prefix' && filters.prefix !== null && row.prefix !== filters.prefix) {
      return false;
    }
    if (ignoredFacet !== 'suffix' && filters.suffix !== null && row.suffix !== filters.suffix) {
      return false;
    }
    return foldedQuery === '' || row.haystack.indexOf(foldedQuery) !== -1;
  }

  /*
   * Recounts one facet against every filter EXCEPT its own selection — the
   * standard faceted-browse rule. Counting a facet against itself would leave
   * the selected row showing its own count and every sibling at zero, which
   * destroys exactly the comparison the page is for.
   */
  function recountFacet(facetName, foldedQuery) {
    var counts = Object.create(null);
    var largestCount = 0;

    for (var index = 0; index < wordRows.length; index += 1) {
      var row = wordRows[index];
      if (!rowMatches(row, facetName, foldedQuery)) {
        continue;
      }
      var value = row[facetName];
      counts[value] = (counts[value] || 0) + 1;
      // The bar scale ignores the "no affix" bucket for the reason given in
      // _includes/facet-panel.html: it is the absence of an affix, not a
      // competitor, and it is large enough to flatten every real one.
      if (value !== '' && counts[value] > largestCount) {
        largestCount = counts[value];
      }
    }

    facetPanels[facetName].buttons.forEach(function (facetButton) {
      var count = counts[facetButton.value] || 0;
      var isSelected = filters[facetName] === facetButton.value;

      facetButton.currentCount = count;
      facetButton.countElement.textContent = numberFormat.format(count);
      if (facetButton.barElement) {
        facetButton.barElement.style.width =
          largestCount === 0
            ? '0%'
            : Math.min(100, (count / largestCount) * 100).toFixed(1) + '%';
      }
      facetButton.element.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      facetButton.item.classList.toggle('is-empty', count === 0 && !isSelected);
      // A zero-count option cannot narrow anything further, but the selected
      // one stays clickable so it can be switched off again.
      facetButton.element.disabled = count === 0 && !isSelected;
    });

    reorderFacetList(facetName);
  }

  /*
   * Re-lays the panel against the counts it is currently showing.
   *
   * "By count" means the count on screen, not the dictionary-wide one. Under a
   * filter those differ, and ordering by the global figure produced a list
   * whose numbers ran 2, 2, 7, 6 under a heading that claimed to be sorted —
   * with a run of zeroes on top, burying the handful of affixes that actually
   * combine with the selection. Ties keep the dictionary-wide rank, so equal
   * counts never trade places, and the DOM is only touched when the order
   * genuinely changes.
   *
   * Alphabetical order is fixed, so there the only movement is sinking the
   * options that can no longer match anything.
   */
  function reorderFacetList(facetName) {
    var panel = facetPanels[facetName];
    var desiredOrder;

    if (panel.sortMode === 'count') {
      desiredOrder = panel.buttons
        .slice()
        .sort(function (left, right) {
          return right.currentCount !== left.currentCount
            ? right.currentCount - left.currentCount
            : left.countRank - right.countRank;
        })
        .map(function (facetButton) {
          return facetButton.item;
        });
    } else {
      var live = [];
      var spent = [];
      panel.itemsInAlphaOrder.forEach(function (item) {
        (item.classList.contains('is-empty') ? spent : live).push(item);
      });
      desiredOrder = live.concat(spent);
    }

    var currentOrder = panel.listElement.children;
    var isUnchanged =
      desiredOrder.length === currentOrder.length &&
      desiredOrder.every(function (item, index) {
        return currentOrder[index] === item;
      });

    if (!isUnchanged) {
      desiredOrder.forEach(function (item) {
        panel.listElement.appendChild(item);
      });
    }
  }

  function renderActiveFilters() {
    activeFilters.textContent = '';

    FACET_NAMES.forEach(function (facetName) {
      if (filters[facetName] === null) {
        return;
      }

      var chip = document.createElement('span');
      chip.className = 'filter-chip';

      var kind = document.createElement('span');
      kind.className = 'filter-chip-kind';
      kind.textContent = facetName;

      var label = document.createElement('span');
      label.textContent = affixLabel(facetName, filters[facetName]);

      var clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'filter-chip-clear';
      clear.textContent = '×';
      clear.setAttribute(
        'aria-label',
        'Remove the ' + facetName + ' filter ' + affixLabel(facetName, filters[facetName]),
      );
      clear.addEventListener('click', function () {
        setFacet(facetName, null);
      });

      chip.appendChild(kind);
      chip.appendChild(label);
      chip.appendChild(clear);
      activeFilters.appendChild(chip);
    });
  }

  function hasAnyFilter() {
    return filters.prefix !== null || filters.suffix !== null || filters.query !== '';
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) {
      return;
    }

    var params = new URLSearchParams();
    FACET_NAMES.forEach(function (facetName) {
      if (filters[facetName] !== null) {
        params.set(facetName, filters[facetName] === '' ? NONE_PARAM_VALUE : filters[facetName]);
      }
    });
    if (filters.query !== '') {
      params.set('q', filters.query);
    }

    var query = params.toString();
    window.history.replaceState(null, '', query === '' ? window.location.pathname : '?' + query);
  }

  function applyFilters() {
    var foldedQuery = foldForSearch(filters.query.trim());
    var visibleCount = 0;

    for (var index = 0; index < wordRows.length; index += 1) {
      var row = wordRows[index];
      var isVisible = rowMatches(row, null, foldedQuery);

      if (isVisible !== row.isVisible) {
        row.element.hidden = !isVisible;
        row.isVisible = isVisible;
      }
      if (isVisible) {
        visibleCount += 1;
      }
    }

    FACET_NAMES.forEach(function (facetName) {
      recountFacet(facetName, foldedQuery);
    });

    resultCount.innerHTML =
      '<strong>' +
      numberFormat.format(visibleCount) +
      '</strong> of ' +
      numberFormat.format(totalWordCount) +
      ' words';
    emptyState.hidden = visibleCount !== 0;
    clearButton.disabled = !hasAnyFilter();

    renderActiveFilters();
    syncUrl();
  }

  /* ---------------------------------------------------------------- state - */

  function setFacet(facetName, value) {
    filters[facetName] = value;
    applyFilters();
  }

  function clearAllFilters() {
    filters.prefix = null;
    filters.suffix = null;
    filters.query = '';
    searchInput.value = '';
    applyFilters();
  }

  function readFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);

    FACET_NAMES.forEach(function (facetName) {
      if (!params.has(facetName)) {
        return;
      }

      var raw = params.get(facetName);
      var value = raw === NONE_PARAM_VALUE ? '' : raw;
      var isKnown = facetPanels[facetName].buttons.some(function (facetButton) {
        return facetButton.value === value;
      });

      if (isKnown) {
        filters[facetName] = value;
      }
    });

    if (params.has('q')) {
      filters.query = params.get('q');
      searchInput.value = filters.query;
    }
  }

  /* ----------------------------------------------------------- interaction - */

  FACET_NAMES.forEach(function (facetName) {
    var panel = facetPanels[facetName];

    panel.listElement.addEventListener('click', function (event) {
      var button = event.target.closest('.facet-button');
      if (!button) {
        return;
      }
      // Clicking the active option again clears it, so the whole filter is
      // reachable from the one control.
      var value = button.dataset.value;
      setFacet(facetName, filters[facetName] === value ? null : value);
    });

    var sortToggle = document.querySelector('[data-sort-toggle="' + facetName + '"]');
    sortToggle.addEventListener('click', function () {
      panel.sortMode = panel.sortMode === 'count' ? 'alpha' : 'count';
      // Re-appending moves the existing nodes; nothing is recreated, so counts
      // and pressed states survive the resort.
      reorderFacetList(facetName);

      sortToggle.textContent = panel.sortMode === 'count' ? 'By count' : 'A–Z';
      sortToggle.setAttribute(
        'aria-label',
        panel.sortMode === 'count'
          ? 'Sorted by count. Switch to alphabetical'
          : 'Sorted alphabetically. Switch to by count',
      );
      panel.listElement.scrollTop = 0;
    });
  });

  var searchDebounce = null;
  searchInput.addEventListener('input', function () {
    window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(function () {
      filters.query = searchInput.value;
      applyFilters();
    }, 120);
  });

  searchInput.addEventListener('search', function () {
    filters.query = searchInput.value;
    applyFilters();
  });

  clearButton.addEventListener('click', clearAllFilters);

  var inlineClear = document.querySelector('[data-clear-inline]');
  if (inlineClear) {
    inlineClear.addEventListener('click', clearAllFilters);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.activeElement === searchInput) {
      clearAllFilters();
      return;
    }
    // "/" focuses search, the convention on data-browsing pages — but not while
    // the user is already typing into a field.
    if (event.key === '/' && document.activeElement !== searchInput) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  readFiltersFromUrl();
  applyFilters();
})();
