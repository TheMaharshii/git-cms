let marketsData = [];

function marketsShowError(message) {
  const el = document.getElementById('markets-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function marketsClearError() {
  const el = document.getElementById('markets-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

async function fetchMarkets() {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CoinGecko failed (${res.status})`);
  return res.json();
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(Number(value || 0));
}

function renderMarkets(rows) {
  const tbody = document.getElementById('markets-table-body');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No matches found.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((coin) => `
    <tr>
      <td>${coin.market_cap_rank ?? '-'}</td>
      <td>
        <div class="market-coin-cell">
          <img src="${coin.image}" alt="${coin.name}" width="20" height="20">
          <strong>${coin.name}</strong>
          <span class="market-symbol">${String(coin.symbol || '').toUpperCase()}</span>
        </div>
      </td>
      <td>${formatMoney(coin.current_price)}</td>
      <td class="${Number(coin.price_change_percentage_24h || 0) >= 0 ? 'market-up' : 'market-down'}">
        ${Number(coin.price_change_percentage_24h || 0).toFixed(2)}%
      </td>
      <td>${formatMoney(coin.market_cap)}</td>
      <td>${formatMoney(coin.total_volume)}</td>
    </tr>
  `).join('');
}

async function loadMarkets() {
  const meta = document.getElementById('markets-meta');
  if (meta) meta.textContent = 'Loading market data...';
  marketsClearError();

  try {
    marketsData = await fetchMarkets();
    renderMarkets(marketsData);
    if (meta) meta.textContent = `Loaded ${marketsData.length} coins · ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    marketsShowError(error.message);
    if (meta) meta.textContent = 'Failed to load market data';
  }
}

function filterMarkets(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderMarkets(marketsData);
    return;
  }
  const filtered = marketsData.filter((coin) => (
    String(coin.name || '').toLowerCase().includes(q)
    || String(coin.symbol || '').toLowerCase().includes(q)
  ));
  renderMarkets(filtered);
}

function initMarkets() {
  document.getElementById('markets-refresh')?.addEventListener('click', loadMarkets);
  document.getElementById('markets-search')?.addEventListener('input', (event) => {
    filterMarkets(event.target.value || '');
  });
  loadMarkets();
}

document.addEventListener('DOMContentLoaded', initMarkets);
