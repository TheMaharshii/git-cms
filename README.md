# Personal CMS / Product Manager

A lightweight product manager built with vanilla JavaScript that uses GitHub as the database (`data.json`). No backend required.

## Connect Your Own Repo + Key (2 minutes)

Use this exact flow to connect your own repository and Personal Access Token:

1. Copy this project into **your own GitHub repo**.
2. Make sure `data.json` exists at the repo root.
3. Open `admin.html` and sign in with:
   - GitHub username
   - Repository name
   - Branch (usually `main`)
   - Personal Access Token (PAT)
4. After successful sign in, open `index.html`.
   - Owner/repo/branch are auto-saved from admin login.
   - No token is needed on frontend for public repos.

Optional: set hard defaults in `index.html`:

```html
<script>
  window.CMS_DEFAULT_OWNER = 'your-github-username';
  window.CMS_DEFAULT_REPO = 'your-repo-name';
  window.CMS_DEFAULT_BRANCH = 'main';
</script>
```

## Features

✨ **Key Features:**
- **Frontend Display Page** (`index.html`) - Browse products with search, filter, and sort
- **Admin Panel** (`admin.html`) - Full CRUD operations (Create, Read, Update, Delete)
- **GitHub as Database** - Uses GitHub API to store/retrieve data from `data.json`
- **Secure Authentication** - Manual Personal Access Token (PAT) entry—token never stored on disk
- **No Backend Required** - 100% client-side, runs anywhere (GitHub Pages, any static host)
- **Vanilla JavaScript** - Zero dependencies, lightweight, fast
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Bonus Features** - Search, filter, sort, export/import JSON, view toggle (cards/table)

## File Structure

```
.
├── index.html           # Frontend display page
├── admin.html           # Admin panel
├── style.css            # Styling for both pages
├── github-api.js        # GitHub API helper class
├── app.js               # Frontend logic
├── admin.js             # Admin panel logic
├── data.json            # Database file (stored in GitHub repo)
└── assets/              # SVG logo and icon assets
```

## Data Structure

The `data.json` file uses this structure:

```json
{
  "items": [
    {
      "id": "prod_001",
      "name": "Product Name",
      "price": 29.99,
      "description": "Product description",
      "image": "https://example.com/image.jpg",
      "category": "Electronics"
    }
  ]
}
```

Each item requires:
- `id` - Unique identifier
- `name` - Product name
- `price` - Product price (number)
- `description` - (Optional) Product description
- `image` - (Optional) Product image URL
- `category` - (Optional) Product category

## Setup Instructions

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (name it whatever you want, e.g., `my-cms`)
3. Initialize with a README
4. Clone it locally or prepare to upload files

### Step 2: Add Project Files

1. Copy all files from this project:
   - `index.html`
   - `admin.html`
   - `data.json`
   - `style.css`
   - `github-api.js`
   - `app.js`
   - `admin.js`

2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit: add CMS app"
   git push origin main
   ```

### Step 3: Create a Personal Access Token (PAT)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Create either:
   - **Fine-grained token** (recommended): grant your target repo + **Contents: Read and write**
   - **Classic token**: `repo` (or `public_repo` for public-only use)
3. Copy the token immediately (you won’t see it again)

### Step 4: Deploy to GitHub Pages

1. Go to your repository settings
2. Scroll to **Pages** section
3. Set **Source** to `main` branch (or your desired branch)
4. Wait for deployment (usually 1-2 minutes)
5. Your site will be available at: `https://username.github.io/repo-name`

Or for organization sites:
- `https://orgname.github.io/repo-name`

### Step 5: Access the App

- **Frontend**: `https://username.github.io/repo-name/index.html?owner=username&repo=repo-name&branch=main`
- **Admin Panel**: `https://username.github.io/repo-name/admin.html`

Or without parameters:
- Sign in once in `admin.html`; frontend then reuses saved owner/repo/branch

## How to Use

### Frontend (index.html)

1. Open `index.html` (or the GitHub Pages URL)
2. Products are fetched automatically from `data.json` in your selected branch
3. Features:
   - **Search** - Find products by name, description, or category
   - **Filter** - View products by category
   - **Sort** - Sort by name or price (ascending/descending)
   - **View Toggle** - Switch between card and table views
   - **Admin Link** - Jump to admin panel

### Admin Panel (admin.html)

1. Open `admin.html`
2. Enter GitHub credentials:
   - **GitHub Username** - Your GitHub username
   - **Repository Name** - Name of your repo with `data.json`
   - **Branch** - Git branch (default: `main`)
   - **Personal Access Token** - Your PAT from Step 3 (never saved to disk)
3. Click **Sign In**
4. Manage products:
   - **Add Item** - Fill form and click "Add Item"
   - **Edit Item** - Click "Edit" on any item, modify, and click "Update Item"
   - **Delete Item** - Click "Delete" (confirmation required)
   - **Search** - Filter items in the list
5. **Export Data** - Download `data.json` as backup
6. **Import Data** - Upload a `data.json` file to restore/bulk-load

### GitHub API Operations

The app handles these automatically:

1. **Fetch File**:
   ```
   GET /repos/{owner}/{repo}/contents/data.json
   ```
   Returns file content (base64-encoded) and SHA hash

2. **Update File**:
   ```
   PUT /repos/{owner}/{repo}/contents/data.json
   ```
   Body includes:
   - `message` - Commit message
   - `content` - Base64-encoded JSON
   - `sha` - Current file SHA (prevents conflicts)
   - `branch` - Target branch

## Security Notes

### Token Security

⚠️ **IMPORTANT:**
- Your PAT is **never hardcoded** in the source
- Token is **not stored on disk** - only kept in browser memory/sessionStorage
- Token is **never committed** to the repository
- Each session requires re-entering the token
- Consider using a **token with expiration** on GitHub
- Frontend page never requires storing PAT for normal public-repo reads

### Best Practices

- Use a **fine-grained Personal Access Token** (GitHub's newer token type) if available
- Limit token permissions to only the necessary repository
- Regularly rotate your tokens
- Never commit your token to version control
- Use public repositories for read-only content if possible
- Regenerate tokens if compromised

## API Rate Limiting

GitHub's REST API has rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

For personal use, you'll rarely hit these limits. The app makes:
- 1 request to fetch current file (get SHA)
- 1 request to update file
- Plus repo validation on login

## Troubleshooting

### "Unauthorized: Invalid token"
- Your PAT may have expired or been revoked
- Check token has correct scopes (`repo` or `public_repo`)
- Regenerate a new token at [github.com/settings/tokens](https://github.com/settings/tokens)

### "Repository not found"
- Check spelling of username and repo name
- Ensure you have access to the repository
- Public repos don't require authentication

### "File not found"
- `data.json` doesn't exist in the repository
- Go to your repo and create/upload `data.json` manually
- Make sure it's in the root directory

### "Failed to decode base64"
- Content in `data.json` is corrupted
- Delete the file and create a fresh one with sample data
- Or use the export/import feature to reset

### Changes not showing on frontend
- The frontend fetches from GitHub (not cached locally)
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Wait a few seconds for GitHub Pages to rebuild
- Check GitHub Actions to ensure deployment succeeded

## Advanced Usage

### Custom Domain

To use a custom domain with GitHub Pages:

1. In repository settings → Pages
2. Add your custom domain
3. Create a `CNAME` file in the repo with your domain
4. Configure DNS at your domain registrar

### Bulk Operations

1. **Export all products** - Use "Export Data" button
2. **Edit JSON locally** - Modify the exported file
3. **Import back** - Use "Import Data" button

### Multiple Repositories

You can manage multiple data repositories:
- Each instance needs different username/repo in admin panel
- Or use multiple GitHub Pages sites

### Environmental Configuration

To use environment-specific data:
1. Create multiple `data.json` files in different branches
2. Change branch in admin panel before signing in
3. Each branch maintains separate data

## Limitations & Considerations

⚠️ **Know These Limits:**
- **No user accounts** - All changes appear as you (single-user)
- **No concurrent editing** - Lock mechanisms not implemented
- **File size** - JSON file has no hard limit, but practical limit ~5MB
- **Real-time sync** - Changes don't auto-sync between tabs
- **Offline access** - Requires internet connection (depends on GitHub)
- **No database transactions** - Read/modify/write can conflict
- **Simple validation** - Use GitHub's branch protection rules for extra safety

## Extending the App

### Add More Fields

Modify both `data.json` and form fields in `admin.html`:

```html
<div class="form-group">
  <label for="item-sku">SKU:</label>
  <input type="text" id="item-sku" placeholder="SKU" />
</div>
```

Then update `admin.js` to handle the new field.

### Custom Styling

Edit `style.css` to match your brand:
```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... etc */
}
```

### Add More Features

The code is modular—add:
- Categories/tags management
- Inventory tracking
- Pricing tiers
- Reviews/ratings (stored in JSON)
- Custom metadata fields

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

Requires:
- ES6 JavaScript support
- Fetch API
- LocalStorage (optional)

## License

This project is open source and free to use. Modify as needed for your use case.

## Support & Questions

For issues:
1. Check the **Troubleshooting** section
2. Review the **GitHub API Integration** docs
3. Check your PAT permissions and expiration
4. Verify `data.json` exists and is valid JSON

## File Size Reference

- `github-api.js` ~4KB
- `app.js` ~8KB
- `admin.js` ~12KB
- `style.css` ~14KB
- **Total**: ~38KB (uncompressed, highly compressible)

Perfect for fast GitHub Pages deployment!

---

**Built with vanilla JavaScript — no frameworks, no build step, no dependencies.**

Enjoy your personal CMS! 🚀
#   c m s 
 
 #   c m s 
 
 #   c m s 
 
 