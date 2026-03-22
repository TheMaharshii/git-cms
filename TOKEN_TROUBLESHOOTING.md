# Personal CMS - Token Authorization Troubleshooting

## Issue: "Unauthorized: Invalid token or insufficient permissions"

This error happens when trying to **add, edit, or delete products** in the admin panel.
The error occurs during the **PUT request** (file update) to GitHub.

## Why It Happens

### ✅ What Works (Read Operations)
- Validating repository works ✓
- Seeing the login message works ✓
- These are GET requests - they require only **read access**

### ❌ What Fails (Write Operations)
- Adding products fails ✗
- Editing products fails ✗
- Deleting products fails ✗
- These are PUT requests - they require **write access**

## Solution (Step-by-Step)

### 1. Generate a NEW Personal Access Token

Your current token might be:
- ❌ Invalid or expired
- ❌ Missing the `repo` scope
- ❌ Limited to read-only access

**Do This:**

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"** (or "Fine-grained tokens" if using that)
3. Name it: `CMS-Write-Access` or similar
4. Set **Expiration**: 30-90 days (refresh periodically)
5. Check **Scopes** (IMPORTANT - both needed):
   ```
   ✅ repo (full control of private repositories)
   ```
   This scope includes:
   - `repo:status` - Read/write repository status
   - `repo_deployment` - Read repositories
   - `public_repo` - Access public repositories
   - `repo:invite` - Accept/manage invitations
   - `security_events` - Read/write security events

6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!) 
   - Format looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Use the New Token in Admin Panel

1. Open admin.html
2. Clear the old token from the input field
3. Paste the NEW token from step 1
4. Keep username and repo the same  
5. Click "Validate Repository"
   - Should show: "✓ Repository found: username/repo"
6. Try adding a product again

### 3. Verify Token Has Write Access

If it still fails, verify the token:

1. Go to: https://github.com/settings/tokens
2. Find your `CMS-Write-Access` token
3. Click on it to view details
4. Confirm you see:
   ```
   ✅ This token has access to YOUR_REPO
   ✅ Scopes include: repo
   ```

## Alternative: Use Fine-Grained Personal Access Tokens

GitHub offers newer "fine-grained" tokens with more control:

1. Go to: https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"** (look for fine-grained option)
3. Name: `CMS-Write`
4. Repository: Select your specific repository
5. Permissions needed:
   - ✅ `Contents`: Read and write
6. Generate and copy token
7. Use in admin panel same as above

## Debugging: Check Browser Console

1. Open admin panel
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try adding a product again
5. Look for error messages like:
   ```
   GitHub API Error: ❌ Forbidden: Your token lacks write permissions...
   ```

## Still Not Working? Check These:

### 1. Repository Accessibility
- [ ] Repository name spelled correctly
- [ ] You have access to the repository (not archived)
- [ ] Repository exists at: `https://github.com/USERNAME/REPO_NAME`

### 2. Token Status
- [ ] Token is not expired (check Settings → Tokens)
- [ ] Token has `repo` scope (not just public_repo)
- [ ] Token is active (not revoked)

### 3. File Accessibility
- [ ] `data.json` exists in your repository root
- [ ] File is valid JSON (no syntax errors)
- [ ] File is not in a subfolder (must be root level)

### 4. Try Regenerating Token
- Revoke old token: https://github.com/settings/tokens
- Create brand new token with instructions above
- Use immediately (don't wait)

## Data.json Validation

Before trying again, verify your `data.json` is valid:

```bash
# Copy your data.json content and paste in an online validator:
# https://jsonlint.com/

# Should look like:
{
  "items": [
    {
      "id": "prod_001",
      "name": "Product Name",
      "price": 29.99,
      "description": "Optional description",
      "image": "https://example.com/image.jpg",
      "category": "Category Name"
    }
  ]
}
```

## Quick Fix Checklist

- [ ] 1. Regenerate token with `repo` scope
- [ ] 2. Copy NEW token (old one might be corrupted)
- [ ] 3. Paste into admin panel
- [ ] 4. Clear browser cache (Ctrl+Shift+Delete)
- [ ] 5. Reload admin panel
- [ ] 6. Click "Validate Repository" 
- [ ] 7. Try adding a product
- [ ] 8. Check console (F12) for errors

## If Nothing Works

Try this nuclear option:

1. **Export your data** (if you have products):
   - Use "Export Data" button in admin (if you can get there)
   - Or manually copy `data.json` from GitHub

2. **Create fresh token**:
   - Go to: https://github.com/settings/tokens
   - **Revoke ALL old tokens**
   - Generate ONE new token with `repo` scope
   - Copy immediately

3. **Clear browser storage**:
   - Press **F12** → **Application** tab
   - Clear **localStorage** and **sessionStorage**
   - Reload page

4. **Sign in fresh**:
   - Open admin.html in private/incognito window
   - Sign in with USERNAME, REPO, and NEW TOKEN
   - Try adding a product

## Common Token Mistakes

❌ **WRONG:**
- Using token from wrong GitHub account
- Using expired token (older than 90 days)
- Token with no scopes selected
- Token with only `public_repo` scope (not enough)
- Token with only `read` access (need write)

✅ **RIGHT:**
- Fresh token with `repo` scope
- Token not yet expired
- Token for the correct GitHub account
- Token specifically for your repository
- This token has write permissions

## Support

If you still can't get it working:

1. Check all items in "Quick Fix Checklist" above
2. Review **"Common Token Mistakes"** section
3. Try the "nuclear option" with a completely fresh token
4. Check Firebase/GitHub API documentation for your token type

---

**Remember:** The token is the KEY that unlocks write access. 
A read-only token will always fail on PUT/PATCH/DELETE requests (adding/editing/deleting products).
