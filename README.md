<h1>Git-CMS 🚀</h1>

<p>
  Git-CMS is a static, GitHub-backed catalog CMS built with vanilla JavaScript.
  Public users browse <code>index.html</code> without auth, and admins manage catalog data from <code>admin.html</code> using GitHub API.
</p>

<h2>What It Is</h2>
<ul>
  <li><strong>Public catalog frontend</strong> (no token required)</li>
  <li><strong>Advanced admin panel</strong> (GitHub PAT required for save/sync)</li>
  <li><strong>Single data file</strong>: <code>data.json</code></li>
  <li><strong>No backend server</strong>, static-host friendly (GitHub Pages, Netlify, etc.)</li>
</ul>

<h2>Major Features</h2>

<h3>New Multi-Page Experience</h3>
<ul>
  <li><strong>gallery.html</strong>: Picsum masonry gallery with API caching, lightbox, filters, and load-more append behavior</li>
  <li><strong>reports.html</strong>: Visual analytics dashboard from <code>data.json</code> (stats, category chart, histogram, top products)</li>
  <li><strong>planner.html</strong>: JSON-first Kanban board that loads from <code>planner-data.json</code> with deterministic card IDs</li>
  <li><strong>planner-admin.html</strong>: GitHub-backed editor for <code>planner-data.json</code> (same owner/repo/branch/token flow as catalog admin)</li>
  <li><strong>json-workbench.html</strong>: Advanced JSON validate/compare/merge tool with configurable array path and unique key</li>
  <li><strong>studio.html</strong>: Mock catalog generator + JSON formatter/minifier/downloader for rapid testing</li>
  <li><strong>weather.html</strong>: Live weather + forecast search using Open-Meteo geocoding and forecast APIs</li>
  <li><strong>markets.html</strong>: Crypto market board (top coins, movement, volume) powered by CoinGecko API</li>
  <li><strong>github-explorer.html</strong>: Repository discovery/search using GitHub Search API</li>
  <li><strong>countries.html</strong>: Region and population explorer powered by REST Countries API</li>
  <li><strong>newsfeed.html</strong>: Hacker News discovery feed with query and pagination using Algolia HN API</li>
</ul>

<h3>Frontend (Public)</h3>
<ul>
  <li>Search with multi-word matching</li>
  <li>Category filtering + quick category chips</li>
  <li>Price range filtering (min/max)</li>
  <li>Favorites system + favorites-only filter</li>
  <li>Image-only filter</li>
  <li>Sort by name, price, random shuffle</li>
  <li>Cards/table view toggle with persistence</li>
  <li>Pagination + page-size controls</li>
  <li>Random product pick + highlight jump</li>
  <li>Recently viewed items + clear recent</li>
  <li>Share current filtered view via URL</li>
  <li>Export visible items as JSON</li>
  <li>Saved view presets (save/apply/delete)</li>
  <li>Auto-refresh (off/30s/60s/120s)</li>
  <li>Per-item JSON copy action</li>
  <li>Scroll progress indicator + back-to-top button</li>
  <li>Keyboard shortcuts: <code>/</code>, <code>v</code>, <code>n</code>, <code>p</code>, <code>Esc</code></li>
</ul>

<h3>Admin</h3>
<ul>
  <li>GitHub authentication (owner/repo/branch/token)</li>
  <li>Add, edit, delete, duplicate items</li>
  <li>Advanced filters, sorting, pagination</li>
  <li>Bulk select and bulk operations (delete/category/price adjust)</li>
  <li>Stats dashboard (total, categories, avg price, total value, missing images)</li>
  <li>Undo/redo local history</li>
  <li>Unsaved-change tracking + beforeunload guard</li>
  <li>Save-all and reload-from-GitHub workflows</li>
  <li>Form draft autosave + restore/clear draft</li>
  <li>Live image preview</li>
  <li>JSON live preview panel</li>
  <li>Validation utilities (data quality, duplicate IDs, category normalization)</li>
  <li>Quick sample product generator</li>
  <li>Import JSON (replace/merge)</li>
  <li>Export all JSON, visible JSON, visible CSV</li>
  <li>Admin keyboard shortcuts: <code>Ctrl/Cmd+S</code>, <code>Ctrl/Cmd+F</code>, <code>Esc</code></li>
</ul>

<h2>Picsum Sample Images</h2>
<p>
  Admin sample products now use Lorem Picsum image URLs in this format:
  <code>https://picsum.photos/id/{id}/{width}/{height}</code>
</p>
<ul>
  <li><strong>id:</strong> random from <code>1</code> to <code>300</code></li>
  <li><strong>width:</strong> random from <code>1700</code> to <code>2300</code></li>
  <li><strong>height:</strong> random from <code>600</code> to <code>2000</code></li>
  <li>Use <strong>Generate Picsum</strong> in admin form for instant test images</li>
</ul>

<h2>Project Structure</h2>
<pre><code>.
├── index.html
├── app.js
├── admin.html
├── admin.js
├── gallery.html
├── gallery.js
├── reports.html
├── reports.js
├── planner.html
├── planner.js
├── planner-admin.html
├── planner-admin.js
├── json-workbench.html
├── json-workbench.js
├── studio.html
├── studio.js
├── weather.html
├── weather.js
├── markets.html
├── markets.js
├── github-explorer.html
├── github-explorer.js
├── countries.html
├── countries.js
├── newsfeed.html
├── newsfeed.js
├── github-api.js
├── style.css
├── data.json
├── planner-data.json
├── about.html
├── README.md
└── assets/
</code></pre>

<h2>Data Format</h2>
<pre><code>{
  "items": [
    {
      "id": "prod_001",
      "name": "Product Name",
      "price": 29.99,
      "description": "Description",
      "image": "https://picsum.photos/id/237/1920/1000",
      "category": "Category"
    }
  ]
}
</code></pre>

<h2>Run Locally</h2>
<p>From project root:</p>
<pre><code># Linux/macOS
bash run.sh

# Windows
run.bat
</code></pre>

<p>If needed, direct run:</p>
<pre><code>python3 -m http.server 8000
</code></pre>

<p>Then open:</p>
<ul>
  <li><code>http://localhost:8000/index.html</code></li>
  <li><code>http://localhost:8000/admin.html</code></li>
</ul>

<h2>Admin Setup (GitHub)</h2>
<ol>
  <li>Create a PAT at <a href="https://github.com/settings/tokens">GitHub Tokens</a>.</li>
  <li>Grant contents write access for your repo.</li>
  <li>Open <code>admin.html</code> and sign in with owner/repo/branch/token.</li>
</ol>

<h2>Security Notes</h2>
<ul>
  <li>Token is entered manually in admin UI.</li>
  <li>No token is committed to repository code.</li>
  <li>Rotate PAT regularly and use least privilege.</li>
</ul>

<h2>Limitations</h2>
<ul>
  <li>Not a multi-user role-based CMS</li>
  <li>Data scale depends on JSON size and client performance</li>
  <li>No server-side search/indexing layer</li>
</ul>

<hr />
<p><strong>Git-CMS:</strong> modern static catalog management with zero framework overhead.</p>
