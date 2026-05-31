/* ---------- ゆるめ判定 / diff ---------- */
function normalize(str) { return str.toLowerCase().replace(/['’`]/g,'').replace(/[.,!?;:"“”()\-–—]/g,' ').replace(/\s+/g,' ').trim(); }
function isCorrect(input, answer) { return normalize(input) === normalize(answer); }
function wordDiff(answer, input) {
  const aTok = answer.trim().split(/\s+/).filter(Boolean), iTok = input.trim().split(/\s+/).filter(Boolean);
  const aN = aTok.map(normalize), iN = iTok.map(normalize), n = aN.length, m = iN.length;
  const dp = Array.from({ length: n+1 }, () => new Array(m+1).fill(0));
  for (let i=n-1;i>=0;i--) for (let j=m-1;j>=0;j--) dp[i][j] = aN[i]===iN[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const out = []; let i=0,j=0;
  while (i<n && j<m) { if (aN[i]===iN[j]) { out.push({t:aTok[i],k:'ok'}); i++; j++; } else if (dp[i+1][j]>=dp[i][j+1]) { out.push({t:aTok[i],k:'miss'}); i++; } else j++; }
  while (i<n) { out.push({t:aTok[i],k:'miss'}); i++; }
  return out;
}

/* ---------- 出題 ---------- */
function shuffle(arr) { const a = [...arr]; for (let i=a.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function buildQueue(mode, category) {
  const inBox = s => s.inWrongBox;
  if (mode === 'box') return shuffle(state.sentences.filter(inBox)).slice(0, state.settings.sessionSize).map(s => s.id);
  if (mode === 'category') {
    const cats = Array.isArray(category) ? category : [category];
    const set = new Set(cats.map(c => c || ''));
    const all = state.sentences.filter(s => set.has(s.note || ''));
    return [...shuffle(all.filter(inBox)), ...shuffle(all.filter(s => !inBox(s)))].map(s => s.id);
  }
  let base = state.sentences.filter(s => s.status !== 'mastered'); if (base.length === 0) base = state.sentences;
  return shuffle(base).slice(0, state.settings.sessionSize).map(s => s.id);
}
let session = null;
function startSession(mode, category) {
  const queue = buildQueue(mode, category); if (queue.length === 0) { go('home'); return; }
  let label = mode === 'box' ? '間違え復習' : mode === 'category'
    ? (Array.isArray(category) && category.length > 1 ? `カテゴリ ${category.length}件` : 'カテゴリ練習') : '練習';
  session = { queue, idx: 0, results: [], mode, category: category || null, label };
  go('practice');
}

/* ---------- カテゴリ ---------- */
const CAT_PALETTE = ['#6FC18E','#6FA8E0','#B196E8','#F2A65A','#F08FB4','#6FC1B8','#E59E6F','#8FB46F','#D58FD5','#7FB0D0'];
function catColor(name) { if (!name) return '#C5C1B6'; let h = 0; for (const ch of name) h = (h*31 + ch.charCodeAt(0)) >>> 0; return CAT_PALETTE[h % CAT_PALETTE.length]; }
function categoryList() {
  const map = new Map();
  for (const s of state.sentences) {
    const value = (s.note || '').trim(), name = value || '（カテゴリなし）';
    if (!map.has(value)) map.set(value, { value, name, total: 0, box: 0, mastered: 0 });
    const e = map.get(value); e.total++; if (s.inWrongBox) e.box++; if (s.status === 'mastered') e.mastered++;
  }
  return [...map.values()];
}

/* ---------- 学習記録（ストリーク/デイリー） ---------- */
function recordStudy() {
  const t = todayStr(), st = state.stats;
  if (!st.days.includes(t)) st.days.push(t);
  if (st.daily.date !== t) st.daily = { date: t, count: 0 };
  st.daily.count++;
  if (!st.dailyCounts) st.dailyCounts = {};
  st.dailyCounts[t] = (st.dailyCounts[t] || 0) + 1;
  if (st.lastDate !== t) { st.streak = (st.lastDate === yesterdayStr()) ? st.streak + 1 : 1; st.lastDate = t; }
}
function todayCount() { return state.stats.daily.date === todayStr() ? state.stats.daily.count : 0; }

/* ---------- 状態遷移 ---------- */
function applyResult(s, correct) {
  const now = Date.now();
  if (correct) { s.correctCount++; s.streak++; s.lastResult = 'correct';
    if (s.inWrongBox) { if (s.streak >= state.settings.masteredThreshold) { s.inWrongBox = false; s.status = 'mastered'; } else s.status = 'learning'; }
    else { if (s.streak >= state.settings.masteredThreshold) s.status = 'mastered'; else if (s.status === 'new') s.status = 'learning'; }
  } else { s.wrongCount++; s.streak = 0; s.lastResult = 'wrong'; s.inWrongBox = true; s.status = 'learning'; }
  s.lastStudiedAt = now; s.updatedAt = now; recordStudy(); save();
}
function counts() {
  const a = state.sentences;
  return { total: a.length, mastered: a.filter(s => s.status==='mastered').length,
    learning: a.filter(s => s.status==='learning').length, new: a.filter(s => s.status==='new').length,
    box: a.filter(s => s.inWrongBox).length };
}
