const newsState = {
  query: 'javascript',
  page: 0,
  hitsPerPage: 20,
  hasNextPage: true,
};

function newsShowError(message) {
  const el = document.getElementById('news-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function newsClearError() {
  const el = document.getElementById('news-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

async function fetchNews(query, page) {
  const url = new URL('https://hn.algolia.com/api/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('tags', 'story');
  url.searchParams.set('page', String(page));
  url.searchParams.set('hitsPerPage', String(newsState.hitsPerPage));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`News API failed (${res.status})`);
  return res.json();
}

function appendNews(items) {
  const list = document.getElementById('news-list');
  if (!list) return;

  const markup = items.map((item) => {
    const title = item.title || item.story_title || 'Untitled story';
    const url = item.url || item.story_url || `https://news.ycombinator.com/item?id=${item.objectID}`;
    const author = item.author || 'unknown';
    const points = Number(item.points || 0);
    const comments = Number(item.num_comments || 0);

    return `
      <article class="api-card">
        <h3>${title}</h3>
        <p>By ${author} · ${points} points · ${comments} comments</p>
        <a class="btn btn-secondary btn-sm" href="${url}" target="_blank" rel="noopener noreferrer">Read Story</a>
      </article>
    `;
  }).join('');

  list.insertAdjacentHTML('beforeend', markup);
}

async function searchNews(reset = false) {
  const meta = document.getElementById('news-meta');
  const loadMoreBtn = document.getElementById('news-load-more');
  if (loadMoreBtn) loadMoreBtn.disabled = true;

  if (reset) {
    newsState.page = 0;
    newsState.hasNextPage = true;
    const list = document.getElementById('news-list');
    if (list) list.innerHTML = '';
  }

  if (!newsState.hasNextPage) {
    if (meta) meta.textContent = 'No more results';
    if (loadMoreBtn) loadMoreBtn.disabled = false;
    return;
  }

  newsClearError();
  if (meta) meta.textContent = `Loading page ${newsState.page + 1}...`;

  try {
    const data = await fetchNews(newsState.query, newsState.page);
    appendNews(data.hits || []);
    newsState.page += 1;
    newsState.hasNextPage = newsState.page < (data.nbPages || 0);

    if (meta) meta.textContent = `${data.nbHits || 0} results for "${newsState.query}"`;
    if (loadMoreBtn) loadMoreBtn.disabled = !newsState.hasNextPage;
  } catch (error) {
    newsShowError(error.message);
    if (meta) meta.textContent = 'Unable to load news';
    if (loadMoreBtn) loadMoreBtn.disabled = false;
  }
}

function initNewsFeed() {
  document.getElementById('news-search')?.addEventListener('click', () => {
    newsState.query = document.getElementById('news-query')?.value.trim() || 'javascript';
    searchNews(true);
  });

  document.getElementById('news-query')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      newsState.query = event.target.value.trim() || 'javascript';
      searchNews(true);
    }
  });

  document.getElementById('news-load-more')?.addEventListener('click', () => searchNews(false));

  searchNews(true);
}

document.addEventListener('DOMContentLoaded', initNewsFeed);
