let plannerGithub = null;
let plannerData = { cards: [] };

function plannerShowMessage(message, type = 'info') {
  const box = document.getElementById('planner-admin-message');
  if (!box) return;
  box.textContent = message;
  box.className = `message message-${type}`;
  box.style.display = 'block';
}

function plannerEscapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function normalizePlannerCards(cards) {
  return (Array.isArray(cards) ? cards : [])
    .map((card, index) => ({
      id: String(card?.id || `card_${String(index + 1).padStart(3, '0')}`),
      title: String(card?.title || '').trim(),
      tags: String(card?.tags || '').trim(),
      column: ['todo', 'inprogress', 'review', 'done'].includes(card?.column) ? card.column : 'todo',
    }))
    .filter((card) => card.title);
}

function nextPlannerCardId() {
  const used = new Set(plannerData.cards.map((card) => card.id));
  let count = plannerData.cards.length + 1;
  while (used.has(`card_${String(count).padStart(3, '0')}`)) {
    count += 1;
  }
  return `card_${String(count).padStart(3, '0')}`;
}

function plannerSummaryText() {
  const counts = { todo: 0, inprogress: 0, review: 0, done: 0 };
  plannerData.cards.forEach((card) => {
    counts[card.column] = (counts[card.column] || 0) + 1;
  });
  return `${plannerData.cards.length} cards · Todo ${counts.todo} · In Progress ${counts.inprogress} · Review ${counts.review} · Done ${counts.done}`;
}

function renderPlannerAdminTable() {
  const tbody = document.getElementById('planner-admin-tbody');
  const summary = document.getElementById('planner-admin-summary');
  if (!tbody) return;

  if (!plannerData.cards.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No cards in planner-data.json</td></tr>';
  } else {
    tbody.innerHTML = plannerData.cards.map((card) => `
      <tr>
        <td>${plannerEscapeHtml(card.id)}</td>
        <td>${plannerEscapeHtml(card.title)}</td>
        <td>${plannerEscapeHtml(card.tags)}</td>
        <td>${plannerEscapeHtml(card.column)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" type="button" data-action="left" data-id="${plannerEscapeHtml(card.id)}">←</button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="right" data-id="${plannerEscapeHtml(card.id)}">→</button>
          <button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="${plannerEscapeHtml(card.id)}">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  if (summary) {
    summary.textContent = plannerSummaryText();
  }
}

function plannerShiftColumn(current, action) {
  const order = ['todo', 'inprogress', 'review', 'done'];
  const index = order.indexOf(current);
  if (index === -1) return current;
  if (action === 'left') return order[Math.max(0, index - 1)];
  if (action === 'right') return order[Math.min(order.length - 1, index + 1)];
  return current;
}

async function connectPlannerGitHub() {
  const owner = document.getElementById('planner-owner')?.value.trim();
  const repo = document.getElementById('planner-repo')?.value.trim();
  const branch = document.getElementById('planner-branch')?.value.trim() || 'main';
  const token = document.getElementById('planner-token')?.value.trim();

  if (!owner || !repo || !token) {
    plannerShowMessage('Owner, repo, and token are required.', 'error');
    return;
  }

  try {
    plannerGithub = new GitHubAPI(owner, repo, branch, token, 'planner-data.json');
    await plannerGithub.validateRepository();
    const payload = await plannerGithub.fetchData();
    plannerData = {
      cards: normalizePlannerCards(payload?.data?.cards),
    };
    renderPlannerAdminTable();
    plannerShowMessage('Connected and loaded planner-data.json.', 'success');
  } catch (error) {
    plannerShowMessage(String(error.message || 'Failed to connect/load planner data.'), 'error');
  }
}

async function savePlannerGitHub() {
  if (!plannerGithub) {
    plannerShowMessage('Connect to GitHub first.', 'error');
    return;
  }

  try {
    await plannerGithub.updateData({ cards: plannerData.cards }, 'Update planner-data.json via Planner Admin');
    plannerShowMessage('planner-data.json saved to GitHub successfully.', 'success');
  } catch (error) {
    plannerShowMessage(String(error.message || 'Failed to save planner-data.json'), 'error');
  }
}

function addPlannerCard() {
  const titleInput = document.getElementById('planner-card-title');
  const tagsInput = document.getElementById('planner-card-tags');
  const columnInput = document.getElementById('planner-card-column');
  if (!titleInput || !tagsInput || !columnInput) return;

  const title = titleInput.value.trim();
  if (!title) {
    plannerShowMessage('Card title is required.', 'error');
    return;
  }

  plannerData.cards.push({
    id: nextPlannerCardId(),
    title,
    tags: tagsInput.value.trim(),
    column: columnInput.value,
  });

  titleInput.value = '';
  tagsInput.value = '';
  renderPlannerAdminTable();
}

function downloadPlannerAdminJson() {
  const content = JSON.stringify({ cards: plannerData.cards }, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'planner-data.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function bindPlannerAdminEvents() {
  document.getElementById('planner-connect')?.addEventListener('click', connectPlannerGitHub);
  document.getElementById('planner-save')?.addEventListener('click', savePlannerGitHub);
  document.getElementById('planner-card-add')?.addEventListener('click', addPlannerCard);
  document.getElementById('planner-card-download')?.addEventListener('click', downloadPlannerAdminJson);

  document.getElementById('planner-admin-tbody')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('[data-action]');
    if (!(button instanceof HTMLElement)) return;

    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    const index = plannerData.cards.findIndex((card) => card.id === id);
    if (index === -1) return;

    if (action === 'delete') {
      plannerData.cards.splice(index, 1);
    } else {
      plannerData.cards[index].column = plannerShiftColumn(plannerData.cards[index].column, action);
    }

    renderPlannerAdminTable();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderPlannerAdminTable();
  bindPlannerAdminEvents();
});
