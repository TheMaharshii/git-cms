/**
 * Admin Panel Logic
 * Handles CRUD operations and data management
 */

let github = null;
let currentData = { items: [] };
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const adminSection = document.getElementById('admin-section');
const settingsForm = document.getElementById('settings-form');
const logoutBtn = document.getElementById('logout-btn');
const validateBtn = document.getElementById('validate-btn');
const statusMessage = document.getElementById('status-message');

const itemForm = document.getElementById('item-form');
const itemsTableBody = document.getElementById('items-table-body');
const loadingSpinner = document.getElementById('loading-spinner');

// Form fields
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const itemDescriptionInput = document.getElementById('item-description');
const itemImageInput = document.getElementById('item-image');
const itemCategoryInput = document.getElementById('item-category');
const formSubmitBtn = document.getElementById('form-submit-btn');
const formResetBtn = document.getElementById('form-reset-btn');

let isEditMode = false;
let editingItemId = null;

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `message message-${type}`;
  statusMessage.style.display = 'block';

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

/**
 * Show/hide loading spinner
 */
function setLoading(loading) {
  loadingSpinner.style.display = loading ? 'block' : 'none';
}

/**
 * Authenticate with GitHub
 */
async function authenticateWithGitHub(e) {
  e.preventDefault();
  
  const username = document.getElementById('github-username').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim() || 'main';
  const token = document.getElementById('github-token').value.trim();

  if (!username || !repo || !token) {
    showMessage('Please fill in all required fields', 'error');
    return;
  }

  setLoading(true);

  try {
    // Initialize GitHub API
    github = new GitHubAPI(username, repo, branch, token);

    // Validate repository
    const validation = await github.validateRepository();
    showMessage(`Connected to ${validation.owner}/${validation.repo}`, 'success');

    // Fetch data
    const fetchedData = await github.fetchData();
    currentData = fetchedData.data;

    currentUser = {
      username,
      repo,
      branch,
    };

    // Switch to admin view
    authSection.style.display = 'none';
    adminSection.style.display = 'block';

    // Update user display
    document.getElementById('current-user').textContent = `${username}/${repo} (${branch})`;

    // Store credentials to localStorage for frontend to use
    localStorage.setItem('cms_owner', username);
    localStorage.setItem('cms_repo', repo);
    localStorage.setItem('cms_branch', branch);

    // Load items
    loadItems();
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    setLoading(false);
  }
}

/**
 * Validate repository without full authentication
 */
async function validateRepository(e) {
  e.preventDefault();

  const username = document.getElementById('github-username').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim() || 'main';
  const token = document.getElementById('github-token').value.trim();

  if (!username || !repo || !token) {
    showMessage('Please fill in all required fields', 'error');
    return;
  }

  setLoading(true);

  try {
    const tempGitHub = new GitHubAPI(username, repo, branch, token);
    const validation = await tempGitHub.validateRepository();
    showMessage(`✓ Repository found: ${validation.owner}/${validation.repo} (${branch})`, 'success');
  } catch (error) {
    showMessage(`Validation failed: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Logout and return to auth
 */
function logout() {
  if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
    github = null;
    currentUser = null;
    currentData = { items: [] };
    authSection.style.display = 'block';
    adminSection.style.display = 'none';
    settingsForm.reset();
    itemForm.reset();
    itemsTableBody.innerHTML = '';
    showMessage('Logged out successfully', 'success');
  }
}

/**
 * Load and display items
 */
function loadItems() {
  itemsTableBody.innerHTML = '';

  if (!currentData.items || currentData.items.length === 0) {
    itemsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No items yet. Create one using the form below.</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();
  currentData.items.forEach((item) => {
    const row = createItemRow(item);
    fragment.appendChild(row);
  });
  itemsTableBody.appendChild(fragment);
}

/**
 * Create table row for item
 */
function createItemRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${escapeHtml(item.id)}</td>
    <td>${escapeHtml(item.name)}</td>
    <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
    <td>${escapeHtml(item.category || 'N/A')}</td>
    <td>${escapeHtml((item.description || '').substring(0, 50))}${(item.description || '').length > 50 ? '...' : ''}</td>
    <td>
      <button class="btn btn-sm btn-edit" onclick="editItem('${escapeHtml(item.id)}')">Edit</button>
      <button class="btn btn-sm btn-delete" onclick="deleteItem('${escapeHtml(item.id)}')">Delete</button>
    </td>
  `;
  return row;
}

/**
 * Generate unique ID
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `prod_${timestamp}_${random}`;
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
 * Add or update item
 */
async function saveItem(e) {
  e.preventDefault();

  const id = itemIdInput.value.trim();
  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value) || 0;
  const description = itemDescriptionInput.value.trim();
  const image = itemImageInput.value.trim();
  const category = itemCategoryInput.value.trim();

  if (!name) {
    showMessage('Item name is required', 'error');
    return;
  }

  const newItem = {
    id,
    name,
    price,
    description,
    image,
    category,
  };

  if (isEditMode) {
    // Update existing item
    const index = currentData.items.findIndex((item) => item.id === editingItemId);
    if (index !== -1) {
      currentData.items[index] = newItem;
    }
  } else {
    // Add new item
    // Check for duplicate ID
    if (currentData.items.some((item) => item.id === id && id !== '')) {
      showMessage('An item with this ID already exists', 'error');
      return;
    }

    currentData.items.push(newItem);
  }

  // Save to GitHub
  const saved = await saveToGitHub(isEditMode ? 'Update item' : 'Add new item');

  if (!saved) {
    return;
  }

  // Reset form
  resetForm();
  loadItems();
}

/**
 * Edit item
 */
function editItem(itemId) {
  const item = currentData.items.find((i) => i.id === itemId);
  if (!item) return;

  isEditMode = true;
  editingItemId = itemId;

  itemIdInput.value = item.id;
  itemIdInput.disabled = true;
  itemNameInput.value = item.name;
  itemPriceInput.value = item.price || '';
  itemDescriptionInput.value = item.description || '';
  itemImageInput.value = item.image || '';
  itemCategoryInput.value = item.category || '';

  formSubmitBtn.textContent = 'Update Item';
  formResetBtn.textContent = 'Cancel';

  // Scroll to form
  itemForm.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Delete item
 */
async function deleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }

  const previousItems = [...currentData.items];
  currentData.items = currentData.items.filter((item) => item.id !== itemId);

  // Save to GitHub
  const saved = await saveToGitHub('Delete item');

  if (!saved) {
    currentData.items = previousItems;
    return;
  }

  loadItems();
}

/**
 * Reset form to add mode
 */
function resetForm() {
  isEditMode = false;
  editingItemId = null;
  itemForm.reset();
  itemIdInput.disabled = false;
  itemIdInput.value = generateUniqueId();
  formSubmitBtn.textContent = 'Add Item';
  formResetBtn.textContent = 'Clear';
}

/**
 * Save data to GitHub
 */
async function saveToGitHub(message) {
  setLoading(true);

  try {
    await github.updateData(currentData, message);
    showMessage('Changes saved successfully.', 'success');
    return true;
  } catch (error) {
    const errorMsg = error.message;
    console.error('GitHub API Error:', errorMsg);
    
    // Show detailed error with troubleshooting link
    const fullError = `
${errorMsg}

🔧 TROUBLESHOOTING:
1. Verify token: https://github.com/settings/tokens
2. Check token has "repo" scope (write access)
3. Token might be expired - generate a new one
4. If still failing, try logout and log back in
    `;
    
    showMessage(fullError, 'error');
    return false;
  } finally {
    setLoading(false);
  }
}

/**
 * Export data as JSON
 */
function exportData() {
  const dataStr = JSON.stringify(currentData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('Data exported successfully', 'success');
}

/**
 * Import data from JSON
 */
async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importedData = JSON.parse(text);

    if (!importedData.items || !Array.isArray(importedData.items)) {
      throw new Error('Invalid JSON format: must contain "items" array');
    }

    if (!confirm('This will replace all existing items. Continue?')) {
      return;
    }

    const previousData = currentData;
    currentData = importedData;
    const saved = await saveToGitHub('Import data from file');

    if (!saved) {
      currentData = previousData;
      return;
    }

    loadItems();
    resetForm();
    showMessage('Data imported successfully', 'success');
  } catch (error) {
    showMessage(`Import failed: ${error.message}`, 'error');
  }

  // Reset file input
  e.target.value = '';
}

/**
 * Search items
 */
function searchItems() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const rows = itemsTableBody.querySelectorAll('tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  const storedOwner = localStorage.getItem('cms_owner') || '';
  const storedRepo = localStorage.getItem('cms_repo') || '';
  const storedBranch = localStorage.getItem('cms_branch') || 'main';

  const usernameInput = document.getElementById('github-username');
  const repoInput = document.getElementById('github-repo');
  const branchInput = document.getElementById('github-branch');

  if (usernameInput && storedOwner) usernameInput.value = storedOwner;
  if (repoInput && storedRepo) repoInput.value = storedRepo;
  if (branchInput) branchInput.value = storedBranch;

  // Set up event listeners
  settingsForm.addEventListener('submit', authenticateWithGitHub);
  validateBtn?.addEventListener('click', validateRepository);
  logoutBtn.addEventListener('click', logout);
  itemForm.addEventListener('submit', saveItem);
  formResetBtn.addEventListener('click', resetForm);

  // Set initial ID
  itemIdInput.value = generateUniqueId();

  // Show auth section initially
  authSection.style.display = 'block';
  adminSection.style.display = 'none';
});
