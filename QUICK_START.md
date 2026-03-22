# Personal CMS - Quick Start Guide

Get your personal product manager running in **5 minutes**.

## 1️⃣ Quick Setup (2 minutes)

### Create GitHub Repository
```bash
# On GitHub.com
1. Create new repo: https://github.com/new
2. Clone it locally
3. Copy all files from this project into it
4. git push origin main
```

### Generate Personal Access Token
1. Go: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "CMS" 
4. Check: `repo` scope
5. Generate & copy token (you won't see it again!)

## 2️⃣ Deploy to GitHub Pages (1 minute)

In your repo:
1. Settings → Pages
2. Source: `main` branch
3. Save
4. Wait 1-2 minutes for deployment

Your site is now live at: `https://YOUR_USERNAME.github.io/YOUR_REPO`

## 3️⃣ Access Your CMS (2 minutes)

### Frontend (Display Products)
- URL: `https://YOUR_USERNAME.github.io/YOUR_REPO/index.html?owner=YOUR_USERNAME&repo=YOUR_REPO`
- Shows all products from `data.json`
- Public read-only access

### Admin Panel (Manage Products)
- URL: `https://YOUR_USERNAME.github.io/YOUR_REPO/admin.html`
- Paste your Personal Access Token from step 1️⃣
- Add/edit/delete products
- **Token stays in memory only** (never saved)

## 🔧 Local Development

Want to test locally first?

```bash
# Using Python 3
python -m http.server 8000

# Or Node.js
npx http-server

# Then visit: http://localhost:8000
```

## 📝 Data Format

Products in `data.json`:
```json
{
  "items": [
    {
      "id": "prod_1",
      "name": "My Product",
      "price": 29.99,
      "category": "Electronics",
      "description": "Great product",
      "image": "https://example.com/pic.jpg"
    }
  ]
}
```

All fields except `id` and `name` are optional.

## 🔐 Security Quickie

- ✅ Token **not hardcoded** anywhere
- ✅ Token **not stored on disk**
- ✅ Token **not committed** to repo
- ✅ Token **only in memory** during session
- ⚠️ Use `repo` scope only (most restrictive)
- ⚠️ Rotate token occasionally

## ❓ Common Issues

**"Unauthorized"**
- Check token is correct
- Token might be expired (regenerate)
- Verify `repo` scope is enabled

**"Repository not found"**
- Check username/repo spelling
- Verify repo is accessible
- Make sure `data.json` exists in root

**"Changes not showing"**
- Hard refresh (Ctrl+Shift+R)
- Wait 1-2 minutes for GitHub Pages rebuild
- Check Actions tab for deploy status

## 🎨 Customization

Want to customize?

**Colors**: Edit `:root` in `style.css`
```css
:root {
  --primary-color: #your-color;
}
```

**Add Fields**: 
1. Edit form in `admin.html`
2. Update `admin.js` to handle the new field
3. Format in `app.js` for display

**More Features**:
- Search/filter/sort already built-in
- Export/import JSON button ready
- Card/table view toggle ready

## 📚 Full Docs

See `README.md` for detailed docs and advanced setup.

## 🚀 You're Done!

Your personal product manager is live and ready to use.
- **Frontend**: Browse your products
- **Admin**: Manage everything via GitHub API
- **No backend needed**: All changes synced to GitHub

Enjoy! 🎉
