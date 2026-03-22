# Deployment Guide - GitHub Pages

Complete step-by-step guide to deploy your personal CMS to GitHub Pages.

## Prerequisites

- GitHub account (free)
- These project files
- Personal Access Token (PAT) from https://github.com/settings/tokens
- 10 minutes

## Step 1: Create GitHub Repository

### Option A: Via GitHub Web Interface

1. Go to https://github.com/new
2. Enter repository name (e.g., `cms`, `my-products`, `portfolio`)
3. Add description (optional): "Personal CMS with GitHub API"
4. Choose visibility:
   - **Public** - Anyone can see products (read-only)
   - **Private** - Only you can access (need to authenticate for frontend)
5. ☑️ Initialize with README
6. Click **Create repository**

### Option B: Via Git CLI

```bash
# Create a new directory
mkdir my-cms
cd my-cms

# Initialize git
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Create and commit initial files
echo "# Personal CMS" > README.md
git add README.md
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## Step 2: Add Project Files

### Copy All Files to Repository

From this project, copy these files to your repo:
```
.gitignore
admin.html
admin.js
app.js
CONFIG.md
data.json
github-api.js
index.html
QUICK_START.md
README.md
style.css
DEPLOYMENT.md (this file)
```

### Commit and Push

```bash
# If you cloned:
cd your-repo-folder

# Copy files here, then:
git add .
git commit -m "Add personal CMS app"
git push origin main

# Verify files are visible on GitHub.com
```

## Step 3: Generate Personal Access Token

⚠️ **This is required for admin panel authentication.**

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
   - Or **Generate new token (fine-grained)** (newer, more secure)
3. Enter token name: `CMS-Admin`
4. Set expiration: 30 days or 90 days (periodically refresh)
5. Select scopes:
   - For **classic token**:
     - ✅ Check `repo` (full control)
   - For **fine-grained token**:
     - ✅ Select your repository
     - ✅ Set permissions: `Contents: Read and write`
6. Click **Generate token**
7. **Copy token immediately** (you won't see it again)
8. Save it somewhere safe temporarily (use it in next step)

⚠️ **Never commit this token!**

## Step 4: Enable GitHub Pages

### In Repository Settings

1. Go to your repository on GitHub.com
2. Click **Settings** (top-right menu)
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**:
   - Branch: `main` (or your default)
   - Folder: `/ (root)`
   - Click **Save**
5. Wait 1-2 minutes for deployment
6. You'll see: "Your site is live at: `https://YOUR_USERNAME.github.io/YOUR_REPO`"

### Verify Deployment

GitHub Actions will build your site:
1. Click **Actions** tab
2. View the deployment job
3. Once green ✅, your site is live

## Step 5: Access Your CMS

### Frontend URL

Display your products publicly:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/index.html?owner=YOUR_USERNAME&repo=YOUR_REPO
```

Or without parameters (will prompt for GitHub credentials):
```
https://YOUR_USERNAME.github.io/YOUR_REPO/index.html
```

### Admin Panel URL

Manage your products (requires authentication):
```
https://YOUR_USERNAME.github.io/YOUR_REPO/admin.html
```

Then enter:
- GitHub Username: `YOUR_USERNAME`
- Repository Name: `YOUR_REPO`
- Branch: `main`
- Personal Access Token: `ghp_xxxxxxxxxxxxxx` (from Step 3)

## Step 6: Test the App

### Test Frontend
1. Open frontend URL from Step 5
2. You should see the sample product
3. Try:
   - Search
   - Filter by category
   - Sort by price/name
   - Toggle view (cards/table)

### Test Admin Panel
1. Open admin panel URL
2. Enter GitHub credentials + PAT from Step 3
3. Click **Sign In**
4. Click **Validate Repository** to confirm connection
5. Try:
   - Add new product
   - Edit existing product
   - Delete product
   - Export data
   - Import data

### Test Data Persistence
1. Add a product in admin
2. Wait for "Changes saved" message
3. Go to GitHub.com and refresh your repo
4. You should see a new commit message
5. Open `data.json` and verify changes are there
6. Refresh frontend—new product appears ✅

## Step 7: Customize (Optional)

### Update Frontend Title
Edit `index.html`:
```html
<h1>📦 My Store</h1>  <!-- Change this -->
```

### Update Colors
Edit `style.css`:
```css
:root {
  --primary-color: #your-color;  /* Your brand color */
}
```

### Add Custom Domain
1. Own a domain? (e.g., `mystore.com`)
2. In repository **Settings → Pages**
3. Enter custom domain
4. Update DNS at your registrar
5. GitHub will create `CNAME` file

For free domain with GitHub Pages: `username.github.io`

## Troubleshooting Deployment

### Site Shows 404

**"There isn't a GitHub Pages site here"**

**Solution:**
1. Verify Settings → Pages is enabled
2. Check correct branch is selected
3. Wait 2-3 minutes (sometimes takes longer)
4. Clear browser cache (Ctrl+Shift+Delete)
5. Hard refresh (Ctrl+Shift+R)

### Admin Panel Won't Connect

**"Unauthorized: Invalid token or insufficient permissions"**

**Solution:**
1. Verify token is copied correctly (no spaces)
2. Check token hasn't expired (Settings → Tokens)
3. Verify token has `repo` scope
4. Try with a fresh token
5. Clear browser sessionStorage (F12 → Application → sessionStorage)

### Data.json Not Found

**"File not found" error in admin panel**

**Solution:**
1. Push `data.json` to GitHub if you haven't already
2. Verify it's in repo root (not in a folder)
3. Check file name is exactly `data.json`
4. Verify it's valid JSON (use online JSON validator)

### Changes Not Appearing

**"Changes saved" but frontend doesn't show them**

**Solution:**
1. Hard refresh (Ctrl+Shift+R) - important!
2. Wait 1-2 minutes for GitHub Pages rebuild
3. Check GitHub Actions for deploy status
4. Verify commit was made to GitHub
5. Check `data.json` on GitHub.com for changes

## Advanced Deployment

### Custom Domain

1. Own a domain? Set it up:
   ```
   Settings → Pages → Custom domain
   ```
2. Update DNS records at registrar:
   - Type A records pointing to GitHub IP
   - Or CNAME pointing to: `username.github.io`
3. GitHub handles SSL/HTTPS automatically

### Use Organization Pages

For org site (not personal):
1. Create repo named: `orgname.github.io`
2. Files go to root (not in folder)
3. Site appears at: `https://orgname.github.io` (not on subdirectory)

### GitHub.io Custom URL Structure

**Personal Account (username pages):**
```
https://username.github.io/repo-name/
```

**Organization Account (org pages):**
```
https://orgname.github.io/
```

**Custom Domain:**
```
https://yourdomain.com/
```

## Maintenance

### Update Token Periodically

1. Set token expiration to 30-90 days
2. When expired, generate new token at Settings → Tokens
3. Update token in admin panel (re-enter when signing in)
4. Regenerate old tokens (revoke them)

### Back Up Your Data

1. Regularly use admin panel **Export Data** button
2. Save JSON files locally
3. Commit important backups to GitHub repo
4. Keep version history in GitHub

### Monitor GitHub Actions

1. Click **Actions** tab in repo
2. View deployment history
3. Check for build failures
4. GitHub emails you on failures

## Performance Tips

### Optimize Images

Use optimized image URLs:
```
https://via.placeholder.com/200  # Placeholder
https://images.unsplash.com/...  # Free stock images
```

For larger catalogs, consider hosting images separately (AWS S3, etc.)

### Reduce JSON Size

For very large catalogs (100+ items):
1. Split into multiple `data.json` files
2. Reference different repos/branches
3. Or paginate in frontend code

### Caching Strategy

Frontend can cache data:
1. Add LocalStorage caching in `app.js`
2. Check for updates periodically
3. Reduce GitHub API calls

## Security Reminder

✅ **DO:**
- Regenerate token if exposed
- Use token expiration (30-90 days)
- Keep private repos if sensitive
- Regularly check token access logs

❌ **DON'T:**
- Commit token to GitHub
- Share token in URLs
- Use same token across apps
- Set token to never expire

## Monitoring & Logs

### GitHub Actions Logs
1. Click **Actions** tab
2. View deployment logs
3. Check for build/deploy failures
4. See commit history

### Check API Rate Limit
In browser console after using admin panel:
```javascript
// GitHub returns rate limit info in response headers
// You get 5,000 requests/hour with auth
```

## Next Steps

1. ✅ Deploy to GitHub Pages (this guide)
2. ✅ Configure your products
3. ✅ Customize styling
4. ✅ Share frontend URL with others
5. ✅ Use admin panel for management

## Support

**Issues?**
1. Check **README.md** for detailed docs
2. Review **QUICK_START.md** for quick setup
3. Check **CONFIG.md** for customization options
4. Review **Troubleshooting** section above

**GitHub Pages Docs:**
- https://docs.github.com/en/pages

**GitHub API Docs:**
- https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28

---

**Deployed successfully!** 🎉

Your personal CMS is now live on GitHub Pages.
