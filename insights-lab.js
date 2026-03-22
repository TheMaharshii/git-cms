function insightsMessage(text, type = 'info') {
  const node = document.getElementById('insights-message');
  if (!node) return;
  node.textContent = text;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

async function loadInsightsData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error('Invalid data format.');
    document.getElementById('insights-data').value = JSON.stringify(data, null, 2);
    insightsMessage('Loaded data.json.', 'success');
  } catch (error) {
    insightsMessage(String(error.message || 'Load failed.'), 'error');
  }
}

function filterRows(rows, field, op, value) {
  return rows.filter((row) => {
    const current = row?.[field];
    if (op === 'equals') return String(current) === String(value);
    if (op === 'contains') return String(current || '').toLowerCase().includes(String(value || '').toLowerCase());
    if (op === 'gt') return Number(current) > Number(value);
    if (op === 'lt') return Number(current) < Number(value);
    return true;
  });
}

function aggregate(values, metric) {
  if (metric === 'count') return values.length;
  const nums = values.map((row) => Number(row?.price || 0)).filter((value) => Number.isFinite(value));
  if (!nums.length) return 0;
  if (metric === 'sum') return Number(nums.reduce((sum, value) => sum + value, 0).toFixed(2));
  if (metric === 'avg') return Number((nums.reduce((sum, value) => sum + value, 0) / nums.length).toFixed(2));
  if (metric === 'min') return Math.min(...nums);
  if (metric === 'max') return Math.max(...nums);
  return values.length;
}

function runInsights() {
  try {
    const data = JSON.parse(document.getElementById('insights-data').value || '{}');
    if (!data || !Array.isArray(data.items)) throw new Error('Dataset must include items array.');

    const filterField = document.getElementById('insights-filter-field').value.trim();
    const filterOp = document.getElementById('insights-filter-op').value;
    const filterValue = document.getElementById('insights-filter-value').value;
    const groupBy = document.getElementById('insights-group-by').value.trim() || 'category';
    const metric = document.getElementById('insights-metric').value;

    const filtered = filterField ? filterRows(data.items, filterField, filterOp, filterValue) : data.items;

    const grouped = new Map();
    filtered.forEach((row) => {
      const key = String(row?.[groupBy] ?? 'Unknown');
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    });

    const results = Array.from(grouped.entries()).map(([key, rows]) => ({
      group: key,
      value: aggregate(rows, metric),
      rows: rows.length,
    })).sort((a, b) => b.value - a.value);

    document.getElementById('insights-output').value = JSON.stringify({ results }, null, 2);
    document.getElementById('insights-report').textContent = `Filtered rows: ${filtered.length}\nGroups: ${results.length}\nMetric: ${metric}`;
    insightsMessage('Insight query executed.', 'success');
  } catch (error) {
    insightsMessage(String(error.message || 'Query failed.'), 'error');
  }
}

function downloadInsights() {
  try {
    const data = JSON.parse(document.getElementById('insights-output').value || '{}');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'insights-output.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    insightsMessage('Insights output downloaded.', 'success');
  } catch (error) {
    insightsMessage(String(error.message || 'No valid output to download.'), 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('insights-load')?.addEventListener('click', loadInsightsData);
  document.getElementById('insights-run')?.addEventListener('click', runInsights);
  document.getElementById('insights-download')?.addEventListener('click', downloadInsights);
});
