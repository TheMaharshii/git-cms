function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(list) {
  return list[randomInt(0, list.length - 1)];
}

function picsumUrl() {
  const id = randomInt(1, 300);
  const width = randomInt(1700, 2300);
  const height = randomInt(600, 2000);
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

function generateItem(index) {
  const adjectives = ['Smart', 'Modern', 'Ultra', 'Eco', 'Pro', 'Lite', 'Prime'];
  const nouns = ['Speaker', 'Lamp', 'Chair', 'Watch', 'Camera', 'Bottle', 'Notebook'];
  const categories = ['Electronics', 'Home', 'Lifestyle', 'Office', 'Outdoor'];

  return {
    id: `mock_${Date.now()}_${index}_${randomInt(100, 999)}`,
    name: `${randomFrom(adjectives)} ${randomFrom(nouns)}`,
    price: Number((randomInt(12, 350) + Math.random()).toFixed(2)),
    description: 'Auto-generated sample product for catalog testing and demos.',
    image: picsumUrl(),
    category: randomFrom(categories),
  };
}

function generateCatalog(count) {
  const items = Array.from({ length: count }, (_, index) => generateItem(index + 1));
  return { items };
}

function setOutput(text) {
  const output = document.getElementById('studio-output');
  if (!output) return;
  output.value = text;
}

function getOutputJson() {
  const output = document.getElementById('studio-output');
  if (!output) return null;
  return JSON.parse(output.value || '{}');
}

function initStudio() {
  const countInput = document.getElementById('studio-count');

  document.getElementById('studio-generate')?.addEventListener('click', () => {
    const count = Math.min(200, Math.max(1, Number(countInput.value) || 12));
    const catalog = generateCatalog(count);
    setOutput(JSON.stringify(catalog, null, 2));
  });

  document.getElementById('studio-minify')?.addEventListener('click', () => {
    try {
      const json = getOutputJson();
      setOutput(JSON.stringify(json));
    } catch {
      alert('Invalid JSON in editor.');
    }
  });

  document.getElementById('studio-format')?.addEventListener('click', () => {
    try {
      const json = getOutputJson();
      setOutput(JSON.stringify(json, null, 2));
    } catch {
      alert('Invalid JSON in editor.');
    }
  });

  document.getElementById('studio-download')?.addEventListener('click', () => {
    try {
      const json = getOutputJson();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mock-catalog-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Invalid JSON in editor.');
    }
  });

  setOutput(JSON.stringify(generateCatalog(12), null, 2));
}

document.addEventListener('DOMContentLoaded', initStudio);
