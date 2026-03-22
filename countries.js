let countriesData = [];

function countriesShowError(message) {
  const el = document.getElementById('countries-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function countriesClearError() {
  const el = document.getElementById('countries-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function fmtNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

async function fetchCountries() {
  const url = 'https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,nativeName';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Countries API failed (${res.status})`);
  return res.json();
}

function renderCountries(rows) {
  const grid = document.getElementById('countries-grid');
  if (!grid) return;

  if (!rows.length) {
    grid.innerHTML = '<p class="empty-state">No countries match your filters.</p>';
    return;
  }

  grid.innerHTML = rows.map((country) => {
    const name = country?.name?.common || 'Unknown';
    const capital = Array.isArray(country.capital) ? country.capital[0] : 'N/A';
    const region = country.region || 'N/A';
    const population = fmtNumber(country.population || 0);
    const nativeName = country.nativeNames ? Object.values(country.nativeNames)[0] : 'N/A';

    return `
      <article class="api-card">
        <img src="${country.flags?.svg || country.flags?.png || ''}" alt="${name}" class="country-flag" loading="lazy">
        <h3>${name}</h3>
        <p>Capital: ${capital}</p>
        <p>Region: ${region}</p>
        <p>Population: ${population}</p>
        <p>nativeName: ${nativeName}</p>
      </article>
    `;
  }).join('');
}

function applyCountryFilters() {
  const query = document.getElementById('countries-search')?.value.trim().toLowerCase() || '';
  const region = document.getElementById('countries-region')?.value || 'all';

  const filtered = countriesData.filter((country) => {
    const name = String(country?.name?.common || '').toLowerCase();
    const regionMatch = region === 'all' || country.region === region;
    const queryMatch = !query || name.includes(query);
    return regionMatch && queryMatch;
  });

  renderCountries(filtered.slice(0, 120));

  const meta = document.getElementById('countries-meta');
  if (meta) meta.textContent = `${filtered.length} countries matched`;
}

async function initCountries() {
  const meta = document.getElementById('countries-meta');
  countriesClearError();
  if (meta) meta.textContent = 'Loading countries...';

  try {
    countriesData = await fetchCountries();
    applyCountryFilters();
  } catch (error) {
    countriesShowError(error.message);
    if (meta) meta.textContent = 'Unable to load countries';
  }

  document.getElementById('countries-search')?.addEventListener('input', applyCountryFilters);
  document.getElementById('countries-region')?.addEventListener('change', applyCountryFilters);
}

document.addEventListener('DOMContentLoaded', initCountries);
