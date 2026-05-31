/* ---------- 永続化 ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    data.sentences = data.sentences || [];
    data.stats = normStats(data.stats);
    return data;
  } catch { return fresh(); }
}
function fresh() { return { sentences: [], settings: { ...DEFAULT_SETTINGS }, stats: normStats() }; }
function normStats(s = {}) {
  const days = s.days || [];
  const daily = s.daily || { date: null, count: 0 };
  const dailyCounts = { ...(s.dailyCounts || {}) };
  // 旧データ互換: days しかない場合も芝生に最低1問として反映
  days.forEach(d => { if (!dailyCounts[d]) dailyCounts[d] = 1; });
  if (daily.date && daily.count) dailyCounts[daily.date] = Math.max(dailyCounts[daily.date] || 0, daily.count);
  return { streak: s.streak || 0, lastDate: s.lastDate || null,
    daily, days, dailyCounts };
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
let state = load();
let __seq = 0;

/* ---------- 日付ヘルパー ---------- */
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function todayStr() { return ymd(new Date()); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate()-1); return ymd(d); }

/* ---------- データ操作 ---------- */
function uid() { return 'id-' + Math.floor(performance.now()*1000).toString(36) + '-' + (++__seq); }
function addSentence(english, japanese, note = '', persist = true) {
  const now = Date.now();
  state.sentences.push({ id: uid(), english: english.trim(), japanese: japanese.trim(), note: note.trim(),
    createdAt: now, updatedAt: now, status: 'new', correctCount: 0, wrongCount: 0, streak: 0,
    inWrongBox: false, lastResult: null, lastStudiedAt: null });
  if (persist) save();
}
function updateSentence(id, fields) { const s = state.sentences.find(x => x.id === id); if (!s) return; Object.assign(s, fields, { updatedAt: Date.now() }); save(); }
function deleteSentence(id) { state.sentences = state.sentences.filter(x => x.id !== id); save(); }
