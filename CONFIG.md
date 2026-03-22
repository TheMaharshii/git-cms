# Configuration Guide

Instructions for configuring your personal CMS for different scenarios.

## Basic Configuration

### Update GitHub Credentials

In the **Admin Panel** (`admin.html`):

1. Enter your **GitHub Username**
2. Enter your **Repository Name** (where `data.json` is stored)
3. Enter your **Branch** (defaults to `main`)
4. Enter your **Personal Access Token** (generated at https://github.com/settings/tokens)
5. Click **Sign In**

Token is held in memory only—it won't be saved for next session.

## Data Structure Configuration

### Default Item Fields

The default `data.json` format includes:
- `id` - Unique identifier (auto-generated)
- `name` - Product name (required)
- `price` - Price as number
- `category` - Product category
- `description` - Text description
- `image` - Image URL

### Add Custom Fields

To add new fields to your products:

**1. Update `admin.html` form:**
```html
<div class="form-group">
  <label for="item-sku">SKU:</label>
  <input type="text" id="item-sku" placeholder="Product SKU">
</div>
```

**2. Update `admin.js` in the `saveItem()` function:**
```javascript
const newItem = {
  id,
  name,
  price,
  description,
  image,
  category,
  sku: document.getElementById('item-sku').value.trim(),  // Add this
};
```

**3. Update `admin.js` in the `editItem()` function:**
```javascript
itemSkuInput.value = item.sku || '';  // Add this
```

**4. Update `app.js` to display the field:**
```javascript
// In displayAsCards() function, add:
${item.sku ? `<p class="item-sku">SKU: ${escapeHtml(item.sku)}</p>` : ''}
```

### Sample: Add Stock Tracking

```javascript
// Add to newItem object
sku: document.getElementById('item-sku').value.trim(),
stock: parseInt(document.getElementById('item-stock').value) || 0,
in_stock: parseInt(document.getElementById('item-stock').value) > 0,
```

## Frontend Configuration

### Change Site Title

Edit `index.html`:
```html
<h1>📦 Product Manager</h1> <!-- Change text here -->
```

### Change Frontend Colors

Edit `style.css` `:root` section:
```css
:root {
  --primary-color: #0366d6;        /* Main color */
  --secondary-color: #6f42c1;      /* Secondary color */
  --success-color: #28a745;        /* Success messages */
  --danger-color: #dc3545;         /* Danger/delete */
}
```

### Change Grid Layout

In `style.css`, adjust `.items-grid`:
```css
.items-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));  /* Adjust 280px */
}
```

- `250px` - Smaller, more columns
- `350px` - Larger, fewer columns

### Hide/Show Frontend Elements

In `index.html`, toggle visibility:

```html
<!-- Hide search -->
<div class="search-input-wrapper" style="display: none;">

<!-- Hide sort -->
<select id="sort-select" style="display: none;">

<!-- Hide admin link -->
<a href="admin.html" style="display: none;">
```

## Admin Panel Configuration

### Change Admin Title

Edit `admin.html`:
```html
<h1>🛠️ Admin Panel</h1> <!-- Change text -->
```

### Hide Import/Export

In `admin.html`, hide data management section:
```html
<div style="display: none;"> <!-- Wrap in this -->
  <!-- Data Management section -->
</div>
```

### Change Form Validation

Edit `admin.js` in `saveItem()` function:
```javascript
// Current validation
if (!name) {
  showMessage('Item name is required', 'error');
  return;
}

// Add more validations
if (!price || parseFloat(price) <= 0) {
  showMessage('Price must be greater than 0', 'error');
  return;
}
```

## GitHub Configuration

### Use Different Branch

1. In admin panel, change **Branch** to different branch name
2. Or programmatically in `github-api.js`:
```javascript
const github = new GitHubAPI(owner, repo, 'develop', token);  // Use 'develop'
```

### Set Custom Commit Message

The commit message appears in GitHub history. Change in `admin.js`:
```javascript
await saveToGitHub('Add product via CMS');  // Customize message
```

### Handle Multiple Repositories

To manage multiple `data.json` files:

1. Create separate instances in different repos/branches
2. Each admin panel call signs in to a different repo
3. Use URL parameters for frontend:

```
https://example.com/index.html?owner=username&repo=products-repo
https://example.com/index.html?owner=username&repo=portfolio-repo
```

## Category Management

### Pre-define Categories

To auto-populate category filter, modify `app.js`:

```javascript
const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Books'];

function initCategoryFilter() {
  const select = document.getElementById('category-filter');
  CATEGORIES.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}
```

Then call it in `initApp()`.

## Search & Filter Customization

### Add More Search Fields

In `app.js`, modify `searchItems()`:
```javascript
items.filter((item) => {
  return (
    item.name.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    item.sku?.toLowerCase().includes(query)  // Add custom field
  );
})
```

### Fuzzy Search

For better search, implement fuzzy matching (requires external library or custom code):

```javascript
// Simple fuzzy match function
function fuzzyMatch(text, query) {
  let matched = 0;
  for (let q of query) {
    const index = text.toLowerCase().indexOf(q);
    if (index !== -1) {
      matched++;
      text = text.substring(index + 1);
    } else {
      return false;
    }
  }
  return matched >= query.length * 0.3;  // 30% match threshold
}
```

## Authentication Customization

### Always Save Token (⚠️ Not Recommended)

To store token in localStorage:
```javascript
// In admin.js
localStorage.setItem('github_token', token);

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('github_token');
  if (saved) {
    document.getElementById('github-token').value = saved;
  }
});
```

⚠️ **WARNING**: This exposes your token to XSS attacks. Only use on secure, personal devices.

### Require Token Entry

Default behavior—no changes needed. Token is always prompted.

## API Integration Customization

### Rate Limit Handling

Add rate limit awareness in `github-api.js`:

```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');
console.log(`Requests remaining: ${remaining}`);
```

### Error Handling

Customize error messages in `admin.js`:

```javascript
catch (error) {
  if (error.message.includes('401')) {
    showMessage('Token expired. Please regenerate and try again.', 'error');
  } else if (error.message.includes('404')) {
    showMessage('Repository or file not found.', 'error');
  }
}
```

## Performance Optimization

### Cache Data Locally

Modify `app.js` to use local cache:

```javascript
async function fetchDataFromGitHub() {
  try {
    // Try to fetch fresh data
    const data = await github.fetchData();
    localStorage.setItem('cms_cache', JSON.stringify(data.data));
    return data.data;
  } catch (error) {
    // Fallback to cached data
    const cached = localStorage.getItem('cms_cache');
    if (cached) {
      console.warn('Using cached data due to fetch error');
      return JSON.parse(cached);
    }
    throw error;
  }
}
```

### Lazy Load Images

In `app.js`, add lazy loading:

```javascript
const img = document.createElement('img');
img.src = item.image;
img.loading = 'lazy';  // Native lazy loading
```

## SEO Optimization

### Add Meta Tags

In `index.html` head:
```html
<meta name="description" content="Browse our product catalog">
<meta name="keywords" content="products, store, catalog">
<meta property="og:title" content="Product Manager">
<meta property="og:description" content="Browse our product catalog">
```

### Structured Data

Add JSON-LD for search engines:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "ItemList",
  "itemListElement": items.map(item => ({
    "@type": "Product",
    "name": item.name,
    "price": item.price
  }))
}
</script>
```

## Advanced Features

### Sorting Configuration

Already built-in. Supports:
- Name ascending/descending
- Price ascending/descending
- Customizable: modify `sortItems()` in `app.js`

### View Types

Already built-in:
- Cards view (default)
- Table view
- Customizable: add new view type in toggles

### Import/Export

Already built-in. Use JSON format:
```json
{
  "items": [
    {"id": "1", "name": "Product", ...}
  ]
}
```

---

**Questions?** See `README.md` for detailed documentation.
