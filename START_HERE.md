# Personal CMS / Product Manager - Complete Project

A full-featured personal content management system that runs entirely on GitHub Pages, using GitHub as your database and the GitHub REST API for real-time CRUD operations.

## 🎯 What You Get

Your app folder (`json-data/`) now contains everything you need:

### 📄 **HTML Pages**
- **index.html** - Public-facing product display page (search, filter, sort)
- **admin.html** - Private admin panel for managing products (add, edit, delete)

### 🎨 **Styling**
- **style.css** - Complete responsive CSS for both pages (no external dependencies)

### 💻 **JavaScript Files**
- **github-api.js** - GitHub REST API wrapper class (handles all authentication, CRUD ops)
- **app.js** - Frontend logic (display, search, filter, sort)
- **admin.js** - Admin panel logic (forms, table, sync to GitHub)

### 📊 **Data**
- **data.json** - Your product database (stored in GitHub, base-64 encoded via API)

### 📚 **Documentation**
- **README.md** - Complete guide with troubleshooting, API details, and best practices
- **QUICK_START.md** - 5-minute quick setup guide
- **DEPLOYMENT.md** - Step-by-step GitHub Pages deployment
- **CONFIG.md** - Customization guide (add fields, colors, features)
- **run.sh** / **run.bat** - Local development server scripts

### 🔒 **Git**
- **.gitignore** - Prevents accidental token/secret commits

---

## 🚀 Quick Start (5 Minutes)

### 1. Create GitHub Repo
```bash
# On GitHub.com:
# 1. Go to https://github.com/new
# 2. Create repo (e.g., "cms" or "products")
# 3. Clone it locally
# 4. Copy all files from this folder into it
# 5. Push to GitHub
```

### 2. Generate Token
- Visit: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Check `repo` scope
- Copy the token

### 3. Deploy to GitHub Pages
- Go to repo Settings → Pages
- Select source: `main` branch
- Wait 1-2 minutes

### 4. Access Your CMS
- **Frontend**: `https://USERNAME.github.io/REPO_NAME/index.html`
- **Admin**: `https://USERNAME.github.io/REPO_NAME/admin.html`
  - Sign in with GitHub username, repo name, and token from step 2

---

## 📂 File Guide

### Core Files (Essential)

| File | Purpose | Read-Only | Auto-Generated |
|------|---------|-----------|-----------------|
| `github-api.js` | GitHub API communication | ❌ | ✅ |
| `app.js` | Frontend display logic | ❌ | ✅ |
| `admin.js` | Admin panel logic | ❌ | ✅ |
| `index.html` | Frontend page | ❌ | ✅ |
| `admin.html` | Admin panel page | ❌ | ✅ |
| `style.css` | Styling | ❌ | ✅ |
| `data.json` | Product database | ✅ | ❌ |

### Documentation Files

| File | What It Contains |
|------|-----------------|
| `README.md` | Complete documentation, troubleshooting, API details |
| `QUICK_START.md` | Fast 5-minute setup guide |
| `DEPLOYMENT.md` | GitHub Pages deployment step-by-step |
| `CONFIG.md` | Customization guide (add fields, colors, etc.) |

### Utility Files

| File | Purpose |
|------|---------|
| `run.sh` | Local dev server (macOS/Linux) |
| `run.bat` | Local dev server (Windows) |
| `.gitignore` | Prevent token/secret commits |

---

## 🔄 How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                    (Your GitHub Repo)                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            data.json (base64-encoded)               │ │
│  │  {                                                  │ │
│  │    "items": [                                       │ │
│  │      {"id": "1", "name": "Product", "price": 29.99}│ │
│  │    ]                                                │ │
│  │  }                                                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          ↕  GitHub REST API
          ↕  (HTTPS, Authenticated)
┌─────────────────────────────────────────────────────────┐
│         Your Web App (GitHub Pages)                     │
├─────────────────────────────────────────────────────────┤
│                   Browser                               │
│  ┌──────────────┐        ┌──────────────┐             │
│  │  index.html  │        │  admin.html  │             │
│  │  (Frontend)  │        │  (Admin)     │             │
│  └──────────────┘        └──────────────┘             │
│         ↓                       ↓                       │
│  ┌────────────────────────────────────┐               │
│  │     app.js / admin.js              │               │
│  │  (Logic & GitHub API calls)        │               │
│  └────────────────────────────────────┘               │
│         ↕                                              │
│  ┌────────────────────────────────────┐               │
│  │     github-api.js                  │               │
│  │  (Handles auth, base64, API calls) │               │
│  └────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User enters GitHub credentials in admin.html
           ↓
github-api.js stores token in memory
           ↓
Fetch request to GitHub API with PAT header
           ↓
Get data.json (base64-encoded)
           ↓
Decode base64 → Parse JSON
           ↓
Display/Edit products
           ↓
User makes changes (add/edit/delete)
           ↓
Re-encode to base64 & PUT back to GitHub
           ↓
GitHub creates commit, updates data.json
           ↓
Frontend refreshes to see new data
```

---

## 🎯 Key Features

### Frontend (index.html)

✅ Display products from GitHub (no auth needed if public repo)
✅ Search products by name, description, category
✅ Filter by category
✅ Sort by name/price (ascending/descending)
✅ Toggle between card view and table view
✅ Responsive design (mobile-friendly)
✅ Link to admin panel

### Admin Panel (admin.html)

✅ Authenticate with GitHub PAT (memory-only, not stored)
✅ Validate repository before operations
✅ Add new products via form
✅ Edit existing products
✅ Delete products (with confirmation)
✅ Search/filter items in list
✅ Export data to JSON file
✅ Import data from JSON file
✅ Auto-generate unique product IDs
✅ All changes sync to GitHub in real-time

### Bonus Features

✅ No frameworks (pure vanilla JS)
✅ No external dependencies
✅ ~40KB total (highly compressible)
✅ Works on GitHub Pages
✅ Base64 encoding/decoding
✅ Error handling & user messages
✅ Loading states & spinners
✅ Confirmation dialogs for destructive actions
✅ Form validation
✅ Responsive CSS

---

## 🔐 Security Model

### Token Management

- ✅ **NOT hardcoded** anywhere in code
- ✅ **NOT committed** to version control (`.gitignore` protects)
- ✅ **NOT stored locally** (no localStorage/sessionStorage)
- ✅ **Memory-only** during session (lost on page refresh)
- ✅ **User-entered** in admin panel each time
- ✅ **Secure HTTPS** via GitHub Pages

### Recommended Token Settings

- Generate at: https://github.com/settings/tokens
- Type: Classic token
- Scopes: `repo` only
- Expiration: 30-90 days
- Regenerate periodically

### What Could Go Wrong

⚠️ If token is exposed:
1. Immediately revoke at Settings → Tokens
2. Generate a new token
3. Use new token in admin panel
4. GitHub notifications will alert you of any API usage

---

## 🌐 Deployment Checklist

- [ ] Create GitHub repository
- [ ] Copy all files to repository
- [ ] Enable GitHub Pages (Settings → Pages)
- [ ] Generate Personal Access Token (Settings → Tokens)
- [ ] Test frontend: `https://username.github.io/repo/index.html`
- [ ] Test admin panel with token
- [ ] Add sample products
- [ ] Verify changes persist (refresh page, check GitHub)
- [ ] Customize styling/fields (optional)
- [ ] Back up your data regularly

---

## 📖 Documentation Reference

**For quick setup:**
→ Read `QUICK_START.md`

**For deployment:**
→ Read `DEPLOYMENT.md`

**For customization:**
→ Read `CONFIG.md`

**For complete details:**
→ Read `README.md`

**For troubleshooting:**
→ See README.md Troubleshooting section

---

## 🧪 Local Testing

Before deploying to GitHub, test locally:

### Option 1: Python (macOS/Linux/Windows)
```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

### Option 2: Node.js
```bash
npx http-server
```

### Option 3: Use provided scripts
```bash
./run.sh      # macOS/Linux
./run.bat     # Windows
```

**Note:** Admin panel requires real GitHub credentials even locally.

---

## 🎨 Customization Examples

### Change Frontend Title
Edit `index.html` line ~15:
```html
<h1>📦 My Store</h1>  <!-- Change text -->
```

### Change Colors
Edit `style.css` lines 8-18:
```css
:root {
  --primary-color: #FF6B6B;      /* Your brand color */
  --secondary-color: #4ECDC4;    /* Secondary color */
}
```

### Add Custom Product Field
1. Edit `admin.html` - add form input
2. Edit `admin.js` - add to `newItem` object
3. Edit `app.js` - display in cards
4. Re-deploy to GitHub

See `CONFIG.md` for detailed customization guide.

---

## 💡 Tips & Tricks

### Rate Limiting
GitHub: 5,000 API requests/hour with token
You'll likely never hit this limit with personal use.

### Data Backup
Use "Export Data" button regularly to save JSON locally.

### Multiple Repos
Manage multiple product lists:
- Create separate GitHub repositories
- Each repo gets its own `data.json`
- Use `?owner=X&repo=Y` URL parameters

### Custom Commits
Every change creates a GitHub commit. Check your repo's commit history to see all changes!

### Categories
Edit `data.json` to add predefined categories:
```json
"categories": ["Electronics", "Books", "Clothing"]
```

---

## 🆘 Quick Help

| Issue | Quick Fix |
|-------|-----------|
| Token doesn't work | Regenerate at https://github.com/settings/tokens |
| "File not found" | Push `data.json` to GitHub repo |
| Changes don't show | Hard refresh (Ctrl+Shift+R) |
| Site not loading | Wait 2 min, check Actions tab for errors |
| App very slow | Check repo size, split `data.json` if 100+ items |

See `README.md` Troubleshooting for more.

---

## 📋 Project Statistics

| Metric | Value |
|--------|-------|
| Total files | 11 |
| HTML files | 2 |
| JavaScript files | 3 |
| CSS files | 1 |
| Documentation | 5 files |
| Total size | ~40KB (uncompressed) |
| Dependencies | 0 (vanilla JS) |
| Browser support | Modern browsers (ES6+) |
| Deploy time | 1-2 minutes |
| Maintenance | Minimal (update token occasionally) |

---

## 🎓 Learning Resources

**GitHub API Documentation:**
https://docs.github.com/en/rest/repos/contents

**GitHub Pages:**
https://docs.github.com/en/pages

**Personal Access Tokens:**
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

**Base64 Encoding (JavaScript):**
https://developer.mozilla.org/en-US/docs/Glossary/Base64

---

## ✅ Next Steps

1. **👉 Start Here:** Read `QUICK_START.md` (5 minutes)
2. **Deploy:** Follow `DEPLOYMENT.md` (10 minutes)
3. **Test:** Access your app and add products
4. **Customize:** Check `CONFIG.md` for customizations
5. **Use:** Share frontend, manage with admin panel

---

## 📞 Support

- **Setup issues?** → `QUICK_START.md`
- **Deployment issues?** → `DEPLOYMENT.md`
- **Technical details?** → `README.md`
- **How to customize?** → `CONFIG.md`
- **All documentation** → README.md (comprehensive)

---

## 🎉 You're All Set!

Your personal CMS is ready to use. No backend server, no databases to manage, no DevOps—just pure client-side code and GitHub as your database.

**Go forth and manage your products!**

```
🚀 Frontend:  https://username.github.io/repo/index.html
🔑 Admin:     https://username.github.io/repo/admin.html
```

---

**Built with vanilla JavaScript • Powered by GitHub • Hosted on GitHub Pages**

Last updated: March 2026
