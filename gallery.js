const GALLERY_CACHE_KEY = 'gitcms_gallery_cache_v1';
const GALLERY_CACHE_TTL_MS = 30 * 60 * 1000;

const galleryState = {
  page: 2,
  limit: 15,
  allItems: [],
  visibleItems: [],
  columns: 4,
  query: '',
};

function showGalleryError(message) {
  const el = document.getElementById('gallery-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function clearGalleryError() {
  const el = document.getElementById('gallery-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function getCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(GALLERY_CACHE_KEY) || '{}');
    return cache && typeof cache === 'object' ? cache : {};
  } catch {
    return {};
  }
}

function setCache(cache) {
  localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(cache));
}

async function fetchPicsumPage(page, limit, forceRefresh = false) {
  const cache = getCache();
  const key = `${page}:${limit}`;
  const now = Date.now();

  if (!forceRefresh && cache[key] && (now - cache[key].timestamp) < GALLERY_CACHE_TTL_MS) {
    return { items: cache[key].items, source: 'cache' };
  }

  const response = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=${limit}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Picsum API failed (${response.status})`);
  }

  const items = await response.json();
  cache[key] = { items, timestamp: now };
  setCache(cache);

  return { items, source: 'api' };
}

function buildPhotoCard(photo) {
  const thumb = buildThumbDimensions(photo);

  const card = document.createElement('article');
  card.className = 'gallery-card';
  card.setAttribute('data-author', (photo.author || '').toLowerCase());
  card.setAttribute('data-photo-id', String(photo.id || ''));
  card.setAttribute('data-photo-author', String(photo.author || 'Unknown'));
  card.setAttribute('data-photo-width', String(photo.width || ''));
  card.setAttribute('data-photo-height', String(photo.height || ''));
  card.setAttribute('data-photo-url', String(photo.url || ''));
  card.setAttribute('data-photo-download-url', String(photo.download_url || ''));

  card.innerHTML = `
    <img src="https://picsum.photos/id/${photo.id}/${thumb.width}/${thumb.height}" loading="lazy" alt="${escapeHtml(photo.author || 'Unknown author')}" data-full="${escapeHtml(photo.download_url || '')}">
    <div class="gallery-card-content">
      <h3>${escapeHtml(photo.author || 'Unknown')}</h3>
      <p>ID: ${escapeHtml(photo.id)} · ${thumb.width}×${thumb.height}</p>
      <div class="gallery-card-actions">
        <a class="btn btn-secondary btn-sm" href="${escapeHtml(photo.download_url || '#')}" target="_blank" rel="noopener noreferrer">Open Original</a>
        <button class="btn btn-secondary btn-sm" type="button" data-copy-url="${escapeHtml(photo.download_url || '')}">Copy URL</button>
      </div>
    </div>
  `;
  return card;
}

function buildThumbDimensions(photo) {
  const originalWidth = Number(photo.width) || 1200;
  const originalHeight = Number(photo.height) || 900;
  const aspectRatio = originalWidth / originalHeight;

  const baseWidth = 520;
  const deterministicJitter = (Number(photo.id || 1) % 7) - 3;
  const width = Math.max(380, baseWidth + (deterministicJitter * 24));
  const ratioHeight = Math.round(width / Math.max(0.35, Math.min(2.4, aspectRatio)));
  const randomLift = 40 + ((Number(photo.id || 1) % 5) * 26);
  const height = Math.max(280, Math.min(980, ratioHeight + randomLift));

  return { width, height };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

function appendPhotos(items) {
  const masonry = document.getElementById('gallery-masonry');
  if (!masonry) return;

  items.forEach((photo) => {
    const card = buildPhotoCard(photo);
    appendCardToShortestColumn(card);
  });
}

function getMasonryColumns() {
  const masonry = document.getElementById('gallery-masonry');
  if (!masonry) return [];
  return Array.from(masonry.querySelectorAll('.gallery-col'));
}

function createMasonryColumns(count) {
  const masonry = document.getElementById('gallery-masonry');
  if (!masonry) return;

  const currentCards = Array.from(masonry.querySelectorAll('.gallery-card'));
  masonry.innerHTML = '';

  for (let i = 0; i < count; i += 1) {
    const col = document.createElement('div');
    col.className = 'gallery-col';
    col.setAttribute('data-col-index', String(i));
    masonry.appendChild(col);
  }

  currentCards.forEach((card) => {
    appendCardToShortestColumn(card);
  });
}

function appendCardToShortestColumn(card) {
  const columns = getMasonryColumns();
  if (!columns.length) return;

  let target = columns[0];
  columns.forEach((column) => {
    if (column.offsetHeight < target.offsetHeight) {
      target = column;
    }
  });

  target.appendChild(card);
}

function applyFilter() {
  const masonry = document.getElementById('gallery-masonry');
  if (!masonry) return;

  const cards = masonry.querySelectorAll('.gallery-card');
  cards.forEach((card) => {
    const author = card.getAttribute('data-author') || '';
    const visible = !galleryState.query || author.includes(galleryState.query);
    card.style.display = visible ? '' : 'none';
  });

  updateMeta();
}

function updateMeta(source = 'ready') {
  const meta = document.getElementById('gallery-meta');
  if (!meta) return;

  const masonry = document.getElementById('gallery-masonry');
  const totalCards = masonry ? masonry.querySelectorAll('.gallery-card').length : 0;
  const visibleCards = masonry ? masonry.querySelectorAll('.gallery-card:not([style*="display: none"])').length : 0;

  meta.textContent = `${visibleCards}/${totalCards} visible · page ${galleryState.page} · columns ${galleryState.columns} · source: ${source}`;
}

async function loadMore(forceRefresh = false) {
  const loadBtn = document.getElementById('load-more-gallery');
  if (loadBtn) {
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
  }

  clearGalleryError();

  try {
    const { items, source } = await fetchPicsumPage(galleryState.page, galleryState.limit, forceRefresh);
    galleryState.page += 1;
    galleryState.allItems.push(...items);
    appendPhotos(items);
    applyFilter();
    updateMeta(source);
  } catch (error) {
    showGalleryError(`Unable to load photos: ${error.message}`);
  } finally {
    if (loadBtn) {
      loadBtn.disabled = false;
      loadBtn.textContent = 'Load More';
    }
  }
}

function setColumns(count) {
  const masonry = document.getElementById('gallery-masonry');
  galleryState.columns = count;
  if (masonry) {
    masonry.style.gridTemplateColumns = `repeat(${galleryState.columns}, minmax(0, 1fr))`;
  }
  createMasonryColumns(galleryState.columns);
  updateMeta();
}

function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function bindLightbox() {
  const masonry = document.getElementById('gallery-masonry');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImage = document.getElementById('gallery-lightbox-image');
  const lightboxCaption = document.getElementById('gallery-lightbox-caption');
  const lightboxDetails = document.getElementById('gallery-lightbox-details');

  if (!masonry || !lightbox || !lightboxImage || !lightboxCaption || !lightboxDetails) return;

  lightbox.hidden = true;

  masonry.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const copyBtn = target.closest('[data-copy-url]');
    if (copyBtn instanceof HTMLElement) {
      copyToClipboard(copyBtn.getAttribute('data-copy-url') || '');
      return;
    }

    if (target.tagName === 'IMG') {
      const image = target;
      const card = image.closest('.gallery-card');
      lightboxImage.src = image.getAttribute('data-full') || image.getAttribute('src') || '';
      lightboxCaption.textContent = image.getAttribute('alt') || 'Photo';

      if (card instanceof HTMLElement) {
        const id = card.getAttribute('data-photo-id') || '-';
        const author = card.getAttribute('data-photo-author') || '-';
        const width = card.getAttribute('data-photo-width') || '-';
        const height = card.getAttribute('data-photo-height') || '-';
        const pageUrl = card.getAttribute('data-photo-url') || '';
        const downloadUrl = card.getAttribute('data-photo-download-url') || '';

        lightboxDetails.innerHTML = `
          <p><strong>ID:</strong> ${escapeHtml(id)}</p>
          <p><strong>Author:</strong> ${escapeHtml(author)}</p>
          <p><strong>Original Size:</strong> ${escapeHtml(width)} × ${escapeHtml(height)}</p>
          <p><strong>Source:</strong> <a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer">View Source</a></p>
          <p><strong>Download URL:</strong> <a href="${escapeHtml(downloadUrl)}" target="_blank" rel="noopener noreferrer">Open Image</a></p>
        `;
      } else {
        lightboxDetails.innerHTML = '';
      }

      lightbox.hidden = false;
    }
  });

  document.getElementById('gallery-lightbox-close')?.addEventListener('click', () => {
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
    lightboxDetails.innerHTML = '';
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.hidden = true;
      lightboxImage.removeAttribute('src');
      lightboxDetails.innerHTML = '';
    }
  });
}

function initGallery() {
  document.getElementById('load-more-gallery')?.addEventListener('click', () => loadMore(false));

  document.getElementById('gallery-search')?.addEventListener('input', (event) => {
    galleryState.query = String(event.target.value || '').trim().toLowerCase();
    applyFilter();
  });

  document.getElementById('refresh-gallery')?.addEventListener('click', () => {
    loadMore(true);
  });

  document.getElementById('clear-gallery-cache')?.addEventListener('click', () => {
    localStorage.removeItem(GALLERY_CACHE_KEY);
    updateMeta('cache cleared');
  });

  bindLightbox();
  setColumns(galleryState.columns);
  loadMore(false);
}

document.addEventListener('DOMContentLoaded', initGallery);
