function showReportsError(message) {
  const el = document.getElementById('reports-message');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const floor = Math.floor(index);
  const ceil = Math.ceil(index);
  if (floor === ceil) return sorted[floor];
  return sorted[floor] + ((sorted[ceil] - sorted[floor]) * (index - floor));
}

function setStats(items) {
  const prices = items.map((item) => Number(item.price || 0)).sort((a, b) => a - b);
  const total = items.length;
  const categories = new Set(items.map((item) => item.category || 'Uncategorized')).size;
  const sum = prices.reduce((acc, value) => acc + value, 0);
  const avg = total ? sum / total : 0;
  const median = percentile(prices, 0.5);

  document.getElementById('r-total').textContent = String(total);
  document.getElementById('r-categories').textContent = String(categories);
  document.getElementById('r-avg').textContent = `$${avg.toFixed(2)}`;
  document.getElementById('r-median').textContent = `$${median.toFixed(2)}`;
  document.getElementById('r-min').textContent = `$${(prices[0] || 0).toFixed(2)}`;
  document.getElementById('r-max').textContent = `$${(prices[prices.length - 1] || 0).toFixed(2)}`;
}

function drawBarChart(canvas, labels, values, color = '#60a5fa') {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 48;
  const max = Math.max(1, ...values);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f0f11';
  ctx.fillRect(0, 0, width, height);

  const barWidth = (width - (padding * 2)) / Math.max(1, values.length);

  values.forEach((value, index) => {
    const x = padding + (index * barWidth) + 8;
    const usableHeight = height - (padding * 2);
    const h = (value / max) * usableHeight;
    const y = height - padding - h;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(10, barWidth - 16), h);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '12px Inter, system-ui, sans-serif';
    const label = String(labels[index] || '').slice(0, 12);
    ctx.fillText(label, x, height - 18);

    ctx.fillStyle = '#fafafa';
    ctx.fillText(String(value), x, y - 8);
  });
}

function buildTopProducts(items) {
  const container = document.getElementById('top-products');
  if (!container) return;
  const top = [...items]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 8);

  container.innerHTML = top.map((item) => `
    <article class="item-card">
      ${item.image ? `<div class="item-image"><img loading="lazy" src="${item.image}" alt="${item.name}"></div>` : ''}
      <div class="item-content">
        <h3 class="item-name">${item.name}</h3>
        <p class="item-category">${item.category || 'Uncategorized'}</p>
        <div class="item-footer"><span class="item-price">$${Number(item.price || 0).toFixed(2)}</span></div>
      </div>
    </article>
  `).join('');
}

function buildPriceHistogram(items) {
  const prices = items.map((item) => Number(item.price || 0));
  if (!prices.length) return { labels: [], values: [] };

  const max = Math.max(...prices);
  const binCount = 8;
  const step = Math.max(1, max / binCount);
  const bins = Array.from({ length: binCount }, () => 0);

  prices.forEach((price) => {
    const idx = Math.min(binCount - 1, Math.floor(price / step));
    bins[idx] += 1;
  });

  const labels = bins.map((_, index) => {
    const start = index * step;
    const end = start + step;
    return `$${start.toFixed(0)}-$${end.toFixed(0)}`;
  });

  return { labels, values: bins };
}

async function initReports() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    setStats(items);

    const categoryMap = new Map();
    items.forEach((item) => {
      const key = item.category || 'Uncategorized';
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });

    const categoryEntries = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    drawBarChart(
      document.getElementById('category-chart'),
      categoryEntries.map(([label]) => label),
      categoryEntries.map(([, value]) => value),
      '#60a5fa'
    );

    const histogram = buildPriceHistogram(items);
    drawBarChart(document.getElementById('price-chart'), histogram.labels, histogram.values, '#34d399');

    buildTopProducts(items);
  } catch (error) {
    showReportsError(error.message);
  }
}

document.addEventListener('DOMContentLoaded', initReports);
