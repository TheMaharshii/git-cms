function ghShowError(message) {
  const el = document.getElementById('gh-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function ghClearError() {
  const el = document.getElementById('gh-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function fmtNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

async function searchRepos(query, sort) {
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', query || 'javascript');
  url.searchParams.set('sort', sort || 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', '24');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GitHub search failed (${res.status})`);
  return res.json();
}

function renderRepos(items) {
  const grid = document.getElementById('gh-results');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<p class="empty-state">No repositories found.</p>';
    return;
  }

  grid.innerHTML = items.map((repo) => `
    <article class="api-card">
      <h3>${repo.full_name}</h3>
      <p>${repo.description || 'No description provided.'}</p>
      <p>⭐ ${fmtNumber(repo.stargazers_count)} · 🍴 ${fmtNumber(repo.forks_count)} · Issues: ${fmtNumber(repo.open_issues_count)}</p>
      <a class="btn btn-secondary btn-sm" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">Open Repo</a>
    </article>
  `).join('');
}

async function runSearch() {
  const query = document.getElementById('gh-query')?.value.trim() || 'javascript tools';
  const sort = document.getElementById('gh-sort')?.value || 'stars';
  const meta = document.getElementById('gh-meta');

  ghClearError();
  if (meta) meta.textContent = 'Searching repositories...';

  try {
    const data = await searchRepos(query, sort);
    renderRepos(Array.isArray(data.items) ? data.items : []);
    if (meta) meta.textContent = `${data.total_count || 0} results (top 24 shown)`;
  } catch (error) {
    ghShowError(error.message);
    if (meta) meta.textContent = 'Search failed';
  }
}

function initGitHubExplorer() {
  document.getElementById('gh-search-btn')?.addEventListener('click', runSearch);
  document.getElementById('gh-query')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });

  runSearch();
}

document.addEventListener('DOMContentLoaded', initGitHubExplorer);
