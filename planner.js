const PLANNER_KEY = 'gitcms_planner_v1';

const plannerState = {
  cards: [],
};

function savePlanner() {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(plannerState.cards));
}

function loadPlanner() {
  try {
    const cards = JSON.parse(localStorage.getItem(PLANNER_KEY) || '[]');
    plannerState.cards = Array.isArray(cards) ? cards : [];
  } catch {
    plannerState.cards = [];
  }
}

function renderPlanner() {
  const lists = document.querySelectorAll('.kanban-list');
  lists.forEach((list) => { list.innerHTML = ''; });

  plannerState.cards.forEach((card) => {
    const list = document.querySelector(`.kanban-list[data-list="${card.column}"]`);
    if (!list) return;

    const node = document.createElement('article');
    node.className = 'kanban-card';
    node.draggable = true;
    node.setAttribute('data-id', card.id);
    node.innerHTML = `
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.tags)}</p>
      <div class="kanban-card-actions">
        <button class="btn btn-secondary btn-sm" type="button" data-action="left">←</button>
        <button class="btn btn-secondary btn-sm" type="button" data-action="right">→</button>
        <button class="btn btn-danger btn-sm" type="button" data-action="delete">Delete</button>
      </div>
    `;

    list.appendChild(node);
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function addCard() {
  const titleInput = document.getElementById('planner-title');
  const tagsInput = document.getElementById('planner-tags');
  const colInput = document.getElementById('planner-column');

  const title = titleInput.value.trim();
  if (!title) return;

  plannerState.cards.push({
    id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    tags: tagsInput.value.trim(),
    column: colInput.value,
  });

  titleInput.value = '';
  tagsInput.value = '';
  savePlanner();
  renderPlanner();
}

function clearBoard() {
  if (!confirm('Clear all planner cards?')) return;
  plannerState.cards = [];
  savePlanner();
  renderPlanner();
}

function shiftColumn(current, direction) {
  const order = ['todo', 'inprogress', 'review', 'done'];
  const idx = order.indexOf(current);
  if (idx === -1) return current;
  if (direction === 'left') return order[Math.max(0, idx - 1)];
  if (direction === 'right') return order[Math.min(order.length - 1, idx + 1)];
  return current;
}

function bindPlannerEvents() {
  document.getElementById('planner-add')?.addEventListener('click', addCard);
  document.getElementById('planner-clear')?.addEventListener('click', clearBoard);

  document.getElementById('kanban-grid')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const actionBtn = target.closest('[data-action]');
    const cardNode = target.closest('.kanban-card');
    if (!(actionBtn instanceof HTMLElement) || !(cardNode instanceof HTMLElement)) return;

    const id = cardNode.getAttribute('data-id');
    const action = actionBtn.getAttribute('data-action');
    const index = plannerState.cards.findIndex((entry) => entry.id === id);
    if (index === -1) return;

    if (action === 'delete') {
      plannerState.cards.splice(index, 1);
    } else {
      plannerState.cards[index].column = shiftColumn(plannerState.cards[index].column, action);
    }

    savePlanner();
    renderPlanner();
  });

  let draggingId = '';

  document.querySelectorAll('.kanban-list').forEach((list) => {
    list.addEventListener('dragstart', (event) => {
      const node = event.target;
      if (!(node instanceof HTMLElement)) return;
      const card = node.closest('.kanban-card');
      if (!(card instanceof HTMLElement)) return;
      draggingId = card.getAttribute('data-id') || '';
    });

    list.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    list.addEventListener('drop', (event) => {
      event.preventDefault();
      const toColumn = list.getAttribute('data-list');
      if (!draggingId || !toColumn) return;
      const card = plannerState.cards.find((entry) => entry.id === draggingId);
      if (!card) return;
      card.column = toColumn;
      draggingId = '';
      savePlanner();
      renderPlanner();
    });
  });
}

function initPlanner() {
  loadPlanner();
  renderPlanner();
  bindPlannerEvents();
}

document.addEventListener('DOMContentLoaded', initPlanner);
