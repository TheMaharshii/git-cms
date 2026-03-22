# Frontend Setup Guide

## How to Access the Public Frontend

Your **index.html** is the public-facing product display page. It needs to know where to get your products from.

## Configuration Methods

### Method 1: URL Parameters (Recommended) ⭐

Use this format:
```
https://YOUR_DOMAIN/index.html?owner=GitHub_USERNAME&repo=REPO_NAME
```

**Example:**
```
https://john.github.io/my-products/index.html?owner=john&repo=my-products
```

Or locally:
```
http://localhost:8000/index.html?owner=john&repo=my-products
```

### Method 2: Edit index.html

Edit the file directly:
```javascript
// In index.html, find this section and update:
const APP_CONFIG = {
  owner: 'YOUR_USERNAME',  // ← Change to your GitHub username
  repo: 'YOUR_REPO',       // ← Change to your repo name
};
```

### Method 3: Admin Panel Auto-Configuration

When you sign in through **admin.html**, it automatically remembers your GitHub credentials:
- The frontend will use those same credentials
- No need to manually configure

## Quick Start URLs

After deploying to GitHub Pages:

**On GitHub Pages:**
```
Frontend: https://username.github.io/repo/index.html?owner=username&repo=repo
Admin:    https://username.github.io/repo/admin.html
```

**Locally (during testing):**
```
Frontend: http://localhost:8000/index.html?owner=username&repo=repo
Admin:    http://localhost:8000/admin.html
```

## For Public Repos (No Auth Needed)

If your repository is **public**:
- ✅ Frontend works WITHOUT authentication
- ✅ Anyone can view your products
- ❓ Admin panel STILL needs token (for editing)

Format:
```
https://username.github.io/repo/index.html?owner=username&repo=repo
```

## For Private Repos (Auth Needed)

If your repository is **private**:
- ❌ Frontend needs token in URL (not recommended)
- ✅ Admin panel needs token (required)

**Best practice:** Keep repo public for frontend, let admin panel authenticate.

## Example Setup

If your GitHub is: `john` and repo is: `shop`

**Public Frontend:**
```
https://john.github.io/shop/index.html?owner=john&repo=shop
```

**Admin Panel:**
```
https://john.github.io/shop/admin.html
(Enter token to authenticate)
```

## Features

Once accessed, your frontend has:
- ✅ Search products
- ✅ Filter by category
- ✅ Sort by name/price
- ✅ View toggle (cards/table)
- ✅ Link to admin panel

## Sharing Your Frontend

Share this link with others:
```
https://john.github.io/shop/index.html?owner=john&repo=shop
```

They can:
- ✅ Browse products
- ✅ Search and filter
- ✅ See product details

They CANNOT (without your token):
- ❌ Add products
- ❌ Edit products
- ❌ Delete products
- (That's why there's a separate admin panel)

## Troubleshooting

### "GitHub repository not configured"

This means owner/repo weren't provided:
1. Use URL parameters: `?owner=X&repo=Y`
2. Or edit index.html and set them directly
3. Or sign in through admin.html first

### "Failed to load data"

Possible causes:
- Owner/repo don't exist
- Repository is private (need token)
- data.json file doesn't exist in repo
- data.json has invalid JSON syntax

**Solution:**
1. Verify owner/repo spelling
2. Check repo exists at: github.com/owner/repo
3. Verify `data.json` in repository root
4. Validate JSON: https://jsonlint.com/

### Products show but won't update

The frontend is read-only on purpose:
- Frontend: Display only
- Admin panel: Make changes

This is intentional for security!

## Advanced: Custom Landing

You could create a **landing.html** that links to your frontend:

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Welcome to My Store</h1>
  <p><a href="index.html?owner=john&repo=shop">👉 Browse Products</a></p>
  <p><a href="admin.html">🔑 Admin Only</a></p>
</body>
</html>
```

---

**Key Takeaway:**
- Frontend = Public display (read-only)
- Admin = Private management (needs token)
- Both use the same `data.json` file
