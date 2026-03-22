/**
 * Frontend App Logic
 * Displays products from GitHub-hosted JSON
 */

let appData = { items: [] };
const uiState = {
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name-asc',
  viewType: localStorage.getItem('cms_view_type') || 'cards',
};

/**
 * Fetch data from GitHub
 */
async function fetchDataFromGitHub() {
  try {
    // Priority order to find owner and repo:
    // 1. URL parameters: ?owner=X&repo=Y
    // 2. localStorage: from admin panel login
    // 3. Window defaults: set in index.html
    
    let owner = null;
    let repo = null;
    let branch = null;
    
    // Priority 1: URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlOwner = params.get('owner');
    const urlRepo = params.get('repo');
    const urlBranch = params.get('branch');
    if (urlOwner) owner = urlOwner;
    if (urlRepo) repo = urlRepo;
    if (urlBranch) branch = urlBranch;
    
    // Priority 2: localStorage (from admin.html login)
    if (!owner) owner = localStorage.getItem('cms_owner');
    if (!repo) repo = localStorage.getItem('cms_repo');
    if (!branch) branch = localStorage.getItem('cms_branch');
    
    // Priority 3: Window defaults (set in index.html script tag)
    if (!owner) owner = window.CMS_DEFAULT_OWNER;
    if (!repo) repo = window.CMS_DEFAULT_REPO;
    if (!branch) branch = window.CMS_DEFAULT_BRANCH || 'main';
    
    // Check if we have both owner and repo
    if (!owner || !repo) {
      showError(`No repository configured.

    To connect your own repo:
    1) Sign in once at admin.html (auto-saves owner/repo/branch), or
    2) Open with URL parameters: index.html?owner=USERNAME&repo=REPO&branch=main, or
    3) Set window.CMS_DEFAULT_OWNER / window.CMS_DEFAULT_REPO in index.html.`);
      return false;
    }

    // Initialize API without token (works for public repos)
    const github = new GitHubAPI(owner, repo, branch, null);

    // Fetch data
    const fetchedData = await github.fetchData();
    appData = fetchedData.data;

    // Store for future use
    localStorage.setItem('cms_owner', owner);
    localStorage.setItem('cms_repo', repo);
    localStorage.setItem('cms_branch', branch);

    return true;
  } catch (error) {
    showError(`❌ Failed to load data: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Build visible items based on current UI state
 */
function getVisibleItems() {
  const query = uiState.searchQuery.toLowerCase();
  let visibleItems = [...(appData.items || [])];

  if (uiState.selectedCategory !== 'all') {
    visibleItems = visibleItems.filter((item) => (item.category || '').toLowerCase() === uiState.selectedCategory.toLowerCase());
  }

  if (query) {
    visibleItems = visibleItems.filter((item) => {
      return (
        (item.name || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query)
      );
    });
  }

  if (uiState.sortBy === 'name-asc') {
    visibleItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (uiState.sortBy === 'name-desc') {
    visibleItems.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (uiState.sortBy === 'price-asc') {
    visibleItems.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (uiState.sortBy === 'price-desc') {
    visibleItems.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  return visibleItems;
}

/**
 * Render visible items
 */
function displayItems() {
  const container = document.getElementById('items-container');
  const visibleItems = getVisibleItems();

  if (!visibleItems.length) {
    container.className = 'items-grid';
    container.innerHTML = '<p class="empty-state">No items found</p>';
    return;
  }

  if (uiState.viewType === 'table') {
    displayAsTable(container, visibleItems);
    return;
  }

  displayAsCards(container, visibleItems);
}

/**
 * Display items as cards
 */
function displayAsCards(container, items) {
  container.innerHTML = '';
  container.className = 'items-grid';

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      ${item.image ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div>` : '<div class="item-image item-image-placeholder"><img src="assets/icon-image.svg" alt="No image" width="28" height="28"><span>No image</span></div>'}
      <div class="item-content">
        <h3 class="item-name">${escapeHtml(item.name)}</h3>
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

/**
 * Display items as table
 */
function displayAsTable(container, items) {
  container.innerHTML = '';
  container.className = '';
  
  const table = document.createElement('table');
  table.className = 'items-table';

  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Description</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.category || 'N/A')}</td>
      <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
      <td>${escapeHtml((item.description || '').substring(0, 50))}${(item.description || '').length > 50 ? '...' : ''}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = String(message).trim();
    errorDiv.style.display = 'block';
  } else {
    alert(String(message).trim());
  }
}

/**
 * Filter items by category
 */
function filterByCategory(category) {
  uiState.selectedCategory = category;
  displayItems();
}

/**
 * Populate category dropdown from data
 */
function populateCategoryFilter() {
  const categorySelect = document.getElementById('category-filter');
  if (!categorySelect) return;

  const categories = Array.from(
    new Set(
      (appData.items || [])
        .map((item) => (item.category || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const options = ['<option value="all">All Categories</option>'];
  categories.forEach((category) => {
    options.push(`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
  });

  categorySelect.innerHTML = options.join('');
  categorySelect.value = uiState.selectedCategory;
}

/**
 * Search items
 */
function searchItems() {
  uiState.searchQuery = document.getElementById('search-input')?.value.trim() || '';
  displayItems();
}

/**
 * Sort items
 */
function sortItems(sortBy) {
  uiState.sortBy = sortBy;
  displayItems();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce helper
 */
function debounce(fn, wait = 120) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Initialize app on page load
 */
async function initApp() {
  const loadingDiv = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  
  // Show loading
  if (loadingDiv) {
    loadingDiv.style.display = 'block';
  }

  // Fetch data
  const success = await fetchDataFromGitHub();

  // Hide loading
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }

  // Show main content after data loads
  if (mainContent) {
    mainContent.style.display = 'block';
  }

  if (success) {
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-filter');
    const sortSelect = document.getElementById('sort-select');
    const viewToggle = document.getElementById('view-toggle');

    if (sortSelect) {
      uiState.sortBy = sortSelect.value || uiState.sortBy;
    }

    if (viewToggle) {
      viewToggle.value = uiState.viewType;
    }

    populateCategoryFilter();

    // Display items
    displayItems();

    // Set up search
    if (searchInput) {
      searchInput.addEventListener('input', debounce(searchItems, 120));
    }

    // Set up category filter
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
      });
    }

    // Set up sort
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortItems(e.target.value);
      });
    }

    // Set up view type toggle
    if (viewToggle) {
      viewToggle.addEventListener('change', (e) => {
        uiState.viewType = e.target.value;
        localStorage.setItem('cms_view_type', uiState.viewType);
        displayItems();
      });
    }
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
