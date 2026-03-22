let opsData = null;

function opsMessage(text, type = 'info') {
  const node = document.getElementById('ops-message');
  if (!node) return;
  node.textContent = text;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

function writeOpsOutput() {
  const output = document.getElementById('ops-output');
  if (!output || !opsData) return;
  output.value = JSON.stringify(opsData, null, 2);
}

function parseOutputData() {
  const output = document.getElementById('ops-output');
  if (!output) return;
  try {
    opsData = JSON.parse(output.value || '{}');
  } catch {
    // keep previous in-memory state
  }
}

async function loadOpsData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error('Invalid data.json format: expected { "items": [] }');
    opsData = data;
    writeOpsOutput();
    document.getElementById('ops-report').textContent = `Loaded ${opsData.items.length} items.`;
    opsMessage('Loaded data.json successfully.', 'success');
  } catch (error) {
    opsMessage(String(error.message || 'Failed to load data.'), 'error');
  }
}

function validateData() {
  parseOutputData();
  if (!opsData || !Array.isArray(opsData.items)) {
    opsMessage('Load valid data first.', 'error');
    return;
  }

  const missing = [];
  opsData.items.forEach((item, index) => {
    const fields = ['id', 'name', 'price', 'category'];
    const missingFields = fields.filter((field) => String(item?.[field] ?? '').trim() === '');
    if (missingFields.length) {
      missing.push(`#${index + 1} missing: ${missingFields.join(', ')}`);
    }
  });

  document.getElementById('ops-report').textContent = missing.length
    ? `Validation found ${missing.length} issues:\n${missing.slice(0, 50).join('\n')}`
    : `Validation passed: ${opsData.items.length} items, no required-field issues.`;

  opsMessage('Validation completed.', missing.length ? 'error' : 'success');
}

function dedupeIds() {
  parseOutputData();
  if (!opsData || !Array.isArray(opsData.items)) {
    opsMessage('Load valid data first.', 'error');
    return;
  }

  const seen = new Set();
  let removed = 0;
  opsData.items = opsData.items.filter((item) => {
    const key = String(item?.id || '').trim();
    if (!key) return true;
    if (seen.has(key)) {
      removed += 1;
      return false;
    }
    seen.add(key);
    return true;
  });

  writeOpsOutput();
  document.getElementById('ops-report').textContent = `Deduplication complete. Removed ${removed} duplicate IDs.`;
  opsMessage('IDs deduplicated.', 'success');
}

function normalizeCategories() {
  parseOutputData();
  if (!opsData || !Array.isArray(opsData.items)) {
    opsMessage('Load valid data first.', 'error');
    return;
  }

  let updated = 0;
  opsData.items = opsData.items.map((item) => {
    const original = String(item?.category || '');
    const normalized = original
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ');

    if (original !== normalized) updated += 1;
    return { ...item, category: normalized };
  });

  writeOpsOutput();
  document.getElementById('ops-report').textContent = `Normalized category casing on ${updated} items.`;
  opsMessage('Categories normalized.', 'success');
}

function detectAnomalies() {
  parseOutputData();
  if (!opsData || !Array.isArray(opsData.items)) {
    opsMessage('Load valid data first.', 'error');
    return;
  }

  const prices = opsData.items
    .map((item) => Number(item?.price || 0))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!prices.length) {
    opsMessage('No numeric prices found.', 'error');
    return;
  }

  const q1 = prices[Math.floor((prices.length - 1) * 0.25)];
  const q3 = prices[Math.floor((prices.length - 1) * 0.75)];
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;

  const anomalies = opsData.items.filter((item) => {
    const price = Number(item?.price || 0);
    return Number.isFinite(price) && (price < low || price > high);
  });

  const lines = anomalies.slice(0, 40).map((item) => `${item.id || 'no-id'} | ${item.name || 'Unnamed'} | $${Number(item.price || 0).toFixed(2)}`);
  document.getElementById('ops-report').textContent = `Price anomaly scan\nIQR range: ${low.toFixed(2)} to ${high.toFixed(2)}\nAnomalies: ${anomalies.length}\n${lines.join('\n')}`;
  opsMessage('Anomaly detection complete.', 'success');
}

function downloadOpsJson() {
  parseOutputData();
  if (!opsData) {
    opsMessage('No data to download.', 'error');
    return;
  }

  const blob = new Blob([JSON.stringify(opsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'data.cleaned.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  opsMessage('Downloaded cleaned dataset.', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ops-load')?.addEventListener('click', loadOpsData);
  document.getElementById('ops-validate')?.addEventListener('click', validateData);
  document.getElementById('ops-dedupe')?.addEventListener('click', dedupeIds);
  document.getElementById('ops-normalize')?.addEventListener('click', normalizeCategories);
  document.getElementById('ops-anomalies')?.addEventListener('click', detectAnomalies);
  document.getElementById('ops-download')?.addEventListener('click', downloadOpsJson);
});
