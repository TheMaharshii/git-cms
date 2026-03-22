/**
 * Frontend App Logic
 * Displays products from local public data.json
 */

const STORAGE_KEY = 'gitcms_ui_state_v2';
const FAVORITES_KEY = 'gitcms_favorites_v1';
const RECENT_KEY = 'gitcms_recent_v1';
const RECENT_LIMIT = 6;

let appData = { items: [] };
let lastLoadedAt = null;

const uiState = {
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name-asc',
  viewType: 'cards',
  minPrice: '',
  maxPrice: '',
  favoritesOnly: false,
  page: 1,
  pageSize: 12,
  randomSeed: 0,
  highlightKey: '',
  favorites: new Set(),
  recentKeys: [],
};

async function fetchPublicData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load data.json (${response.status})`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Invalid data.json format: expected { "items": [] }');
    }

    appData = {
      ...data,
      items: data.items.map((item, index) => ({
        ...item,
        _key: buildItemKey(item, index),
      })),
    };
    lastLoadedAt = new Date();
    return true;
  } catch (error) {
    showError(`Failed to load public data: ${error.message}`);
    console.error(error);
    return false;
  }
}

function buildItemKey(item, index) {
  if (item && item.id !== undefined && item.id !== null && String(item.id).trim()) {
    return `id:${String(item.id).trim()}`;
  }
  const name = String(item?.name || '').trim().toLowerCase();
  const category = String(item?.category || '').trim().toLowerCase();
  const price = Number(item?.price || 0).toFixed(2);
  return `idx:${index}|${name}|${category}|${price}`;
}

function getFilteredAndSortedItems() {
  const query = uiState.searchQuery.toLowerCase();
  const minPrice = uiState.minPrice === '' ? null : Number(uiState.minPrice);
  const maxPrice = uiState.maxPrice === '' ? null : Number(uiState.maxPrice);

  let visibleItems = [...(appData.items || [])];

  if (uiState.selectedCategory !== 'all') {
    visibleItems = visibleItems.filter((item) => (item.category || '').toLowerCase() === uiState.selectedCategory.toLowerCase());
  }

  if (query) {
    const queryParts = query.split(/\s+/).filter(Boolean);
    visibleItems = visibleItems.filter((item) => {
      const bag = `${item.name || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
      return queryParts.every((part) => bag.includes(part));
    });
  }

  if (minPrice !== null && !Number.isNaN(minPrice)) {
    visibleItems = visibleItems.filter((item) => Number(item.price || 0) >= minPrice);
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    visibleItems = visibleItems.filter((item) => Number(item.price || 0) <= maxPrice);
  }

  if (uiState.favoritesOnly) {
    visibleItems = visibleItems.filter((item) => uiState.favorites.has(item._key));
  }

  if (uiState.sortBy === 'name-asc') {
    visibleItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (uiState.sortBy === 'name-desc') {
    visibleItems.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (uiState.sortBy === 'price-asc') {
    visibleItems.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (uiState.sortBy === 'price-desc') {
    visibleItems.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (uiState.sortBy === 'random') {
    visibleItems.sort((a, b) => hashWithSeed(a._key, uiState.randomSeed) - hashWithSeed(b._key, uiState.randomSeed));
  }

  return visibleItems;
}

function getPaginatedSlice(items) {
  const totalPages = Math.max(1, Math.ceil(items.length / uiState.pageSize));
  uiState.page = Math.min(Math.max(1, uiState.page), totalPages);
  const start = (uiState.page - 1) * uiState.pageSize;
  const end = start + uiState.pageSize;
  return {
    pageItems: items.slice(start, end),
    totalPages,
  };
}

function displayItems() {
  const container = document.getElementById('items-container');
  const allVisible = getFilteredAndSortedItems();
  const { pageItems, totalPages } = getPaginatedSlice(allVisible);

  updateSummary(allVisible.length, totalPages);
  renderPagination(allVisible.length, totalPages);

  if (!pageItems.length) {
    container.className = 'items-grid';
    container.innerHTML = `
      <div class="empty-state">
        <p>No items match your filters.</p>
        <button id="empty-reset-btn" class="btn btn-secondary" type="button">Reset Filters</button>
      </div>
    `;
    persistUiState();
    syncUrlState();
    return;
  }

  if (uiState.viewType === 'table') {
    displayAsTable(container, pageItems);
  } else {
    displayAsCards(container, pageItems);
  }

  persistUiState();
  syncUrlState();
  renderRecentlyViewed();
}

function displayAsCards(container, items) {
  container.innerHTML = '';
  container.className = 'items-grid';
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = `item-card ${uiState.highlightKey === item._key ? 'item-highlight' : ''}`;
    card.setAttribute('data-item-key', item._key);

    const isFavorite = uiState.favorites.has(item._key);
    card.innerHTML = `
      ${item.image ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>` : '<div class="item-image item-image-placeholder"><img src="assets/icon-image.svg" alt="No image" width="28" height="28"><span>No image</span></div>'}
      <div class="item-content">
        <div class="item-row-top">
          <h3 class="item-name">${escapeHtml(item.name)}</h3>
          <button class="fav-btn ${isFavorite ? 'is-favorite' : ''}" type="button" data-fav-key="${escapeHtml(item._key)}" aria-label="Toggle favorite">★</button>
        </div>
        ${item.category ? `<p class="item-category">${escapeHtml(item.category)}</p>` : ''}
        ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
        <div class="item-footer">
          <span class="item-price">$${parseFloat(item.price || 0).toFixed(2)}</span>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function displayAsTable(container, items) {
  container.innerHTML = '';
  container.className = '';

  const table = document.createElement('table');
  table.className = 'items-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Fav</th>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Description</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  items.forEach((item) => {
    const row = document.createElement('tr');
    row.setAttribute('data-item-key', item._key);
    const isFavorite = uiState.favorites.has(item._key);
    row.className = uiState.highlightKey === item._key ? 'item-highlight' : '';
    row.innerHTML = `
      <td>
        <button class="fav-btn ${isFavorite ? 'is-favorite' : ''}" type="button" data-fav-key="${escapeHtml(item._key)}" aria-label="Toggle favorite">★</button>
      </td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.category || 'N/A')}</td>
      <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
      <td>${escapeHtml((item.description || '').substring(0, 90))}${(item.description || '').length > 90 ? '...' : ''}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function updateSummary(visibleCount, totalPages) {
  const summaryEl = document.getElementById('results-summary');
  const metaEl = document.getElementById('catalog-meta');
  if (summaryEl) {
    const total = appData.items.length;
    summaryEl.textContent = `${visibleCount} of ${total} items · Page ${uiState.page} of ${totalPages} · ${uiState.favorites.size} favorites`;
  }
  if (metaEl) {
    const loadedText = lastLoadedAt ? `Loaded ${lastLoadedAt.toLocaleTimeString()}` : 'Ready';
    const priceRangeText = (uiState.minPrice !== '' || uiState.maxPrice !== '')
      ? ` · Price ${uiState.minPrice || '0'}-${uiState.maxPrice || '∞'}`
      : '';
    metaEl.textContent = `${loadedText}${priceRangeText}`;
  }
}

function renderPagination(totalItems, totalPages) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  if (!totalItems) {
    paginationEl.innerHTML = '';
    return;
  }

  paginationEl.innerHTML = `
    <button class="btn btn-secondary" type="button" id="prev-page" ${uiState.page <= 1 ? 'disabled' : ''}>Prev</button>
    <span class="page-chip">Page ${uiState.page} / ${totalPages}</span>
    <button class="btn btn-secondary" type="button" id="next-page" ${uiState.page >= totalPages ? 'disabled' : ''}>Next</button>
  `;
}

function renderRecentlyViewed() {
  const recentContainer = document.getElementById('recently-viewed');
  if (!recentContainer) return;

  const keySet = new Set(uiState.recentKeys);
  const recentItems = (appData.items || []).filter((item) => keySet.has(item._key));
  const ordered = uiState.recentKeys
    .map((key) => recentItems.find((item) => item._key === key))
    .filter(Boolean);

  if (!ordered.length) {
    recentContainer.innerHTML = '<p class="empty-state">No recently viewed items</p>';
    return;
  }

  recentContainer.innerHTML = ordered.map((item) => `
    <button class="recent-chip" type="button" data-jump-key="${escapeHtml(item._key)}">
      ${escapeHtml(item.name)}
    </button>
  `).join('');
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = String(message).trim();
    errorDiv.style.display = 'block';
  } else {
    alert(String(message).trim());
  }
}

function clearError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}

function populateCategoryFilter() {
  const categorySelect = document.getElementById('category-filter');
  if (!categorySelect) return;

  const categoryCounts = new Map();
  (appData.items || []).forEach((item) => {
    const category = (item.category || '').trim();
    if (!category) return;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const categories = Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b));
  categorySelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.textContent = `All Categories (${appData.items.length})`;
  categorySelect.appendChild(defaultOption);

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `${category} (${categoryCounts.get(category)})`;
    categorySelect.appendChild(option);
  });

  if (!categories.includes(uiState.selectedCategory)) {
    uiState.selectedCategory = 'all';
  }
  categorySelect.value = uiState.selectedCategory;
}

function applyControlValues() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const viewToggle = document.getElementById('view-toggle');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const favoritesOnly = document.getElementById('favorites-only');
  const pageSizeSelect = document.getElementById('page-size');

  if (searchInput) searchInput.value = uiState.searchQuery;
  if (categorySelect) categorySelect.value = uiState.selectedCategory;
  if (sortSelect) sortSelect.value = uiState.sortBy;
  if (viewToggle) viewToggle.value = uiState.viewType;
  if (minPriceInput) minPriceInput.value = uiState.minPrice;
  if (maxPriceInput) maxPriceInput.value = uiState.maxPrice;
  if (favoritesOnly) favoritesOnly.checked = uiState.favoritesOnly;
  if (pageSizeSelect) pageSizeSelect.value = String(uiState.pageSize);
}

function persistUiState() {
  const toSave = {
    searchQuery: uiState.searchQuery,
    selectedCategory: uiState.selectedCategory,
    sortBy: uiState.sortBy,
    viewType: uiState.viewType,
    minPrice: uiState.minPrice,
    maxPrice: uiState.maxPrice,
    favoritesOnly: uiState.favoritesOnly,
    page: uiState.page,
    pageSize: uiState.pageSize,
    randomSeed: uiState.randomSeed,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(uiState.favorites)));
  localStorage.setItem(RECENT_KEY, JSON.stringify(uiState.recentKeys));
}

function restoreUiState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    uiState.searchQuery = String(saved.searchQuery || '');
    uiState.selectedCategory = String(saved.selectedCategory || 'all');
    uiState.sortBy = String(saved.sortBy || 'name-asc');
    uiState.viewType = saved.viewType === 'table' ? 'table' : 'cards';
    uiState.minPrice = saved.minPrice === '' ? '' : (saved.minPrice ?? '');
    uiState.maxPrice = saved.maxPrice === '' ? '' : (saved.maxPrice ?? '');
    uiState.favoritesOnly = Boolean(saved.favoritesOnly);
    uiState.page = Number(saved.page) > 0 ? Number(saved.page) : 1;
    uiState.pageSize = [6, 12, 18, 24].includes(Number(saved.pageSize)) ? Number(saved.pageSize) : 12;
    uiState.randomSeed = Number(saved.randomSeed) || 0;

    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    uiState.favorites = new Set(Array.isArray(favorites) ? favorites : []);

    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    uiState.recentKeys = Array.isArray(recent) ? recent.slice(0, RECENT_LIMIT) : [];
  } catch (error) {
    console.warn('Failed to restore UI state', error);
  }
}

function syncUrlState() {
  const params = new URLSearchParams();
  if (uiState.searchQuery) params.set('q', uiState.searchQuery);
  if (uiState.selectedCategory !== 'all') params.set('c', uiState.selectedCategory);
  if (uiState.sortBy !== 'name-asc') params.set('s', uiState.sortBy);
  if (uiState.viewType !== 'cards') params.set('v', uiState.viewType);
  if (uiState.page !== 1) params.set('p', String(uiState.page));
  if (uiState.pageSize !== 12) params.set('ps', String(uiState.pageSize));
  if (uiState.minPrice !== '') params.set('min', String(uiState.minPrice));
  if (uiState.maxPrice !== '') params.set('max', String(uiState.maxPrice));
  if (uiState.favoritesOnly) params.set('f', '1');

  const query = params.toString();
  const target = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', target);
}

function restoreStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('q')) uiState.searchQuery = params.get('q') || '';
  if (params.has('c')) uiState.selectedCategory = params.get('c') || 'all';
  if (params.has('s')) uiState.sortBy = params.get('s') || 'name-asc';
  if (params.has('v')) uiState.viewType = params.get('v') === 'table' ? 'table' : 'cards';
  if (params.has('p')) uiState.page = Math.max(1, Number(params.get('p')) || 1);
  if (params.has('ps')) {
    const ps = Number(params.get('ps'));
    if ([6, 12, 18, 24].includes(ps)) uiState.pageSize = ps;
  }
  if (params.has('min')) uiState.minPrice = params.get('min') || '';
  if (params.has('max')) uiState.maxPrice = params.get('max') || '';
  if (params.get('f') === '1') uiState.favoritesOnly = true;
}

function clearFilters() {
  uiState.searchQuery = '';
  uiState.selectedCategory = 'all';
  uiState.sortBy = 'name-asc';
  uiState.minPrice = '';
  uiState.maxPrice = '';
  uiState.favoritesOnly = false;
  uiState.page = 1;
  uiState.randomSeed = 0;
  uiState.highlightKey = '';
  applyControlValues();
  clearError();
  displayItems();
}

function toggleFavorite(itemKey) {
  if (!itemKey) return;
  if (uiState.favorites.has(itemKey)) {
    uiState.favorites.delete(itemKey);
  } else {
    uiState.favorites.add(itemKey);
  }
  displayItems();
}

function markRecentlyViewed(itemKey) {
  if (!itemKey) return;
  uiState.recentKeys = [itemKey, ...uiState.recentKeys.filter((key) => key !== itemKey)].slice(0, RECENT_LIMIT);
  persistUiState();
  renderRecentlyViewed();
}

function jumpToItem(itemKey) {
  const items = getFilteredAndSortedItems();
  const index = items.findIndex((item) => item._key === itemKey);
  if (index === -1) return;

  uiState.page = Math.floor(index / uiState.pageSize) + 1;
  uiState.highlightKey = itemKey;
  displayItems();

  requestAnimationFrame(() => {
    const node = document.querySelector(`[data-item-key="${cssEscape(itemKey)}"]`);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function shareCurrentView() {
  syncUrlState();
  const shareUrl = window.location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl)
      .then(() => setCatalogMeta('Share link copied'))
      .catch(() => fallbackCopyToClipboard(shareUrl));
  } else {
    fallbackCopyToClipboard(shareUrl);
  }
}

function fallbackCopyToClipboard(text) {
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  document.body.removeChild(helper);
  setCatalogMeta('Share link copied');
}

function exportVisibleItems() {
  const visible = getFilteredAndSortedItems();
  const payload = {
    exportedAt: new Date().toISOString(),
    total: visible.length,
    items: visible,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `git-cms-visible-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setCatalogMeta('Visible items exported');
}

function randomPick() {
  const visible = getFilteredAndSortedItems();
  if (!visible.length) {
    showError('No items available for random pick with current filters.');
    return;
  }
  clearError();
  const index = Math.floor(Math.random() * visible.length);
  const chosen = visible[index];
  uiState.highlightKey = chosen._key;
  jumpToItem(chosen._key);
  setCatalogMeta(`Random pick: ${chosen.name || 'Untitled item'}`);
}

function shuffleItems() {
  uiState.sortBy = 'random';
  uiState.randomSeed = Date.now();
  uiState.page = 1;
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'random';
  displayItems();
}

function setCatalogMeta(message) {
  const metaEl = document.getElementById('catalog-meta');
  if (!metaEl) return;
  const base = lastLoadedAt ? `Loaded ${lastLoadedAt.toLocaleTimeString()}` : 'Ready';
  metaEl.textContent = `${base} · ${message}`;
}

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, '\\$&');
}

function hashWithSeed(value, seed) {
  const text = `${value}|${seed}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function debounce(fn, wait = 120) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function bindEvents() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const viewToggle = document.getElementById('view-toggle');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const favoritesOnly = document.getElementById('favorites-only');
  const pageSizeSelect = document.getElementById('page-size');

  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      uiState.searchQuery = e.target.value.trim();
      uiState.page = 1;
      displayItems();
    }, 140));
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      uiState.selectedCategory = e.target.value;
      uiState.page = 1;
      displayItems();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      uiState.sortBy = e.target.value;
      if (uiState.sortBy === 'random') uiState.randomSeed = Date.now();
      uiState.page = 1;
      displayItems();
    });
  }

  if (viewToggle) {
    viewToggle.addEventListener('change', (e) => {
      uiState.viewType = e.target.value === 'table' ? 'table' : 'cards';
      displayItems();
    });
  }

  if (minPriceInput) {
    minPriceInput.addEventListener('input', debounce((e) => {
      uiState.minPrice = e.target.value.trim();
      uiState.page = 1;
      displayItems();
    }, 140));
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', debounce((e) => {
      uiState.maxPrice = e.target.value.trim();
      uiState.page = 1;
      displayItems();
    }, 140));
  }

  if (favoritesOnly) {
    favoritesOnly.addEventListener('change', (e) => {
      uiState.favoritesOnly = Boolean(e.target.checked);
      uiState.page = 1;
      displayItems();
    });
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      const nextSize = Number(e.target.value) || 12;
      uiState.pageSize = [6, 12, 18, 24].includes(nextSize) ? nextSize : 12;
      uiState.page = 1;
      displayItems();
    });
  }

  document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
  document.getElementById('shuffle-btn')?.addEventListener('click', shuffleItems);
  document.getElementById('random-pick-btn')?.addEventListener('click', randomPick);
  document.getElementById('share-view-btn')?.addEventListener('click', shareCurrentView);
  document.getElementById('export-visible-btn')?.addEventListener('click', exportVisibleItems);

  document.getElementById('pagination')?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'prev-page') {
      uiState.page = Math.max(1, uiState.page - 1);
      displayItems();
    } else if (target.id === 'next-page') {
      uiState.page += 1;
      displayItems();
    }
  });

  document.getElementById('items-container')?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const favoriteBtn = target.closest('[data-fav-key]');
    if (favoriteBtn instanceof HTMLElement) {
      e.stopPropagation();
      toggleFavorite(favoriteBtn.getAttribute('data-fav-key'));
      return;
    }

    if (target.id === 'empty-reset-btn') {
      clearFilters();
      return;
    }

    const itemNode = target.closest('[data-item-key]');
    if (itemNode instanceof HTMLElement) {
      const itemKey = itemNode.getAttribute('data-item-key');
      markRecentlyViewed(itemKey);
      uiState.highlightKey = itemKey || '';
      displayItems();
    }
  });

  document.getElementById('recently-viewed')?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const jumpBtn = target.closest('[data-jump-key]');
    if (jumpBtn instanceof HTMLElement) {
      jumpToItem(jumpBtn.getAttribute('data-jump-key'));
    }
  });

  document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      document.getElementById('search-input')?.focus();
      return;
    }

    if (event.key.toLowerCase() === 'v' && !isTyping) {
      event.preventDefault();
      uiState.viewType = uiState.viewType === 'cards' ? 'table' : 'cards';
      const viewToggleSelect = document.getElementById('view-toggle');
      if (viewToggleSelect) viewToggleSelect.value = uiState.viewType;
      displayItems();
      return;
    }

    if (event.key === 'Escape' && activeTag === 'INPUT') {
      const search = document.getElementById('search-input');
      if (search && search.value) {
        search.value = '';
        uiState.searchQuery = '';
        uiState.page = 1;
        displayItems();
      }
    }
  });
}

async function initApp() {
  const loadingDiv = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');

  if (loadingDiv) loadingDiv.style.display = 'block';

  restoreUiState();
  restoreStateFromUrl();

  const success = await fetchPublicData();

  if (loadingDiv) loadingDiv.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';

  if (!success) return;

  clearError();
  populateCategoryFilter();
  applyControlValues();
  bindEvents();
  displayItems();
}

document.addEventListener('DOMContentLoaded', initApp);
