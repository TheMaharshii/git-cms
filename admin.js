/**
 * Advanced Admin Panel Logic
 */

const DRAFT_KEY = 'gitcms_admin_form_draft_v1';
const FILTER_KEY = 'gitcms_admin_filter_state_v1';
const HISTORY_LIMIT = 60;

let github = null;
let currentData = { items: [] };
let currentUser = null;
let isEditMode = false;
let editingItemId = null;

const adminState = {
  searchQuery: '',
  category: 'all',
  minPrice: '',
  maxPrice: '',
  sortBy: 'name-asc',
  page: 1,
  pageSize: 20,
  selectedIds: new Set(),
  undoStack: [],
  redoStack: [],
  dirty: false,
};

const authSection = document.getElementById('auth-section');
const adminSection = document.getElementById('admin-section');
const settingsForm = document.getElementById('settings-form');
const logoutBtn = document.getElementById('logout-btn');
const validateBtn = document.getElementById('validate-btn');
const statusMessage = document.getElementById('status-message');
const loadingSpinner = document.getElementById('loading-spinner');

const itemForm = document.getElementById('item-form');
const itemsTableBody = document.getElementById('items-table-body');
const formSubmitBtn = document.getElementById('form-submit-btn');
const formResetBtn = document.getElementById('form-reset-btn');

const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const itemDescriptionInput = document.getElementById('item-description');
const itemImageInput = document.getElementById('item-image');
const itemCategoryInput = document.getElementById('item-category');

const searchInput = document.getElementById('search-input');
const adminCategoryFilter = document.getElementById('admin-category-filter');
const adminMinPriceInput = document.getElementById('admin-min-price');
const adminMaxPriceInput = document.getElementById('admin-max-price');
const adminSortSelect = document.getElementById('admin-sort-select');
const adminPageSizeSelect = document.getElementById('admin-page-size');
const adminPagination = document.getElementById('admin-pagination');
const adminSummary = document.getElementById('admin-summary');

const saveAllBtn = document.getElementById('save-all-btn');
const reloadDataBtn = document.getElementById('reload-data-btn');

const showTokenCheckbox = document.getElementById('show-token');
const tokenInput = document.getElementById('github-token');
const selectVisibleCheckbox = document.getElementById('select-visible-checkbox');

const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const bulkCategoryInput = document.getElementById('bulk-category-input');
const bulkCategoryApplyBtn = document.getElementById('bulk-category-apply');
const bulkPriceInput = document.getElementById('bulk-price-input');
const bulkPriceApplyBtn = document.getElementById('bulk-price-apply');

const validateDataBtn = document.getElementById('validate-data-btn');
const normalizeCategoriesBtn = document.getElementById('normalize-categories-btn');
const dedupeIdsBtn = document.getElementById('dedupe-ids-btn');
const quickSampleBtn = document.getElementById('quick-sample-btn');

const exportAllBtn = document.getElementById('export-all-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportVisibleJsonBtn = document.getElementById('export-visible-json-btn');
const importFileInput = document.getElementById('import-file');
const importModeSelect = document.getElementById('import-mode');

const duplicateCurrentBtn = document.getElementById('duplicate-current-btn');
const generateIdBtn = document.getElementById('generate-id-btn');
const generateImageBtn = document.getElementById('generate-image-btn');
const restoreDraftBtn = document.getElementById('restore-draft-btn');
const clearDraftBtn = document.getElementById('clear-draft-btn');
const imagePreview = document.getElementById('image-preview');
const imagePreviewEmpty = document.getElementById('image-preview-empty');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const jsonPreview = document.getElementById('json-preview');

function showMessage(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `message message-${type}`;
  statusMessage.style.display = 'block';

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 4000);
  }
}

function setLoading(loading) {
  loadingSpinner.style.display = loading ? 'block' : 'none';
}

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function generateUniqueId() {
  return `prod_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomPicsumImageUrl() {
  const imageId = randomInt(1, 300);
  const width = randomInt(1700, 2300);
  const height = randomInt(600, 2000);
  return `https://picsum.photos/id/${imageId}/${width}/${height}`;
}

function normalizeDataShape(data) {
  if (!data || !Array.isArray(data.items)) {
    return { items: [] };
  }

  return {
    ...data,
    items: data.items.map((item, index) => {
      const id = String(item?.id || '').trim() || `prod_import_${Date.now()}_${index}`;
      return {
        id,
        name: String(item?.name || '').trim(),
        price: Number(item?.price || 0),
        description: String(item?.description || '').trim(),
        image: String(item?.image || '').trim(),
        category: String(item?.category || '').trim(),
      };
    }),
  };
}

function snapshotState() {
  return deepClone(currentData);
}

function pushUndoSnapshot() {
  adminState.undoStack.push(snapshotState());
  if (adminState.undoStack.length > HISTORY_LIMIT) {
    adminState.undoStack.shift();
  }
  adminState.redoStack = [];
  updateHistoryButtons();
}

function restoreFromSnapshot(snapshot) {
  currentData = normalizeDataShape(snapshot);
  cleanupSelectedIds();
  renderAll();
  markDirty();
}

function markDirty() {
  adminState.dirty = true;
  if (saveAllBtn) {
    saveAllBtn.textContent = 'Save Changes *';
  }
}

function clearDirty() {
  adminState.dirty = false;
  if (saveAllBtn) {
    saveAllBtn.textContent = 'Save Changes';
  }
}

function updateHistoryButtons() {
  if (undoBtn) undoBtn.disabled = adminState.undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = adminState.redoStack.length === 0;
}

function toTitleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function getCategoriesWithCounts() {
  const counts = new Map();
  currentData.items.forEach((item) => {
    const category = item.category || 'Uncategorized';
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  return counts;
}

function populateCategoryFilter() {
  if (!adminCategoryFilter) return;
  const categoryCounts = getCategoriesWithCounts();
  const categories = Array.from(categoryCounts.keys()).sort((a, b) => a.localeCompare(b));

  adminCategoryFilter.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = `All Categories (${currentData.items.length})`;
  adminCategoryFilter.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `${category} (${categoryCounts.get(category)})`;
    adminCategoryFilter.appendChild(option);
  });

  if (![...categories, 'all'].includes(adminState.category)) {
    adminState.category = 'all';
  }
  adminCategoryFilter.value = adminState.category;
}

function getFilteredItems() {
  const query = adminState.searchQuery.toLowerCase();
  const minPrice = adminState.minPrice === '' ? null : Number(adminState.minPrice);
  const maxPrice = adminState.maxPrice === '' ? null : Number(adminState.maxPrice);

  let items = [...currentData.items];

  if (adminState.category !== 'all') {
    items = items.filter((item) => (item.category || '').toLowerCase() === adminState.category.toLowerCase());
  }

  if (query) {
    const parts = query.split(/\s+/).filter(Boolean);
    items = items.filter((item) => {
      const bag = `${item.id} ${item.name} ${item.category} ${item.description}`.toLowerCase();
      return parts.every((part) => bag.includes(part));
    });
  }

  if (minPrice !== null && !Number.isNaN(minPrice)) {
    items = items.filter((item) => Number(item.price || 0) >= minPrice);
  }

  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    items = items.filter((item) => Number(item.price || 0) <= maxPrice);
  }

  if (adminState.sortBy === 'name-asc') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (adminState.sortBy === 'name-desc') {
    items.sort((a, b) => b.name.localeCompare(a.name));
  } else if (adminState.sortBy === 'price-asc') {
    items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (adminState.sortBy === 'price-desc') {
    items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (adminState.sortBy === 'category-asc') {
    items.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }

  return items;
}

function getPagedItems(filteredItems) {
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / adminState.pageSize));
  adminState.page = Math.min(Math.max(1, adminState.page), totalPages);

  const start = (adminState.page - 1) * adminState.pageSize;
  const end = start + adminState.pageSize;

  return {
    pageItems: filteredItems.slice(start, end),
    totalPages,
  };
}

function createItemRow(item) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="checkbox" class="row-select" data-id="${escapeHtml(item.id)}" ${adminState.selectedIds.has(item.id) ? 'checked' : ''}></td>
    <td>${escapeHtml(item.id)}</td>
    <td>${escapeHtml(item.name)}</td>
    <td>$${Number(item.price || 0).toFixed(2)}</td>
    <td>${escapeHtml(item.category || 'N/A')}</td>
    <td>${escapeHtml((item.description || '').slice(0, 80))}${(item.description || '').length > 80 ? '...' : ''}</td>
    <td>
      <button class="btn btn-sm btn-edit" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button>
      <button class="btn btn-sm btn-delete" data-action="delete" data-id="${escapeHtml(item.id)}">Delete</button>
      <button class="btn btn-sm btn-secondary" data-action="duplicate" data-id="${escapeHtml(item.id)}">Duplicate</button>
    </td>
  `;
  return tr;
}

function renderTable() {
  const filteredItems = getFilteredItems();
  const { pageItems, totalPages } = getPagedItems(filteredItems);

  itemsTableBody.innerHTML = '';

  if (!pageItems.length) {
    itemsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No items match current filters.</td></tr>';
  } else {
    const fragment = document.createDocumentFragment();
    pageItems.forEach((item) => {
      fragment.appendChild(createItemRow(item));
    });
    itemsTableBody.appendChild(fragment);
  }

  if (adminSummary) {
    adminSummary.textContent = `${filteredItems.length} visible · ${adminState.selectedIds.size} selected · Page ${adminState.page} / ${totalPages}`;
  }

  renderPagination(totalPages);
  syncSelectVisibleCheckbox(pageItems);
}

function renderPagination(totalPages) {
  if (!adminPagination) return;

  adminPagination.innerHTML = `
    <button class="btn btn-secondary" type="button" id="admin-prev-page" ${adminState.page <= 1 ? 'disabled' : ''}>Prev</button>
    <span class="page-chip">Page ${adminState.page} / ${totalPages}</span>
    <button class="btn btn-secondary" type="button" id="admin-next-page" ${adminState.page >= totalPages ? 'disabled' : ''}>Next</button>
  `;
}

function syncSelectVisibleCheckbox(pageItems) {
  if (!selectVisibleCheckbox) return;
  const visibleIds = pageItems.map((item) => item.id);
  if (!visibleIds.length) {
    selectVisibleCheckbox.checked = false;
    return;
  }
  selectVisibleCheckbox.checked = visibleIds.every((id) => adminState.selectedIds.has(id));
}

function renderStats() {
  const items = currentData.items;
  const totalItems = items.length;
  const categories = new Set(items.map((item) => item.category || 'Uncategorized')).size;
  const totalValue = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const avgPrice = totalItems ? totalValue / totalItems : 0;
  const missingImage = items.filter((item) => !String(item.image || '').trim()).length;
  const uncategorized = items.filter((item) => !String(item.category || '').trim()).length;

  document.getElementById('stat-total-items').textContent = String(totalItems);
  document.getElementById('stat-categories').textContent = String(categories);
  document.getElementById('stat-avg-price').textContent = `$${avgPrice.toFixed(2)}`;
  document.getElementById('stat-total-value').textContent = `$${totalValue.toFixed(2)}`;
  document.getElementById('stat-missing-image').textContent = String(missingImage);
  document.getElementById('stat-uncategorized').textContent = String(uncategorized);
}

function renderJsonPreview() {
  if (!jsonPreview) return;
  const preview = {
    items: currentData.items,
    meta: {
      total: currentData.items.length,
      generatedAt: new Date().toISOString(),
    },
  };
  jsonPreview.textContent = JSON.stringify(preview, null, 2);
}

function renderAll() {
  populateCategoryFilter();
  renderStats();
  renderTable();
  renderJsonPreview();
  saveFilterState();
  updateHistoryButtons();
}

function saveFilterState() {
  const state = {
    searchQuery: adminState.searchQuery,
    category: adminState.category,
    minPrice: adminState.minPrice,
    maxPrice: adminState.maxPrice,
    sortBy: adminState.sortBy,
    pageSize: adminState.pageSize,
  };
  localStorage.setItem(FILTER_KEY, JSON.stringify(state));
}

function restoreFilterState() {
  try {
    const state = JSON.parse(localStorage.getItem(FILTER_KEY) || '{}');
    adminState.searchQuery = String(state.searchQuery || '');
    adminState.category = String(state.category || 'all');
    adminState.minPrice = state.minPrice ?? '';
    adminState.maxPrice = state.maxPrice ?? '';
    adminState.sortBy = String(state.sortBy || 'name-asc');
    const pageSize = Number(state.pageSize);
    adminState.pageSize = [10, 20, 50, 100].includes(pageSize) ? pageSize : 20;
  } catch {
    adminState.pageSize = 20;
  }
}

function applyFilterInputs() {
  if (searchInput) searchInput.value = adminState.searchQuery;
  if (adminMinPriceInput) adminMinPriceInput.value = adminState.minPrice;
  if (adminMaxPriceInput) adminMaxPriceInput.value = adminState.maxPrice;
  if (adminSortSelect) adminSortSelect.value = adminState.sortBy;
  if (adminPageSizeSelect) adminPageSizeSelect.value = String(adminState.pageSize);
}

function saveDraft() {
  const draft = {
    id: itemIdInput.value.trim(),
    name: itemNameInput.value.trim(),
    price: itemPriceInput.value.trim(),
    category: itemCategoryInput.value.trim(),
    image: itemImageInput.value.trim(),
    description: itemDescriptionInput.value.trim(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    if (!draft || !Object.keys(draft).length) {
      showMessage('No saved draft found.', 'info');
      return;
    }
    itemIdInput.value = draft.id || generateUniqueId();
    itemNameInput.value = draft.name || '';
    itemPriceInput.value = draft.price || '';
    itemCategoryInput.value = draft.category || '';
    itemImageInput.value = draft.image || '';
    itemDescriptionInput.value = draft.description || '';
    updateImagePreview();
    showMessage('Draft restored.', 'success');
  } catch {
    showMessage('Failed to restore draft.', 'error');
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  showMessage('Draft cleared.', 'info');
}

function resetForm() {
  isEditMode = false;
  editingItemId = null;
  itemForm.reset();
  itemIdInput.value = generateUniqueId();
  formSubmitBtn.textContent = 'Add Item';
  formResetBtn.textContent = 'Clear';
  updateImagePreview();
  saveDraft();
}

function updateImagePreview() {
  const url = itemImageInput.value.trim();
  if (!url) {
    imagePreview.removeAttribute('src');
    imagePreview.style.display = 'none';
    imagePreviewEmpty.style.display = 'inline';
    return;
  }
  imagePreview.src = url;
  imagePreview.style.display = 'block';
  imagePreviewEmpty.style.display = 'none';
  imagePreview.onerror = () => {
    imagePreview.style.display = 'none';
    imagePreviewEmpty.style.display = 'inline';
    imagePreviewEmpty.textContent = 'Image failed to load';
  };
}

function validateItemPayload(item) {
  if (!item.name) {
    return 'Item name is required.';
  }
  if (Number(item.price) < 0) {
    return 'Price cannot be negative.';
  }
  if (item.image && !/^https?:\/\//i.test(item.image)) {
    return 'Image URL must start with http:// or https://';
  }
  return null;
}

function getItemFromForm() {
  return {
    id: itemIdInput.value.trim() || generateUniqueId(),
    name: itemNameInput.value.trim(),
    price: Number(itemPriceInput.value || 0),
    category: itemCategoryInput.value.trim(),
    image: itemImageInput.value.trim(),
    description: itemDescriptionInput.value.trim(),
  };
}

function editItem(itemId) {
  const item = currentData.items.find((entry) => entry.id === itemId);
  if (!item) return;

  isEditMode = true;
  editingItemId = itemId;
  itemIdInput.value = item.id;
  itemNameInput.value = item.name;
  itemPriceInput.value = String(item.price || '');
  itemCategoryInput.value = item.category || '';
  itemImageInput.value = item.image || '';
  itemDescriptionInput.value = item.description || '';
  formSubmitBtn.textContent = 'Update Item';
  formResetBtn.textContent = 'Cancel';
  updateImagePreview();

  itemForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function duplicateItem(itemId, direct = false) {
  const item = currentData.items.find((entry) => entry.id === itemId);
  if (!item) return;

  const duplicate = {
    ...item,
    id: generateUniqueId(),
    name: `${item.name} (Copy)`,
  };

  pushUndoSnapshot();
  currentData.items.push(duplicate);
  markDirty();
  renderAll();

  if (direct) {
    showMessage('Item duplicated.', 'success');
  } else {
    editItem(duplicate.id);
    showMessage('Duplicate loaded into form for editing.', 'success');
  }
}

function deleteItem(itemId) {
  const item = currentData.items.find((entry) => entry.id === itemId);
  if (!item) return;

  if (!confirm(`Delete item "${item.name}"?`)) return;

  pushUndoSnapshot();
  currentData.items = currentData.items.filter((entry) => entry.id !== itemId);
  adminState.selectedIds.delete(itemId);
  markDirty();
  renderAll();
  showMessage('Item deleted (not yet saved to GitHub).', 'success');
}

async function saveItem(e) {
  e.preventDefault();

  const payload = getItemFromForm();
  const validationMessage = validateItemPayload(payload);
  if (validationMessage) {
    showMessage(validationMessage, 'error');
    return;
  }

  const duplicateIdFound = currentData.items.some((item) => item.id === payload.id && item.id !== editingItemId);
  if (duplicateIdFound) {
    showMessage('Duplicate ID detected. Generate a new ID.', 'error');
    return;
  }

  pushUndoSnapshot();

  if (isEditMode) {
    const index = currentData.items.findIndex((item) => item.id === editingItemId);
    if (index === -1) {
      showMessage('Item not found for update.', 'error');
      return;
    }
    currentData.items[index] = payload;
    showMessage('Item updated locally.', 'success');
  } else {
    currentData.items.push(payload);
    showMessage('Item added locally.', 'success');
  }

  markDirty();
  resetForm();
  renderAll();
}

async function saveToGitHub(message) {
  if (!github) {
    showMessage('Please authenticate first.', 'error');
    return false;
  }

  setLoading(true);
  try {
    await github.updateData(currentData, message);
    clearDirty();
    showMessage('Changes saved to GitHub.', 'success');
    return true;
  } catch (error) {
    showMessage(`GitHub save failed: ${error.message}`, 'error');
    return false;
  } finally {
    setLoading(false);
  }
}

async function saveAllChanges() {
  if (!adminState.dirty) {
    showMessage('No pending changes to save.', 'info');
    return;
  }
  await saveToGitHub('Admin batch changes');
}

async function authenticateWithGitHub(e) {
  e.preventDefault();

  const username = document.getElementById('github-username').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim() || 'main';
  const token = tokenInput.value.trim();

  if (!username || !repo || !token) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  setLoading(true);
  try {
    github = new GitHubAPI(username, repo, branch, token);
    const validation = await github.validateRepository();
    showMessage(`Connected to ${validation.owner}/${validation.repo}`, 'success');

    const fetchedData = await github.fetchData();
    currentData = normalizeDataShape(fetchedData.data);
    currentUser = { username, repo, branch };

    authSection.style.display = 'none';
    adminSection.style.display = 'block';
    document.getElementById('current-user').textContent = `${username}/${repo} (${branch})`;

    localStorage.setItem('cms_owner', username);
    localStorage.setItem('cms_repo', repo);
    localStorage.setItem('cms_branch', branch);

    restoreFilterState();
    applyFilterInputs();
    resetForm();
    renderAll();
  } catch (error) {
    showMessage(`Authentication failed: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

async function validateRepository(e) {
  e.preventDefault();

  const username = document.getElementById('github-username').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim() || 'main';
  const token = tokenInput.value.trim();

  if (!username || !repo || !token) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  setLoading(true);
  try {
    const tempGitHub = new GitHubAPI(username, repo, branch, token);
    const validation = await tempGitHub.validateRepository();
    showMessage(`Repository OK: ${validation.owner}/${validation.repo} (${branch})`, 'success');
  } catch (error) {
    showMessage(`Validation failed: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

function logout() {
  if (adminState.dirty && !confirm('You have unsaved changes. Logout anyway?')) {
    return;
  }

  github = null;
  currentUser = null;
  currentData = { items: [] };
  adminState.selectedIds = new Set();
  adminState.undoStack = [];
  adminState.redoStack = [];
  clearDirty();

  authSection.style.display = 'block';
  adminSection.style.display = 'none';
  settingsForm.reset();
  itemForm.reset();

  showMessage('Signed out successfully.', 'success');
}

async function reloadFromGitHub() {
  if (!github) {
    showMessage('Authenticate first to reload.', 'error');
    return;
  }

  if (adminState.dirty && !confirm('Discard local unsaved changes and reload from GitHub?')) {
    return;
  }

  setLoading(true);
  try {
    const fetchedData = await github.fetchData();
    currentData = normalizeDataShape(fetchedData.data);
    adminState.selectedIds = new Set();
    adminState.undoStack = [];
    adminState.redoStack = [];
    clearDirty();
    renderAll();
    showMessage('Reloaded latest data from GitHub.', 'success');
  } catch (error) {
    showMessage(`Reload failed: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

function cleanupSelectedIds() {
  const knownIds = new Set(currentData.items.map((item) => item.id));
  adminState.selectedIds.forEach((id) => {
    if (!knownIds.has(id)) adminState.selectedIds.delete(id);
  });
}

function toggleSelectVisible() {
  const filtered = getFilteredItems();
  const { pageItems } = getPagedItems(filtered);
  const visibleIds = pageItems.map((item) => item.id);

  if (selectVisibleCheckbox.checked) {
    visibleIds.forEach((id) => adminState.selectedIds.add(id));
  } else {
    visibleIds.forEach((id) => adminState.selectedIds.delete(id));
  }

  renderTable();
}

function deleteSelected() {
  if (!adminState.selectedIds.size) {
    showMessage('No selected items to delete.', 'info');
    return;
  }

  if (!confirm(`Delete ${adminState.selectedIds.size} selected items?`)) return;

  pushUndoSnapshot();
  currentData.items = currentData.items.filter((item) => !adminState.selectedIds.has(item.id));
  adminState.selectedIds = new Set();
  markDirty();
  renderAll();
  showMessage('Selected items deleted locally.', 'success');
}

function applyBulkCategory() {
  const nextCategory = bulkCategoryInput.value.trim();
  if (!nextCategory) {
    showMessage('Enter a category value for bulk apply.', 'error');
    return;
  }

  if (!adminState.selectedIds.size) {
    showMessage('Select items first.', 'info');
    return;
  }

  pushUndoSnapshot();
  currentData.items = currentData.items.map((item) => {
    if (!adminState.selectedIds.has(item.id)) return item;
    return { ...item, category: nextCategory };
  });

  markDirty();
  renderAll();
  showMessage('Bulk category applied.', 'success');
}

function applyBulkPriceAdjust() {
  const percent = Number(bulkPriceInput.value);
  if (Number.isNaN(percent)) {
    showMessage('Enter a valid percentage. Example: 10 or -5', 'error');
    return;
  }

  if (!adminState.selectedIds.size) {
    showMessage('Select items first.', 'info');
    return;
  }

  const multiplier = 1 + (percent / 100);

  pushUndoSnapshot();
  currentData.items = currentData.items.map((item) => {
    if (!adminState.selectedIds.has(item.id)) return item;
    const nextPrice = Math.max(0, Number(item.price || 0) * multiplier);
    return { ...item, price: Number(nextPrice.toFixed(2)) };
  });

  markDirty();
  renderAll();
  showMessage(`Adjusted selected prices by ${percent}%.`, 'success');
}

function validateDataQuality() {
  const issues = [];
  const ids = new Set();

  currentData.items.forEach((item, index) => {
    if (!item.name) issues.push(`Row ${index + 1}: missing name`);
    if (item.price < 0 || Number.isNaN(Number(item.price))) issues.push(`Row ${index + 1}: invalid price`);
    if (ids.has(item.id)) issues.push(`Row ${index + 1}: duplicate ID (${item.id})`);
    ids.add(item.id);
  });

  if (!issues.length) {
    showMessage('Validation passed: no issues found.', 'success');
    return;
  }

  showMessage(`Validation found ${issues.length} issue(s): ${issues.slice(0, 5).join(' | ')}${issues.length > 5 ? ' ...' : ''}`, 'warning');
}

function normalizeCategories() {
  pushUndoSnapshot();
  currentData.items = currentData.items.map((item) => ({
    ...item,
    category: item.category ? toTitleCase(item.category) : item.category,
  }));
  markDirty();
  renderAll();
  showMessage('Categories normalized to title case.', 'success');
}

function fixDuplicateIds() {
  pushUndoSnapshot();
  const seen = new Set();
  let fixedCount = 0;

  currentData.items = currentData.items.map((item) => {
    let id = String(item.id || '').trim() || generateUniqueId();
    if (!seen.has(id)) {
      seen.add(id);
      return { ...item, id };
    }

    fixedCount += 1;
    let next = `${id}_dup`;
    let i = 1;
    while (seen.has(next)) {
      next = `${id}_dup${i}`;
      i += 1;
    }
    seen.add(next);
    return { ...item, id: next };
  });

  if (!fixedCount) {
    adminState.undoStack.pop();
    showMessage('No duplicate IDs found.', 'info');
    return;
  }

  markDirty();
  renderAll();
  showMessage(`Fixed ${fixedCount} duplicate ID(s).`, 'success');
}

function addQuickSample() {
  const sample = {
    id: generateUniqueId(),
    name: `Sample Product ${currentData.items.length + 1}`,
    price: 49.99,
    category: 'Sample',
    image: generateRandomPicsumImageUrl(),
    description: 'Quick sample item generated from admin utility.',
  };

  pushUndoSnapshot();
  currentData.items.push(sample);
  markDirty();
  renderAll();
  showMessage('Sample item added.', 'success');
}

function exportData() {
  const dataStr = JSON.stringify(currentData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('Exported full JSON.', 'success');
}

function exportVisibleJson() {
  const visible = getFilteredItems();
  const payload = {
    items: visible,
    meta: {
      total: visible.length,
      exportedAt: new Date().toISOString(),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-visible-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('Exported visible items as JSON.', 'success');
}

function exportCsv() {
  const rows = getFilteredItems();
  const headers = ['id', 'name', 'price', 'category', 'description', 'image'];
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const lines = [headers.join(',')];
  rows.forEach((item) => {
    lines.push([
      escapeCsv(item.id),
      escapeCsv(item.name),
      escapeCsv(item.price),
      escapeCsv(item.category),
      escapeCsv(item.description),
      escapeCsv(item.image),
    ].join(','));
  });

  const csvBlob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-visible-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('Exported visible items as CSV.', 'success');
}

async function importDataFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = normalizeDataShape(JSON.parse(text));

    if (!Array.isArray(imported.items)) {
      throw new Error('Invalid JSON: expected items array.');
    }

    const mode = importModeSelect.value;
    pushUndoSnapshot();

    if (mode === 'replace') {
      if (!confirm(`Replace all current ${currentData.items.length} items with imported ${imported.items.length} items?`)) {
        adminState.undoStack.pop();
        event.target.value = '';
        return;
      }
      currentData = imported;
    } else {
      const existingIds = new Set(currentData.items.map((item) => item.id));
      const merged = [...currentData.items];
      imported.items.forEach((item) => {
        let id = item.id;
        while (existingIds.has(id)) {
          id = `${id}_m${Math.floor(Math.random() * 1000)}`;
        }
        existingIds.add(id);
        merged.push({ ...item, id });
      });
      currentData.items = merged;
    }

    adminState.selectedIds = new Set();
    markDirty();
    renderAll();
    showMessage(`Imported ${imported.items.length} item(s) in ${mode} mode.`, 'success');
  } catch (error) {
    showMessage(`Import failed: ${error.message}`, 'error');
  } finally {
    event.target.value = '';
  }
}

function duplicateCurrentForm() {
  const payload = getItemFromForm();
  if (!payload.name) {
    showMessage('Enter at least the item name before duplicating.', 'info');
    return;
  }
  payload.id = generateUniqueId();
  payload.name = `${payload.name} (Copy)`;

  pushUndoSnapshot();
  currentData.items.push(payload);
  markDirty();
  renderAll();
  showMessage('Current form duplicated as new item.', 'success');
}

function undoLastChange() {
  if (!adminState.undoStack.length) return;
  adminState.redoStack.push(snapshotState());
  const previous = adminState.undoStack.pop();
  currentData = normalizeDataShape(previous);
  cleanupSelectedIds();
  markDirty();
  renderAll();
}

function redoLastChange() {
  if (!adminState.redoStack.length) return;
  adminState.undoStack.push(snapshotState());
  const next = adminState.redoStack.pop();
  currentData = normalizeDataShape(next);
  cleanupSelectedIds();
  markDirty();
  renderAll();
}

function clearAdminFilters() {
  adminState.searchQuery = '';
  adminState.category = 'all';
  adminState.minPrice = '';
  adminState.maxPrice = '';
  adminState.sortBy = 'name-asc';
  adminState.page = 1;
  applyFilterInputs();
  renderAll();
}

function bindFilterEvents() {
  const debounce = (fn, wait = 140) => {
    let timeout = null;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  searchInput?.addEventListener('input', debounce((e) => {
    adminState.searchQuery = e.target.value.trim();
    adminState.page = 1;
    renderTable();
  }));

  adminCategoryFilter?.addEventListener('change', (e) => {
    adminState.category = e.target.value;
    adminState.page = 1;
    renderTable();
  });

  adminMinPriceInput?.addEventListener('input', debounce((e) => {
    adminState.minPrice = e.target.value.trim();
    adminState.page = 1;
    renderTable();
  }));

  adminMaxPriceInput?.addEventListener('input', debounce((e) => {
    adminState.maxPrice = e.target.value.trim();
    adminState.page = 1;
    renderTable();
  }));

  adminSortSelect?.addEventListener('change', (e) => {
    adminState.sortBy = e.target.value;
    adminState.page = 1;
    renderTable();
  });

  adminPageSizeSelect?.addEventListener('change', (e) => {
    const value = Number(e.target.value);
    adminState.pageSize = [10, 20, 50, 100].includes(value) ? value : 20;
    adminState.page = 1;
    renderTable();
  });

  document.getElementById('admin-clear-filters')?.addEventListener('click', clearAdminFilters);
}

function bindTableEvents() {
  itemsTableBody?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const actionBtn = target.closest('[data-action]');
    if (actionBtn instanceof HTMLElement) {
      const action = actionBtn.getAttribute('data-action');
      const itemId = actionBtn.getAttribute('data-id');
      if (!itemId) return;

      if (action === 'edit') editItem(itemId);
      if (action === 'delete') deleteItem(itemId);
      if (action === 'duplicate') duplicateItem(itemId, true);
      return;
    }
  });

  itemsTableBody?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains('row-select')) return;

    const itemId = target.getAttribute('data-id');
    if (!itemId) return;

    if (target.checked) adminState.selectedIds.add(itemId);
    else adminState.selectedIds.delete(itemId);

    renderTable();
  });

  adminPagination?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === 'admin-prev-page') {
      adminState.page = Math.max(1, adminState.page - 1);
      renderTable();
      return;
    }

    if (target.id === 'admin-next-page') {
      adminState.page += 1;
      renderTable();
    }
  });
}

function bindMainEvents() {
  settingsForm.addEventListener('submit', authenticateWithGitHub);
  validateBtn?.addEventListener('click', validateRepository);
  logoutBtn?.addEventListener('click', logout);

  itemForm?.addEventListener('submit', saveItem);
  formResetBtn?.addEventListener('click', resetForm);

  generateIdBtn?.addEventListener('click', () => {
    itemIdInput.value = generateUniqueId();
    saveDraft();
  });

  duplicateCurrentBtn?.addEventListener('click', duplicateCurrentForm);
  restoreDraftBtn?.addEventListener('click', restoreDraft);
  clearDraftBtn?.addEventListener('click', clearDraft);

  [itemIdInput, itemNameInput, itemPriceInput, itemCategoryInput, itemImageInput, itemDescriptionInput].forEach((input) => {
    input?.addEventListener('input', () => {
      saveDraft();
      if (input === itemImageInput) {
        updateImagePreview();
      }
    });
  });

  showTokenCheckbox?.addEventListener('change', () => {
    tokenInput.type = showTokenCheckbox.checked ? 'text' : 'password';
  });

  saveAllBtn?.addEventListener('click', saveAllChanges);
  reloadDataBtn?.addEventListener('click', reloadFromGitHub);

  selectVisibleCheckbox?.addEventListener('change', toggleSelectVisible);
  bulkDeleteBtn?.addEventListener('click', deleteSelected);
  bulkCategoryApplyBtn?.addEventListener('click', applyBulkCategory);
  bulkPriceApplyBtn?.addEventListener('click', applyBulkPriceAdjust);

  validateDataBtn?.addEventListener('click', validateDataQuality);
  normalizeCategoriesBtn?.addEventListener('click', normalizeCategories);
  dedupeIdsBtn?.addEventListener('click', fixDuplicateIds);
  quickSampleBtn?.addEventListener('click', addQuickSample);

  generateImageBtn?.addEventListener('click', () => {
    itemImageInput.value = generateRandomPicsumImageUrl();
    updateImagePreview();
    saveDraft();
    showMessage('Generated random Picsum image URL.', 'success');
  });

  exportAllBtn?.addEventListener('click', exportData);
  exportCsvBtn?.addEventListener('click', exportCsv);
  exportVisibleJsonBtn?.addEventListener('click', exportVisibleJson);
  importFileInput?.addEventListener('change', importDataFromFile);

  undoBtn?.addEventListener('click', undoLastChange);
  redoBtn?.addEventListener('click', redoLastChange);

  bindFilterEvents();
  bindTableEvents();

  document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const mod = isMac ? event.metaKey : event.ctrlKey;

    if (mod && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveAllChanges();
      return;
    }

    if (mod && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      searchInput?.focus();
      return;
    }

    if (event.key === 'Escape') {
      if (isEditMode) {
        resetForm();
      }
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!adminState.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

function preloadAuthFields() {
  const storedOwner = localStorage.getItem('cms_owner') || '';
  const storedRepo = localStorage.getItem('cms_repo') || '';
  const storedBranch = localStorage.getItem('cms_branch') || 'main';

  const usernameInput = document.getElementById('github-username');
  const repoInput = document.getElementById('github-repo');
  const branchInput = document.getElementById('github-branch');

  if (usernameInput && storedOwner) usernameInput.value = storedOwner;
  if (repoInput && storedRepo) repoInput.value = storedRepo;
  if (branchInput) branchInput.value = storedBranch;
}

function initAdminApp() {
  preloadAuthFields();
  bindMainEvents();
  restoreFilterState();
  applyFilterInputs();
  resetForm();
  restoreDraft();
  updateHistoryButtons();

  authSection.style.display = 'block';
  adminSection.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initAdminApp);
