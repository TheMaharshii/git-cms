<p align="center">
  <img src="https://pbxt.replicate.delivery/2PX94viD6lJSDVayQrGyDH7CGu7IjQ6e8HEtOGDeelefXRdOC/out.png" alt="CMS Banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-web-black?style=for-the-badge" alt="Platform Web" />
  <img src="https://img.shields.io/badge/stack-vanilla_js-111827?style=for-the-badge&logo=javascript" alt="Vanilla JS" />
  <a href="https://github.com/maharshimyriad/cms/stargazers"><img src="https://img.shields.io/github/stars/maharshimyriad/cms?style=for-the-badge" alt="GitHub Stars" /></a>
  <a href="https://github.com/maharshimyriad/cms/network/members"><img src="https://img.shields.io/github/forks/maharshimyriad/cms?style=for-the-badge" alt="GitHub Forks" /></a>
</p>

<h1>Personal CMS / Product Manager 🌟</h1>

<p>
  Personal CMS is a lightweight GitHub-powered catalog manager built with vanilla JavaScript.
  It uses <code>data.json</code> as the source of truth, with a clean frontend and a simple admin panel.
  No backend required.
</p>

<h2>Connect Your Own Repo + Key (2 minutes)</h2>

<ol>
  <li>Copy this project into your own GitHub repository.</li>
  <li>Make sure <code>data.json</code> exists at the repository root.</li>
  <li>Open <code>admin.html</code> and sign in with username, repo, branch (usually <code>main</code>), and PAT.</li>
  <li>Open <code>index.html</code>; owner/repo/branch are auto-saved from admin login.</li>
</ol>

<p>Optional default configuration in <code>index.html</code>:</p>

<pre><code>&lt;script&gt;
  window.CMS_DEFAULT_OWNER = 'your-github-username';
  window.CMS_DEFAULT_REPO = 'your-repo-name';
  window.CMS_DEFAULT_BRANCH = 'main';
&lt;/script&gt;
</code></pre>

<h2>Features</h2>

<ul>
  <li><strong>Frontend Display Page</strong> (<code>index.html</code>) with search, filter, sort, and view toggle.</li>
  <li><strong>Admin Panel</strong> (<code>admin.html</code>) with full CRUD operations.</li>
  <li><strong>GitHub as Database</strong> using <code>data.json</code> and GitHub REST API.</li>
  <li><strong>Secure Authentication</strong> via manual PAT entry (not hardcoded).</li>
  <li><strong>No Backend Required</strong>, fully static and deployable on GitHub Pages.</li>
  <li><strong>Responsive UI</strong> for desktop and mobile.</li>
</ul>

<h2>File Structure</h2>

<pre><code>.
├── index.html           # Frontend display page
├── admin.html           # Admin panel
├── style.css            # Styling for both pages
├── github-api.js        # GitHub API helper class
├── app.js               # Frontend logic
├── admin.js             # Admin panel logic
├── data.json            # Database file (stored in GitHub repo)
└── assets/              # SVG logo and icon assets
</code></pre>

<h2>Data Structure</h2>

<p>Expected <code>data.json</code> format:</p>

<pre><code>{
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
</code></pre>

<p>Required/optional fields:</p>
<ul>
  <li><code>id</code> (required): unique identifier</li>
  <li><code>name</code> (required): product name</li>
  <li><code>price</code> (required): numeric value</li>
  <li><code>description</code> (optional)</li>
  <li><code>image</code> (optional)</li>
  <li><code>category</code> (optional)</li>
</ul>

<h2>Setup Instructions</h2>

<h3>Step 1: Create a GitHub Repository</h3>
<ol>
  <li>Go to <a href="https://github.com/new">github.com/new</a>.</li>
  <li>Create a new repository (for example: <code>my-cms</code>).</li>
  <li>Initialize it with a README.</li>
  <li>Clone locally or upload files directly.</li>
</ol>

<h3>Step 2: Add Project Files</h3>
<ul>
  <li><code>index.html</code></li>
  <li><code>admin.html</code></li>
  <li><code>data.json</code></li>
  <li><code>style.css</code></li>
  <li><code>github-api.js</code></li>
  <li><code>app.js</code></li>
  <li><code>admin.js</code></li>
</ul>

<pre><code>git add .
git commit -m "Initial commit: add CMS app"
git push origin main
</code></pre>

<h3>Step 3: Create a Personal Access Token (PAT)</h3>
<ol>
  <li>Go to <a href="https://github.com/settings/tokens">github.com/settings/tokens</a>.</li>
  <li>Create either:
    <ul>
      <li><strong>Fine-grained token</strong> (recommended): target repo + <strong>Contents: Read and write</strong></li>
      <li><strong>Classic token</strong>: <code>repo</code> (or <code>public_repo</code> for public-only use)</li>
    </ul>
  </li>
  <li>Copy token immediately (GitHub only shows it once).</li>
</ol>

<h3>Step 4: Deploy to GitHub Pages</h3>
<ol>
  <li>Open repository settings.</li>
  <li>Go to Pages section.</li>
  <li>Set source branch (usually <code>main</code>).</li>
  <li>Wait 1-2 minutes for deployment.</li>
</ol>

<p>URL example: <code>https://username.github.io/repo-name</code></p>

<h3>Step 5: Access the App</h3>
<ul>
  <li>Frontend: <code>https://username.github.io/repo-name/index.html?owner=username&amp;repo=repo-name&amp;branch=main</code></li>
  <li>Admin: <code>https://username.github.io/repo-name/admin.html</code></li>
</ul>

<p>Or sign in once in <code>admin.html</code>; frontend reuses saved owner/repo/branch.</p>

<h2>How to Use</h2>

<h3>Frontend</h3>
<ol>
  <li>Open <code>index.html</code> or your deployed frontend URL.</li>
  <li>Data loads from GitHub <code>data.json</code> in selected branch.</li>
  <li>Use search, category filter, sort, view toggle, and admin link.</li>
</ol>

<h3>Admin Panel</h3>
<ol>
  <li>Open <code>admin.html</code>.</li>
  <li>Enter GitHub username, repo, branch, and PAT.</li>
  <li>Click Sign In.</li>
  <li>Add, edit, delete, search, export, and import items.</li>
</ol>

<h2>GitHub API Operations</h2>

<p>Fetch file:</p>
<pre><code>GET /repos/{owner}/{repo}/contents/data.json</code></pre>

<p>Update file:</p>
<pre><code>PUT /repos/{owner}/{repo}/contents/data.json</code></pre>

<p>Update payload includes:</p>
<ul>
  <li><code>message</code></li>
  <li><code>content</code> (base64 JSON)</li>
  <li><code>sha</code> (for conflict safety)</li>
  <li><code>branch</code></li>
</ul>

<h2>Security Notes</h2>

<h3>Token Security</h3>
<ul>
  <li>PAT is never hardcoded.</li>
  <li>PAT is not saved to disk.</li>
  <li>PAT is never committed to repository.</li>
  <li>Use token expiration and rotate regularly.</li>
</ul>

<h3>Best Practices</h3>
<ul>
  <li>Prefer fine-grained tokens with least privilege.</li>
  <li>Limit token to required repository.</li>
  <li>Regenerate tokens if compromised.</li>
</ul>

<h2>Troubleshooting</h2>

<ul>
  <li><strong>Unauthorized / Invalid token:</strong> regenerate token, verify scopes/permissions.</li>
  <li><strong>Repository not found:</strong> verify owner/repo spelling and permissions.</li>
  <li><strong>File not found:</strong> ensure <code>data.json</code> exists at repository root.</li>
  <li><strong>Decode errors:</strong> repair invalid <code>data.json</code> content.</li>
  <li><strong>Frontend not updating:</strong> hard refresh and wait for Pages rebuild.</li>
</ul>

<h2>Advanced Usage</h2>

<h3>Custom Domain</h3>
<ol>
  <li>Set custom domain in GitHub Pages settings.</li>
  <li>Add <code>CNAME</code> file.</li>
  <li>Configure DNS at registrar.</li>
</ol>

<h3>Bulk Operations</h3>
<ol>
  <li>Export all data.</li>
  <li>Edit JSON locally.</li>
  <li>Import data back.</li>
</ol>

<h3>Multiple Repositories</h3>
<p>Use different owner/repo values per deployment or admin login.</p>

<h2>Limitations &amp; Considerations</h2>

<ul>
  <li>No multi-user account system.</li>
  <li>No concurrent edit lock system.</li>
  <li>Large JSON files may impact performance.</li>
  <li>Internet is required for GitHub sync.</li>
  <li>No transactional database guarantees.</li>
</ul>

<h2>Browser Support</h2>

<ul>
  <li>Chrome / Chromium (latest)</li>
  <li>Firefox (latest)</li>
  <li>Safari (latest)</li>
  <li>Edge (latest)</li>
  <li>Modern mobile browsers</li>
</ul>

<p>Requires ES6 support, Fetch API, and LocalStorage.</p>

<h2>License</h2>
<p>This project is open source and free to use.</p>

<h2>Support</h2>
<p>
  For issues, check Troubleshooting first, verify PAT permissions/expiration,
  and confirm <code>data.json</code> exists with valid JSON.
</p>

<hr />

<p><strong>Built with vanilla JavaScript — no frameworks, no build step, no dependencies.</strong></p>
<p>Enjoy your personal CMS! 🚀</p>
