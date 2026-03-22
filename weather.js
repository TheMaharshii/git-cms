function weatherShowError(message) {
  const el = document.getElementById('weather-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function weatherClearError() {
  const el = document.getElementById('weather-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

async function geocodeCity(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('City not found');
  const top = data.results[0];
  return {
    latitude: top.latitude,
    longitude: top.longitude,
    name: `${top.name}${top.country ? `, ${top.country}` : ''}`,
  };
}

async function fetchForecast(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather API failed (${res.status})`);
  return res.json();
}

function renderCurrent(current, locationName) {
  const wrap = document.getElementById('weather-current');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="api-card"><h3>Location</h3><p>${locationName}</p></div>
    <div class="api-card"><h3>Temperature</h3><p>${current.temperature_2m}°C</p></div>
    <div class="api-card"><h3>Feels Like</h3><p>${current.apparent_temperature}°C</p></div>
    <div class="api-card"><h3>Humidity</h3><p>${current.relative_humidity_2m}%</p></div>
    <div class="api-card"><h3>Wind</h3><p>${current.wind_speed_10m} km/h</p></div>
  `;
}

function renderForecast(daily) {
  const grid = document.getElementById('weather-forecast');
  if (!grid) return;

  const rows = daily.time.map((date, idx) => ({
    date,
    max: daily.temperature_2m_max[idx],
    min: daily.temperature_2m_min[idx],
    rain: daily.precipitation_probability_max[idx],
  }));

  grid.innerHTML = rows.map((row) => `
    <article class="api-card">
      <h3>${new Date(row.date).toLocaleDateString()}</h3>
      <p>High: ${row.max}°C</p>
      <p>Low: ${row.min}°C</p>
      <p>Rain: ${row.rain}%</p>
    </article>
  `).join('');
}

async function loadCityWeather(city) {
  weatherClearError();
  const meta = document.getElementById('weather-meta');
  if (meta) meta.textContent = 'Loading weather...';

  try {
    const geo = await geocodeCity(city);
    const data = await fetchForecast(geo.latitude, geo.longitude);
    renderCurrent(data.current, geo.name);
    renderForecast(data.daily);
    if (meta) meta.textContent = `Updated for ${geo.name} · ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    weatherShowError(error.message);
    if (meta) meta.textContent = 'Unable to load weather';
  }
}

function loadFromBrowserLocation() {
  if (!navigator.geolocation) {
    weatherShowError('Geolocation is not supported in this browser.');
    return;
  }

  const meta = document.getElementById('weather-meta');
  if (meta) meta.textContent = 'Getting browser location...';

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      weatherClearError();
      const { latitude, longitude } = position.coords;
      const data = await fetchForecast(latitude, longitude);
      renderCurrent(data.current, `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`);
      renderForecast(data.daily);
      if (meta) meta.textContent = `Updated from browser location · ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      weatherShowError(error.message);
      if (meta) meta.textContent = 'Unable to load location weather';
    }
  }, () => {
    weatherShowError('Location permission denied.');
  });
}

function initWeather() {
  document.getElementById('weather-search')?.addEventListener('click', () => {
    const city = document.getElementById('weather-city')?.value.trim() || 'London';
    loadCityWeather(city);
  });

  document.getElementById('weather-city')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const city = event.target.value.trim() || 'London';
      loadCityWeather(city);
    }
  });

  document.getElementById('weather-locate')?.addEventListener('click', loadFromBrowserLocation);

  loadCityWeather('London');
}

document.addEventListener('DOMContentLoaded', initWeather);
