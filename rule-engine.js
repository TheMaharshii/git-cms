let ruleEngineData = null;

function rulesMessage(text, type = 'info') {
  const node = document.getElementById('rules-message');
  if (!node) return;
  node.textContent = text;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

function rulesDefaultConfig() {
  return JSON.stringify([
    {
      where: { field: 'category', op: 'equals', value: 'Electronics' },
      set: { field: 'category', value: 'Electronics & Gadgets' }
    },
    {
      where: { field: 'price', op: 'gt', value: 500 },
      adjustPricePct: -5
    }
  ], null, 2);
}

async function loadRulesData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error('Invalid data.json format.');

    ruleEngineData = data;
    document.getElementById('rules-data').value = JSON.stringify(ruleEngineData, null, 2);
    if (!document.getElementById('rules-json').value.trim()) {
      document.getElementById('rules-json').value = rulesDefaultConfig();
    }
    rulesMessage('Loaded data.json.', 'success');
  } catch (error) {
    rulesMessage(String(error.message || 'Load failed.'), 'error');
  }
}

function matchWhere(item, where) {
  const field = String(where?.field || '').trim();
  const op = String(where?.op || 'equals').trim();
  const value = where?.value;
  const current = item?.[field];

  if (op === 'equals') return String(current) === String(value);
  if (op === 'contains') return String(current || '').toLowerCase().includes(String(value || '').toLowerCase());
  if (op === 'gt') return Number(current) > Number(value);
  if (op === 'lt') return Number(current) < Number(value);
  if (op === 'notEquals') return String(current) !== String(value);
  return false;
}

function applyRules() {
  try {
    const dataObj = JSON.parse(document.getElementById('rules-data').value || '{}');
    const rules = JSON.parse(document.getElementById('rules-json').value || '[]');
    if (!dataObj || !Array.isArray(dataObj.items)) throw new Error('Dataset must be { "items": [] }.');
    if (!Array.isArray(rules)) throw new Error('Rules must be an array.');

    let mutatedCount = 0;
    const hitCounts = Array(rules.length).fill(0);

    dataObj.items = dataObj.items.map((item) => {
      const next = { ...item };
      let changed = false;

      rules.forEach((rule, index) => {
        if (!matchWhere(next, rule.where || {})) return;
        hitCounts[index] += 1;

        if (rule.set?.field) {
          next[rule.set.field] = rule.set.value;
          changed = true;
        }

        if (Number.isFinite(Number(rule.adjustPricePct))) {
          const currentPrice = Number(next.price || 0);
          const adjusted = currentPrice + (currentPrice * Number(rule.adjustPricePct) / 100);
          next.price = Number(adjusted.toFixed(2));
          changed = true;
        }
      });

      if (changed) mutatedCount += 1;
      return next;
    });

    ruleEngineData = dataObj;
    document.getElementById('rules-data').value = JSON.stringify(ruleEngineData, null, 2);
    document.getElementById('rules-report').textContent = [
      `Rules applied: ${rules.length}`,
      `Items changed: ${mutatedCount}`,
      ...hitCounts.map((count, i) => `Rule ${i + 1} matches: ${count}`)
    ].join('\n');

    rulesMessage('Rules applied successfully.', 'success');
  } catch (error) {
    rulesMessage(String(error.message || 'Rule execution failed.'), 'error');
  }
}

function downloadRulesResult() {
  try {
    const dataObj = JSON.parse(document.getElementById('rules-data').value || '{}');
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'data.rules-applied.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    rulesMessage('Downloaded transformed dataset.', 'success');
  } catch (error) {
    rulesMessage(String(error.message || 'Download failed.'), 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rules-load')?.addEventListener('click', loadRulesData);
  document.getElementById('rules-apply')?.addEventListener('click', applyRules);
  document.getElementById('rules-download')?.addEventListener('click', downloadRulesResult);
  document.getElementById('rules-json').value = rulesDefaultConfig();
});
