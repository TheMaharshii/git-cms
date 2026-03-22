function joinMessage(text, type = 'info') {
  const node = document.getElementById('join-message');
  if (!node) return;
  node.textContent = text;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

function getPathValue(obj, path) {
  return String(path || '')
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean)
    .reduce((acc, token) => (acc && token in acc ? acc[token] : undefined), obj);
}

async function loadDataTo(side) {
  const targetId = side === 'left' ? 'join-left' : 'join-right';
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);
    const data = await response.json();
    document.getElementById(targetId).value = JSON.stringify(data, null, 2);
    joinMessage(`Loaded data.json to ${side}.`, 'success');
  } catch (error) {
    joinMessage(String(error.message || 'Load failed.'), 'error');
  }
}

function runJoin() {
  try {
    const leftObj = JSON.parse(document.getElementById('join-left').value || '{}');
    const rightObj = JSON.parse(document.getElementById('join-right').value || '{}');

    const leftPath = document.getElementById('join-left-path').value.trim() || 'items';
    const rightPath = document.getElementById('join-right-path').value.trim() || 'items';
    const leftKey = document.getElementById('join-left-key').value.trim() || 'id';
    const rightKey = document.getElementById('join-right-key').value.trim() || 'id';
    const joinType = document.getElementById('join-type').value;

    const leftRows = getPathValue(leftObj, leftPath);
    const rightRows = getPathValue(rightObj, rightPath);

    if (!Array.isArray(leftRows) || !Array.isArray(rightRows)) {
      throw new Error('Selected paths must point to arrays on both sides.');
    }

    const rightMap = new Map();
    rightRows.forEach((row) => {
      const key = String(row?.[rightKey] ?? '');
      if (!rightMap.has(key)) rightMap.set(key, []);
      rightMap.get(key).push(row);
    });

    const matchedRight = new Set();
    const joined = [];

    leftRows.forEach((left) => {
      const key = String(left?.[leftKey] ?? '');
      const matches = rightMap.get(key) || [];

      if (matches.length) {
        matches.forEach((right) => {
          joined.push({ ...left, _joined: right });
          matchedRight.add(right);
        });
      } else if (joinType === 'left' || joinType === 'full') {
        joined.push({ ...left, _joined: null });
      }
    });

    if (joinType === 'full') {
      rightRows.forEach((right) => {
        if (!matchedRight.has(right)) {
          joined.push({ _left: null, _joined: right });
        }
      });
    }

    const output = { joined };
    document.getElementById('join-output').value = JSON.stringify(output, null, 2);
    document.getElementById('join-report').textContent = `Join complete\nType: ${joinType}\nLeft rows: ${leftRows.length}\nRight rows: ${rightRows.length}\nOutput rows: ${joined.length}`;
    joinMessage('Join executed successfully.', 'success');
  } catch (error) {
    joinMessage(String(error.message || 'Join failed.'), 'error');
  }
}

function downloadJoinOutput() {
  try {
    const parsed = JSON.parse(document.getElementById('join-output').value || '{}');
    const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'joined-output.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    joinMessage('Joined JSON downloaded.', 'success');
  } catch (error) {
    joinMessage(String(error.message || 'Invalid output JSON.'), 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('join-load-left')?.addEventListener('click', () => loadDataTo('left'));
  document.getElementById('join-load-right')?.addEventListener('click', () => loadDataTo('right'));
  document.getElementById('join-run')?.addEventListener('click', runJoin);
  document.getElementById('join-download')?.addEventListener('click', downloadJoinOutput);
});
