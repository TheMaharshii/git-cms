function wbShowMessage(message, type = 'info') {
  const node = document.getElementById('workbench-message');
  if (!node) return;
  node.textContent = message;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

function wbParse(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function wbGetPath(obj, path) {
  const tokens = String(path || '').split('.').map((t) => t.trim()).filter(Boolean);
  return tokens.reduce((acc, token) => {
    if (acc && typeof acc === 'object' && token in acc) {
      return acc[token];
    }
    return undefined;
  }, obj);
}

function wbSetPath(obj, path, value) {
  const tokens = String(path || '').split('.').map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) return value;
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let pointer = root;

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const key = tokens[i];
    const current = pointer[key];
    pointer[key] = (current && typeof current === 'object' && !Array.isArray(current)) ? { ...current } : {};
    pointer = pointer[key];
  }

  pointer[tokens[tokens.length - 1]] = value;
  return root;
}

function wbUniqueByKey(items, idKey, priority) {
  const map = new Map();
  const ordered = priority === 'b' ? [...items].reverse() : [...items];

  ordered.forEach((entry, index) => {
    const fallback = `__index_${index}`;
    const key = String(entry?.[idKey] ?? fallback);
    if (!map.has(key)) {
      map.set(key, entry);
    }
  });

  const unique = Array.from(map.values());
  return priority === 'b' ? unique.reverse() : unique;
}

function wbFormatBoth() {
  const areaA = document.getElementById('json-a');
  const areaB = document.getElementById('json-b');
  if (!areaA || !areaB) return;

  try {
    const parsedA = wbParse(areaA.value || '{}', 'JSON A');
    const parsedB = wbParse(areaB.value || '{}', 'JSON B');
    areaA.value = JSON.stringify(parsedA, null, 2);
    areaB.value = JSON.stringify(parsedB, null, 2);
    wbShowMessage('Both JSON inputs formatted.', 'success');
  } catch (error) {
    wbShowMessage(String(error.message), 'error');
  }
}

function wbValidateAndCompare() {
  const areaA = document.getElementById('json-a');
  const areaB = document.getElementById('json-b');
  const report = document.getElementById('wb-report');
  if (!areaA || !areaB || !report) return;

  try {
    const parsedA = wbParse(areaA.value || '{}', 'JSON A');
    const parsedB = wbParse(areaB.value || '{}', 'JSON B');

    const keysA = Object.keys(parsedA || {});
    const keysB = Object.keys(parsedB || {});
    const shared = keysA.filter((key) => keysB.includes(key));
    const onlyA = keysA.filter((key) => !keysB.includes(key));
    const onlyB = keysB.filter((key) => !keysA.includes(key));

    report.textContent = [
      'Validation: OK',
      `Top-level keys in A: ${keysA.length}`,
      `Top-level keys in B: ${keysB.length}`,
      `Shared keys (${shared.length}): ${shared.join(', ') || 'none'}`,
      `Only in A (${onlyA.length}): ${onlyA.join(', ') || 'none'}`,
      `Only in B (${onlyB.length}): ${onlyB.join(', ') || 'none'}`,
    ].join('\n');

    wbShowMessage('Validation and comparison complete.', 'success');
  } catch (error) {
    report.textContent = '';
    wbShowMessage(String(error.message), 'error');
  }
}

function wbMerge(priority) {
  const areaA = document.getElementById('json-a');
  const areaB = document.getElementById('json-b');
  const output = document.getElementById('wb-output');
  const report = document.getElementById('wb-report');
  const pathInput = document.getElementById('wb-array-path');
  const keyInput = document.getElementById('wb-id-key');

  if (!areaA || !areaB || !output || !report || !pathInput || !keyInput) return;

  try {
    const parsedA = wbParse(areaA.value || '{}', 'JSON A');
    const parsedB = wbParse(areaB.value || '{}', 'JSON B');
    const path = pathInput.value.trim() || 'items';
    const idKey = keyInput.value.trim() || 'id';

    const arrA = wbGetPath(parsedA, path);
    const arrB = wbGetPath(parsedB, path);

    if (!Array.isArray(arrA) || !Array.isArray(arrB)) {
      throw new Error(`Path "${path}" must point to arrays in both JSON A and JSON B.`);
    }

    const mergedArray = wbUniqueByKey([...arrA, ...arrB], idKey, priority);
    const base = priority === 'b' ? parsedB : parsedA;
    const mergedObject = wbSetPath(base, path, mergedArray);

    output.value = JSON.stringify(mergedObject, null, 2);

    report.textContent = [
      `Merge complete (${priority === 'b' ? 'B priority' : 'A priority'})`,
      `Path: ${path}`,
      `Unique key: ${idKey}`,
      `Input count A: ${arrA.length}`,
      `Input count B: ${arrB.length}`,
      `Output count: ${mergedArray.length}`,
    ].join('\n');

    wbShowMessage('Merge completed successfully.', 'success');
  } catch (error) {
    wbShowMessage(String(error.message), 'error');
  }
}

function wbDownloadResult() {
  const output = document.getElementById('wb-output');
  if (!output || !output.value.trim()) {
    wbShowMessage('Run a merge first to generate output.', 'error');
    return;
  }

  try {
    const parsed = wbParse(output.value, 'Merged output');
    const content = JSON.stringify(parsed, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'merged-output.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    wbShowMessage('Merged output downloaded.', 'success');
  } catch (error) {
    wbShowMessage(String(error.message), 'error');
  }
}

async function wbLoadFileToArea(filePath, areaId, label) {
  const area = document.getElementById(areaId);
  if (!area) return;

  try {
    const response = await fetch(filePath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load ${filePath} (${response.status})`);
    }
    const data = await response.json();
    area.value = JSON.stringify(data, null, 2);
    wbShowMessage(`${label} loaded from ${filePath}.`, 'success');
  } catch (error) {
    wbShowMessage(String(error.message || `Unable to load ${filePath}`), 'error');
  }
}

function bindWorkbenchEvents() {
  document.getElementById('wb-format')?.addEventListener('click', wbFormatBoth);
  document.getElementById('wb-validate')?.addEventListener('click', wbValidateAndCompare);
  document.getElementById('wb-merge-a-priority')?.addEventListener('click', () => wbMerge('a'));
  document.getElementById('wb-merge-b-priority')?.addEventListener('click', () => wbMerge('b'));
  document.getElementById('wb-download')?.addEventListener('click', wbDownloadResult);
  document.getElementById('wb-load-catalog-a')?.addEventListener('click', () => wbLoadFileToArea('data.json', 'json-a', 'Catalog data (A)'));
  document.getElementById('wb-load-catalog-b')?.addEventListener('click', () => wbLoadFileToArea('data.json', 'json-b', 'Catalog data (B)'));
}

document.addEventListener('DOMContentLoaded', bindWorkbenchEvents);
