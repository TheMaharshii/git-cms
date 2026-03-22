const PLANNER_DATA_URL = 'planner-data.json';

const plannerState = {
  cards: [],
};

async function loadPlannerFromJson() {
  try {
    const response = await fetch(PLANNER_DATA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load ${PLANNER_DATA_URL} (${response.status})`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.cards)) {
      throw new Error(`Invalid ${PLANNER_DATA_URL} format: expected { "cards": [] }`);
    }

    plannerState.cards = normalizeCards(data.cards);
    return plannerState.cards.length;
  } catch (error) {
    throw new Error(String(error.message || `Unable to load ${PLANNER_DATA_URL}`));
  }
}

function normalizeCards(cards) {
  return cards
    .map((card, index) => ({
      id: String(card.id || `card_${String(index + 1).padStart(3, '0')}`),
      title: String(card.title || '').trim(),
      tags: String(card.tags || '').trim(),
      column: ['todo', 'inprogress', 'review', 'done'].includes(card.column) ? card.column : 'todo',
    }))
    .filter((card) => card.title);
}

function nextCardId() {
  const used = new Set(plannerState.cards.map((card) => String(card.id || '').trim()));
  let pointer = plannerState.cards.length + 1;
  while (used.has(`card_${String(pointer).padStart(3, '0')}`)) {
    pointer += 1;
  }
  return `card_${String(pointer).padStart(3, '0')}`;
}

async function reloadPlannerFromJson() {
  const meta = document.getElementById('planner-meta');

  try {
    const count = await loadPlannerFromJson();
    renderPlanner();
    if (meta) meta.textContent = `Loaded ${count} cards from ${PLANNER_DATA_URL}.`;
  } catch (error) {
    if (meta) meta.textContent = String(error.message || 'Unable to load planner-data.json');
  }
}

function downloadPlannerJson() {
  const meta = document.getElementById('planner-meta');
  const payload = {
    cards: plannerState.cards.map((card) => ({
      id: card.id,
      title: card.title,
      tags: card.tags,
      column: card.column,
    })),
  };

  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = PLANNER_DATA_URL;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  if (meta) {
    meta.textContent = `Downloaded ${PLANNER_DATA_URL}. Replace project file to persist changes.`;
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
    id: nextCardId(),
    title,
    tags: tagsInput.value.trim(),
    column: colInput.value,
  });

  titleInput.value = '';
  tagsInput.value = '';
  renderPlanner();
}

function clearBoard() {
  if (!confirm('Clear all planner cards?')) return;
  plannerState.cards = [];
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
  document.getElementById('planner-reload-json')?.addEventListener('click', reloadPlannerFromJson);
  document.getElementById('planner-download-json')?.addEventListener('click', downloadPlannerJson);

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
      renderPlanner();
    });
  });
}

async function initPlanner() {
  const meta = document.getElementById('planner-meta');
  try {
    const count = await loadPlannerFromJson();
    renderPlanner();
    bindPlannerEvents();
    if (meta) {
      meta.textContent = `Loaded ${count} cards from ${PLANNER_DATA_URL}. Changes stay in this tab until you download JSON.`;
    }
  } catch (error) {
    renderPlanner();
    bindPlannerEvents();
    if (meta) {
      meta.textContent = String(error.message || 'Unable to load planner-data.json');
    }
  }
}

document.addEventListener('DOMContentLoaded', initPlanner);
