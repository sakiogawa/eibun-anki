/* ---------- CSV ---------- */
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false;
  text = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  for (let i=0;i<text.length;i++) { const c = text[i];
    if (inQ) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else { if (c === '"') inQ = true; else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += c; } }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}
function looksLikeHeader(row) {
  const cells = row.map(c => c.trim().toLowerCase());
  const t = ['english','eng','英文','japanese','ja','日本語','日本語訳','訳','note','メモ','備考','カテゴリ','category'];
  return cells.some(c => t.includes(c));
}
function importCSV(text) {
  const rows = parseCSV(text); if (!rows.length) return { added: 0, skipped: 0 };
  let start = looksLikeHeader(rows[0]) ? 1 : 0, added = 0, skipped = 0;
  for (let i=start;i<rows.length;i++) { const [en='',ja='',note=''] = rows[i];
    if (en.trim() && ja.trim()) { addSentence(en, ja, note, false); added++; } else skipped++; }
  save(); return { added, skipped };
}
