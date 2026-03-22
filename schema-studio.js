function schemaMessage(text, type = 'info') {
  const node = document.getElementById('schema-message');
  if (!node) return;
  node.textContent = text;
  node.className = `message message-${type}`;
  node.style.display = 'block';
}

function schemaPath(obj, path) {
  return String(path || '')
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean)
    .reduce((acc, token) => (acc && token in acc ? acc[token] : undefined), obj);
}

function inferTypes(rows) {
  const fieldMap = new Map();

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    Object.keys(row).forEach((field) => {
      if (!fieldMap.has(field)) {
        fieldMap.set(field, { types: new Set(), requiredCount: 0 });
      }
      const info = fieldMap.get(field);
      const value = row[field];
      info.requiredCount += value !== undefined && value !== null && String(value).trim() !== '' ? 1 : 0;
      const type = Array.isArray(value) ? 'array' : typeof value;
      info.types.add(type);
    });
  });

  return Array.from(fieldMap.entries()).map(([field, info]) => ({
    field,
    types: Array.from(info.types).sort(),
    required: info.requiredCount === rows.length,
  }));
}

async function loadSchemaData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);
    const data = await response.json();
    document.getElementById('schema-data').value = JSON.stringify(data, null, 2);
    schemaMessage('Loaded data.json.', 'success');
  } catch (error) {
    schemaMessage(String(error.message || 'Load failed.'), 'error');
  }
}

function inferSchema() {
  try {
    const data = JSON.parse(document.getElementById('schema-data').value || '{}');
    const path = document.getElementById('schema-array-path').value.trim() || 'items';
    const rows = schemaPath(data, path);
    if (!Array.isArray(rows)) throw new Error(`Path "${path}" is not an array.`);

    const schema = { path, fields: inferTypes(rows) };
    document.getElementById('schema-rules').value = JSON.stringify(schema, null, 2);
    document.getElementById('schema-report').textContent = `Schema inferred on ${rows.length} rows with ${schema.fields.length} fields.`;
    schemaMessage('Schema inference complete.', 'success');
  } catch (error) {
    schemaMessage(String(error.message || 'Inference failed.'), 'error');
  }
}

function validateSchema() {
  try {
    const data = JSON.parse(document.getElementById('schema-data').value || '{}');
    const schema = JSON.parse(document.getElementById('schema-rules').value || '{}');
    const rows = schemaPath(data, schema.path || 'items');
    if (!Array.isArray(rows)) throw new Error('Schema path does not resolve to an array.');
    if (!Array.isArray(schema.fields)) throw new Error('Schema must include fields array.');

    const issues = [];

    rows.forEach((row, rowIndex) => {
      schema.fields.forEach((fieldDef) => {
        const value = row?.[fieldDef.field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        const isEmpty = value === undefined || value === null || String(value).trim() === '';

        if (fieldDef.required && isEmpty) {
          issues.push(`Row ${rowIndex + 1}: required field "${fieldDef.field}" is empty`);
          return;
        }

        if (!isEmpty && Array.isArray(fieldDef.types) && fieldDef.types.length && !fieldDef.types.includes(type)) {
          issues.push(`Row ${rowIndex + 1}: field "${fieldDef.field}" type ${type} not in [${fieldDef.types.join(', ')}]`);
        }
      });
    });

    document.getElementById('schema-report').textContent = issues.length
      ? `Validation issues: ${issues.length}\n${issues.slice(0, 60).join('\n')}`
      : `Validation passed. ${rows.length} rows checked.`;

    schemaMessage('Schema validation completed.', issues.length ? 'error' : 'success');
  } catch (error) {
    schemaMessage(String(error.message || 'Validation failed.'), 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('schema-load')?.addEventListener('click', loadSchemaData);
  document.getElementById('schema-infer')?.addEventListener('click', inferSchema);
  document.getElementById('schema-validate')?.addEventListener('click', validateSchema);
});
