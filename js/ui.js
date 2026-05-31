/* ============================================================
   ルーティング
   ============================================================ */
let editingId = null, listFilter = 'all', listQuery = '', recognition = null;
let selectedCats = new Set(), editCat = '';
const app = document.getElementById('app');
const bottomnav = document.getElementById('bottomnav');
const backdrop = document.getElementById('backdrop');
const sheet = document.getElementById('sheet');
backdrop.onclick = () => closeSheet();

const TAB_SCREENS = { home: true, list: true, settings: true };
function go(view) {
  if (view === 'home') renderHome();
  else if (view === 'practice') renderPractice();
  else if (view === 'edit') renderEdit();
  else if (view === 'list') renderList();
  else if (view === 'result') renderResult();
  else if (view === 'settings') renderSettings();
  else if (view === 'catselect') renderCatSelect();
  renderNav(view);
  window.scrollTo(0, 0);
}
function renderNav(view) {
  const tab = TAB_SCREENS[view];
  bottomnav.classList.toggle('hidden', !tab);
  if (!tab) return;
  const items = [['home','ホーム','home'],['practice','練習','practice'],['list','一覧','list'],['settings','設定','settings']];
  const active = view;
  bottomnav.innerHTML = items.map(([key,label,icon]) =>
    `<button data-nav="${key}" class="${active===key?'on':''}">${svg(icon)}<span>${label}</span></button>`).join('');
  bottomnav.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
    const k = b.dataset.nav;
    if (k === 'practice') { if (counts().total) startSession('random'); else go('home'); }
    else go(k);
  });
}

/* ============================================================
   ホーム
   ============================================================ */
function renderHome() {
  const c = counts(), st = state.stats;
  const goal = state.settings.dailyGoal, done = todayCount();
  const pct = goal ? Math.min(1, done / goal) : 0, lit = done >= goal && goal > 0;
  const remain = Math.max(0, goal - done);
  const now = new Date(), h = now.getHours();
  const hi = h < 11 ? 'おはよう' : h < 18 ? 'こんにちは' : 'こんばんは';
  const dstr = `${now.getMonth()+1}月${now.getDate()}日 ${['日','月','火','水','木','金','土'][now.getDay()]}曜日`;

  app.innerHTML = `
    <div class="scr-header">
      <div class="greet"><div class="g-hi">${hi}、Saki ${micon('eco')}</div><div class="g-date">${dstr}</div></div>
      <span class="streak">${svg('shield')}${st.streak}日</span>
    </div>

    <div class="card glcard">
      <div class="gl-ring ${lit?'lit':''}">
        ${ringSVG(pct, 88, 8)}
        <div class="gl-center">
          <span class="gl-now">${done}</span><span class="gl-goal">/ ${goal}</span>
        </div>
      </div>
      <div class="gl-body">
        <div class="gl-title">今日のグリーンライト</div>
        <div class="gl-msg">${lit ? `点灯！よくがんばりました ${micon('celebration')}` : `あと${remain}問で点灯！`}</div>
        <div class="gl-sub">覚えた英文 ${c.mastered} / ${c.total}</div>
        ${done>0 ? `<span class="gl-tag">${micon('thumb_up')}調子いいね</span>` : ''}
      </div>
    </div>

    <div class="sect-label">英文の進み具合</div>
    <div class="card progress-card">${learningStatusDashboard(c)}</div>

    <div class="sect-label">今日の練習</div>
    <div class="card" style="padding:6px">
      <div class="mode-row" data-mode="random" ${c.total===0?'aria-disabled="true"':''}>
        <div class="mode-sq">${micon('shuffle')}</div>
        <div class="mode-main"><div class="mode-title">ランダム練習</div>
          <div class="mode-sub">未マスターから ${Math.min(state.settings.sessionSize, c.total)}問</div></div>
        <span class="chev">${svg('chevron')}</span>
      </div>
      <div class="mode-row" data-mode="box" ${c.box===0?'aria-disabled="true"':''}>
        <div class="mode-sq coral">${micon('replay')}</div>
        <div class="mode-main"><div class="mode-title">間違え復習</div>
          <div class="mode-sub">間違えボックス・${c.box}問</div></div>
        <span class="chev">${svg('chevron')}</span>
      </div>
      <div class="mode-row" data-mode="catselect" ${c.total===0?'aria-disabled="true"':''}>
        <div class="mode-sq violet">${micon('library_books')}</div>
        <div class="mode-main"><div class="mode-title">カテゴリ別</div>
          <div class="mode-sub">${categoryList().length}カテゴリから選ぶ</div></div>
        <span class="chev">${svg('chevron')}</span>
      </div>
    </div>

    <div class="sect-label">今週のリズム</div>
    <div class="card">${weekDots()}</div>

    <div class="sect-label">学習ヒートマップ</div>
    <div class="card">${learningHeatmap()}</div>

    ${c.total===0 ? `<p class="hint" style="text-align:center;margin-top:16px">下の「練習」や右上の管理から英文を登録してください。</p>` : ''}
  `;
  app.querySelectorAll('.mode-row').forEach(row => row.onclick = () => {
    const m = row.dataset.mode;
    if (m === 'catselect') go('catselect'); else startSession(m);
  });
}
function weekDots() {
  const now = new Date(), dow = (now.getDay()+6)%7, monday = new Date(now); monday.setDate(now.getDate()-dow);
  const labels = ['月','火','水','木','金','土','日'], tstr = todayStr(); let html = '';
  for (let i=0;i<7;i++) { const d = new Date(monday); d.setDate(monday.getDate()+i); const key = ymd(d);
    const done = state.stats.days.includes(key), today = key === tstr;
    html += `<div class="wd ${done?'done':''} ${today?'today':''}"><div class="wd-dot">${done?svg('check'):''}</div><div class="wd-lbl">${labels[i]}</div></div>`;
  }
  return `<div class="week">${html}</div>`;
}
function learningStatusDashboard(c) {
  const newCount = c.new ?? Math.max(0, c.total - c.mastered - c.learning);
  const total = Math.max(1, c.total);
  const pct = n => Math.round(n / total * 100);
  const masteredPct = pct(c.mastered), learningPct = pct(c.learning), newPct = pct(newCount);
  return `<div class="status-bar" aria-label="英文の学習状態">
      <span class="status-seg mastered" style="width:${masteredPct}%"></span>
      <span class="status-seg learning" style="width:${learningPct}%"></span>
      <span class="status-seg new" style="width:${newPct}%"></span>
    </div>
    <div class="status-stats">
      <div class="status-stat mastered"><div class="status-num">${c.mastered}</div><div class="status-label">覚えた</div><div class="status-pct">${c.total ? masteredPct : 0}%</div></div>
      <div class="status-stat learning"><div class="status-num">${c.learning}</div><div class="status-label">覚え中</div><div class="status-pct">${c.total ? learningPct : 0}%</div></div>
      <div class="status-stat new"><div class="status-num">${newCount}</div><div class="status-label">未着手</div><div class="status-pct">${c.total ? newPct : 0}%</div></div>
    </div>`;
}
function heatLevel(count) {
  if (!count) return 0;
  if (count < 5) return 1;
  if (count < 10) return 2;
  if (count < 20) return 3;
  return 4;
}
function learningHeatmap(days = 98) {
  const counts = state.stats.dailyCounts || {};
  const end = new Date();
  const start = new Date(end); start.setDate(end.getDate() - (days - 1));
  const offset = start.getDay(); // 日曜始まりでGitHub風に縦7マスへ並べる
  start.setDate(start.getDate() - offset);
  const today = todayStr();
  let cells = '', months = '', i = 0, lastMonth = -1;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = ymd(d), n = counts[key] || 0, lv = heatLevel(n);
    const col = Math.floor(i / 7) + 1;
    if (d.getMonth() !== lastMonth) {
      months += `<span class="heat-month" style="grid-column:${col}">${d.getMonth()+1}月</span>`;
      lastMonth = d.getMonth();
    }
    cells += `<span class="heat-cell ${lv ? `lv${lv}` : ''}" title="${key}: ${n}問" aria-label="${key}: ${n}問"></span>`;
    i++;
  }
  const todayN = counts[today] || 0;
  return `<div class="heatmap-head"><div class="heatmap-title">直近3か月の学習量</div><div class="heatmap-sub">今日 ${todayN}問</div></div>
    <div class="heatmap-scroll">
      <div class="heatmap-grid">${cells}</div>
      <div class="heatmap-months">${months}</div>
    </div>`;
}
function ringSVG(pct, size, stroke) {
  const r = (size-stroke)/2, c = 2*Math.PI*r, off = c*(1-pct), cx = size/2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="gl-disc">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--grn)" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cx})"/>
  </svg>`;
}

/* ============================================================
   カテゴリ選択（複数選択）
   ============================================================ */
function renderCatSelect() {
  const cats = categoryList();
  app.innerHTML = `
    <div class="scr-header">
      <button class="icon-btn" id="back">${svg('back')}</button>
      <div class="h-title">カテゴリを選ぶ</div>
    </div>
    <p class="hint" style="margin:0 2px 14px">練習したいカテゴリを選んでください（複数選択OK）。</p>
    <div class="cat-toolbar">
      <button class="pill" id="catAll">すべて選択</button>
      <button class="pill" id="catNone">選択解除</button>
      <span class="cat-sel-count" id="catSelCount"></span>
    </div>
    <div class="cat-grid" id="catGrid">${cats.map(e => catCard(e, selectedCats.has(e.value))).join('')}</div>
    <div style="position:sticky;bottom:90px;margin-top:16px">
      <button class="btn btn-grn btn-block" id="startCats" disabled>カテゴリを選んでください</button>
    </div>`;
  app.querySelector('#back').onclick = () => go('home');
  const grid = app.querySelector('#catGrid');
  const refresh = () => {
    const n = selectedCats.size, q = cats.filter(e => selectedCats.has(e.value)).reduce((a,e)=>a+e.total,0);
    app.querySelector('#catSelCount').textContent = n ? `${n}カテゴリ / ${q}問` : '未選択';
    const btn = app.querySelector('#startCats'); btn.disabled = n === 0;
    btn.textContent = n ? `選択したカテゴリで練習 (${q}問)` : 'カテゴリを選んでください';
  };
  const setCard = (card, on) => { card.classList.toggle('selected', on); card.querySelector('.check').innerHTML = on ? svg('check') : svg('circle'); };
  grid.querySelectorAll('.cat-card').forEach(card => card.onclick = () => {
    const v = card.dataset.cat; if (selectedCats.has(v)) selectedCats.delete(v); else selectedCats.add(v);
    setCard(card, selectedCats.has(v)); refresh();
  });
  app.querySelector('#catAll').onclick = () => { cats.forEach(e => selectedCats.add(e.value)); grid.querySelectorAll('.cat-card').forEach(c => setCard(c, true)); refresh(); };
  app.querySelector('#catNone').onclick = () => { selectedCats.clear(); grid.querySelectorAll('.cat-card').forEach(c => setCard(c, false)); refresh(); };
  app.querySelector('#startCats').onclick = () => { if (selectedCats.size) startSession('category', [...selectedCats]); };
  refresh();
}
function catCard(e, selected) {
  const meta = e.box > 0 ? `<span class="cc-box">復習${e.box}</span>` : `<span class="cc-n">${e.total}問</span>`;
  return `<button class="cat-card ${selected?'selected':''}" data-cat="${escapeAttr(e.value)}">
    <span class="dot" style="background:${catColor(e.value)}"></span>
    <span class="cc-name">${escapeHtml(e.name)}</span>${meta}
    <span class="check">${selected ? svg('check') : svg('circle')}</span></button>`;
}

/* ============================================================
   練習
   ============================================================ */
function renderPractice() {
  const s = state.sentences.find(x => x.id === session.queue[session.idx]);
  if (!s) { finishSession(); return; }
  const total = session.queue.length, cur = session.idx + 1;
  const speechOK = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  const cat = (s.note || '').trim();
  app.innerHTML = `
    <div class="p-top">
      <button class="icon-btn" id="closeP">${svg('close')}</button>
      <div class="pbar"><span style="width:${(session.idx/total)*100}%"></span></div>
      <span class="p-count">${cur}/${total}</span>
    </div>
    <div class="card">
      ${cat ? `<div class="q-cat"><span class="chip"><span class="dot" style="background:${catColor(cat)}"></span>${escapeHtml(cat)}</span></div>` : ''}
      <div class="ja-prompt">${escapeHtml(s.japanese)}</div>
      <div class="field" style="margin:18px 0 0">
        <textarea class="input" id="answer" rows="2" placeholder="英文を入力…" autocapitalize="off" autocomplete="off"></textarea>
      </div>
      <div class="mic-row">
        <button class="mic-btn" id="micBtn" ${speechOK?'':'disabled'}>${svg('mic')}</button>
        <span class="mic-status" id="micStatus">${speechOK ? 'マイクで声に出して答える' : '※ このブラウザは音声入力に非対応'}</span>
      </div>
    </div>
    <button class="btn btn-grn btn-block" id="checkBtn" style="margin-top:6px">答え合わせ</button>
    <button class="btn btn-soft btn-block" id="skipBtn" style="margin-top:10px">スキップ</button>`;

  const answer = app.querySelector('#answer');
  setTimeout(() => answer.focus(), 50);
  app.querySelector('#closeP').onclick = () => { closeSheet(); go('home'); };
  function check() {
    const val = answer.value.trim(); if (!val) { answer.focus(); return; }
    const correct = isCorrect(val, s.english);
    applyResult(s, correct); session.results.push({ id: s.id, correct });
    showFeedback(s, val, correct);
  }
  app.querySelector('#checkBtn').onclick = check;
  app.querySelector('#skipBtn').onclick = () => {
    session.results.push({ id: s.id, skipped: true });
    nextQuestion();
  };
  answer.addEventListener('keydown', e => { if ((e.metaKey||e.ctrlKey) && e.key === 'Enter') check(); });

  const micBtn = app.querySelector('#micBtn'), micStatus = app.querySelector('#micStatus');
  if (speechOK) micBtn.onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; recognition = new SR();
    recognition.lang = state.settings.recognitionLang; recognition.interimResults = false; recognition.maxAlternatives = 1;
    micStatus.innerHTML = '<span class="recording">● 録音中…話してください</span>';
    recognition.onresult = (e) => { const txt = e.results[0][0].transcript; answer.value = (answer.value?answer.value+' ':'')+txt; micStatus.textContent = '認識しました（必要なら手で修正）'; };
    recognition.onerror = (e) => { micStatus.textContent = '認識できませんでした（'+e.error+'）'; };
    recognition.onend = () => { if (micStatus.querySelector('.recording')) micStatus.textContent = 'マイクで声に出して答える'; };
    recognition.start();
  };
}
function showFeedback(s, input, correct) {
  if (correct) {
    sheet.className = 'sheet correct';
    sheet.innerHTML = `
      <div class="s-head"><span class="s-emoji">🎉</span>正解！その調子</div>
      <div class="s-msg">よく覚えていますね。</div>
      <div class="ans-block"><div class="ans-cap">正しい英文</div><div class="ans-en">${escapeHtml(s.english)}</div></div>
      <button class="btn btn-grn btn-block" id="nextBtn" style="margin-top:8px">つづける</button>`;
  } else {
    const diff = wordDiff(s.english, input).map(w => w.k==='miss' ? `<span class="hl">${escapeHtml(w.t)}</span>` : escapeHtml(w.t)).join(' ');
    sheet.className = 'sheet wrong';
    sheet.innerHTML = `
      <div class="s-head"><span class="s-emoji">🙂</span>おしい！もう少し</div>
      <div class="s-msg">復習ボックスに入れておくね。</div>
      <div class="ans-block"><div class="ans-cap">正しい英文</div><div class="ans-en">${escapeHtml(s.english)}</div></div>
      <div class="ans-block"><div class="ans-cap">あなたの答え</div><div class="ans-en">${diff}</div></div>
      <div class="actions" style="margin-top:14px">
        <button class="btn btn-soft" id="retryBtn" style="flex:1">もう一度</button>
        <button class="btn btn-grn" id="nextBtn" style="flex:1.4">つづける</button>
      </div>`;
  }
  openSheet();
  sheet.querySelector('#nextBtn').onclick = () => { closeSheet(); nextQuestion(); };
  sheet.querySelector('#retryBtn')?.addEventListener('click', () => { closeSheet(); renderPractice(); });
}
function openSheet() { sheet.classList.add('open'); backdrop.classList.add('open'); }
function closeSheet() { sheet.classList.remove('open'); backdrop.classList.remove('open'); }
function nextQuestion() { session.idx++; if (session.idx >= session.queue.length) finishSession(); else renderPractice(); }
function finishSession() { go('result'); }

/* ============================================================
   結果
   ============================================================ */
function renderResult() {
  renderNav('result');
  const r = session.results, skipped = r.filter(x => x.skipped).length;
  const answered = r.filter(x => !x.skipped).length, correct = r.filter(x => x.correct).length, total = answered;
  const pct = total ? Math.round(correct/total*100) : 0, c = counts();
  app.innerHTML = `
    <div class="card result-top">
      <div class="r-title">セッション完了！🎉</div>
      <div class="r-sub">今日もよくがんばりました${skipped ? ` · スキップ ${skipped}問` : ``}</div>
      <div class="donut-wrap">
        ${ringSVG(total?correct/total:0, 150, 14)}
        <div class="donut-center"><div class="donut-pct">${pct}%</div><div class="donut-sub">${correct} / ${total} 正解</div></div>
      </div>
      <div class="stat-tiles">
        <div class="stat-tile t-grn"><div class="st-num">${c.mastered}</div><div class="st-lbl">覚えた</div></div>
        <div class="stat-tile t-amber"><div class="st-num">${c.learning}</div><div class="st-lbl">練習中</div></div>
        <div class="stat-tile t-coral"><div class="st-num">${c.box}</div><div class="st-lbl">復習</div></div>
      </div>
      <div class="streak-pill">${svg('shield')} ${state.stats.streak}日連続 · シールド +1</div>
    </div>
    <div class="actions" style="flex-direction:column">
      ${c.box>0
        ? `<button class="btn btn-grn btn-block" id="againBox">間違えだけ、もう一度（${c.box}）</button>`
        : `<button class="btn btn-grn btn-block" id="againSame">同じ条件でもう一度</button>`}
      <button class="btn btn-soft btn-block" id="toHome">ホームへ戻る</button>
    </div>`;
  app.querySelector('#againBox')?.addEventListener('click', () => startSession('box'));
  app.querySelector('#againSame')?.addEventListener('click', () => startSession(session.mode||'random', session.category));
  app.querySelector('#toHome').onclick = () => go('home');
}

/* ============================================================
   登録・編集（＋CSV）
   ============================================================ */
function renderEdit() {
  const editing = editingId ? state.sentences.find(s => s.id === editingId) : null;
  editCat = editing ? (editing.note || '') : editCat;
  app.innerHTML = `
    <div class="scr-header">
      <button class="icon-btn" id="back">${svg('back')}</button>
      <div class="h-title">${editing ? '英文を編集' : '英文を登録'}</div>
      <button class="txt-action" id="saveTop">保存</button>
    </div>
    <div class="card">
      <div class="field"><label class="field-label">英文（正解）</label>
        <textarea class="input" id="fEn" rows="2" placeholder="I see.">${escapeHtml(editing?.english||'')}</textarea></div>
      <div class="field"><label class="field-label">日本語訳</label>
        <textarea class="input" id="fJa" rows="2" placeholder="なるほど。">${escapeHtml(editing?.japanese||'')}</textarea></div>
      <div class="field"><label class="field-label">カテゴリ</label>
        <div class="pick-chips" id="catPick"></div></div>
      <div id="errMsg" class="hint" style="color:var(--coral);font-weight:800"></div>
      <button class="btn btn-grn btn-block" id="saveBtn" style="margin-top:6px">保存する</button>
      ${editing ? '' : '<button class="btn btn-soft-grn btn-block" id="saveNext" style="margin-top:10px">＋ 保存して続けて登録</button>'}
      ${editing ? '<button class="btn btn-soft btn-block" id="delBtn" style="margin-top:10px;color:var(--coral)">削除</button>' : ''}
    </div>
    ${editing ? '' : `
    <div class="card csv-card">
      <div class="csv-title">📄 CSVで一括登録</div>
      <p class="hint" style="color:#5b7da8">列の順番： <span class="code">英文 , 日本語訳 , カテゴリ(任意)</span>。1行目がヘッダーなら自動スキップ。</p>
      <div class="actions" style="margin-top:10px">
        <button class="btn btn-soft" id="pickCsv" style="flex:1">CSVファイルを選ぶ</button>
        <button class="btn btn-soft" id="dlSample" style="flex:1">サンプル</button>
      </div>
      <input type="file" id="csvFile" accept=".csv,text/csv" style="display:none">
      <div class="field" style="margin:12px 0 0"><label class="field-label" style="color:#5b7da8">または貼り付け</label>
        <textarea class="input" id="csvText" rows="3" placeholder='I see.,なるほど。,会話'></textarea></div>
      <button class="btn btn-grn btn-block" id="importCsvBtn" style="margin-top:10px">取り込む</button>
      <div class="csv-result" id="csvResult"></div>
    </div>`}`;
  app.querySelector('#back').onclick = () => go(editing ? 'list' : 'home');

  // カテゴリ選択チップ
  function renderCatPick() {
    const cats = categoryList().map(e => e.value).filter(Boolean);
    if (editCat && !cats.includes(editCat)) cats.push(editCat);
    const pick = app.querySelector('#catPick');
    pick.innerHTML = cats.map(v => `<button class="pick-chip ${editCat===v?'selected':''}" data-v="${escapeAttr(v)}"><span class="dot" style="background:${catColor(v)}"></span>${escapeHtml(v)}</button>`).join('')
      + `<button class="pick-chip add" id="catAdd">＋ 追加</button>`;
    pick.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { editCat = (editCat === b.dataset.v) ? '' : b.dataset.v; renderCatPick(); });
    pick.querySelector('#catAdd').onclick = () => { const v = prompt('新しいカテゴリ名'); if (v && v.trim()) { editCat = v.trim(); renderCatPick(); } };
  }
  renderCatPick();

  const fEn = app.querySelector('#fEn'), fJa = app.querySelector('#fJa'), err = app.querySelector('#errMsg');
  function doSave(next) {
    const en = fEn.value.trim(), ja = fJa.value.trim();
    if (!en || !ja) { err.textContent = '英文と日本語訳は必須です。'; return; }
    if (editing) updateSentence(editing.id, { english: en, japanese: ja, note: editCat });
    else addSentence(en, ja, editCat);
    if (next) { fEn.value=''; fJa.value=''; err.textContent=''; fEn.focus(); }
    else go(editing ? 'list' : 'home');
  }
  app.querySelector('#saveBtn').onclick = () => doSave(false);
  app.querySelector('#saveTop').onclick = () => doSave(false);
  app.querySelector('#saveNext')?.addEventListener('click', () => doSave(true));
  app.querySelector('#delBtn')?.addEventListener('click', () => { if (confirm('この英文を削除しますか？')) { deleteSentence(editing.id); go('list'); } });

  if (!editing) {
    const csvFile = app.querySelector('#csvFile'), csvText = app.querySelector('#csvText'), csvResult = app.querySelector('#csvResult');
    const show = r => { csvResult.innerHTML = `<span style="color:var(--grn-d)">✅ ${r.added}件を登録しました。</span>` + (r.skipped?` <span style="color:var(--mute)">（${r.skipped}件スキップ）</span>`:''); };
    app.querySelector('#pickCsv').onclick = () => csvFile.click();
    csvFile.onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { show(importCSV(rd.result)); csvText.value=''; }; rd.readAsText(f, 'utf-8'); };
    app.querySelector('#importCsvBtn').onclick = () => { const t = csvText.value.trim(); if (!t) { csvResult.innerHTML = '<span style="color:var(--coral)">CSVを貼り付けるかファイルを選んでください。</span>'; return; } show(importCSV(t)); };
    app.querySelector('#dlSample').onclick = () => {
      const sample = 'english,japanese,note\n"I see.",なるほど。,会話\n"It\'s up to you.",あなた次第です。,会話\n';
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([sample], {type:'text/csv'})); a.download = 'eibun-anki-sample.csv'; a.click();
    };
  }
  setTimeout(() => fEn.focus(), 50);
}

/* ============================================================
   一覧
   ============================================================ */
function renderList() {
  const c = counts();
  const filters = [['all','すべて'],['box','復習'],['learning','練習中'],['mastered','覚えた']];
  let items = state.sentences;
  if (listFilter === 'box') items = items.filter(s => s.inWrongBox);
  else if (listFilter !== 'all') items = items.filter(s => s.status === listFilter);
  if (listQuery) { const q = listQuery.toLowerCase(); items = items.filter(s => s.english.toLowerCase().includes(q) || s.japanese.toLowerCase().includes(q) || (s.note||'').toLowerCase().includes(q)); }

  app.innerHTML = `
    <div class="scr-header"><div class="h-title">英文の一覧</div><div class="h-sub num-font">${c.total}</div>
      <button class="icon-btn" id="add">${svg('plus')}</button></div>
    <div class="search">${svg('search')}<input id="q" placeholder="英文・訳で検索" value="${escapeAttr(listQuery)}"></div>
    <div class="pills" style="margin-bottom:14px">
      ${filters.map(([k,l]) => `<button class="pill ${listFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}
    </div>
    <div class="card" style="padding:4px">
      ${items.length === 0 ? `<div class="empty">該当する英文がありません</div>` : items.map(listRow).join('')}
    </div>`;
  app.querySelector('#add').onclick = () => { editingId = null; editCat = ''; go('edit'); };
  app.querySelectorAll('.pill').forEach(p => p.onclick = () => { listFilter = p.dataset.f; renderList(); });
  const q = app.querySelector('#q');
  q.oninput = () => { listQuery = q.value; const pos = q.selectionStart; renderList(); const nq = app.querySelector('#q'); nq.focus(); nq.setSelectionRange(pos,pos); };
  app.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => { editingId = el.dataset.edit; go('edit'); });
}
function listRow(s) {
  const cat = (s.note || '').trim();
  const stMap = { mastered:['s-mastered','覚えた'], learning:['s-learning','練習中'], new:['s-new','未着手'] };
  const stKey = s.inWrongBox ? 'box' : s.status;
  const [sqCls] = s.inWrongBox ? ['s-box'] : (stMap[s.status]||stMap.new);
  const sqInner = s.status === 'mastered' ? svg('check') : '<span class="dot"></span>';
  const catTag = cat ? `<span class="chip"><span class="dot" style="background:${catColor(cat)}"></span>${escapeHtml(cat)}</span>` : '';
  const stChip = s.inWrongBox ? `<span class="chip st-box"><span class="dot"></span>復習</span>`
    : s.status==='mastered' ? `<span class="chip st-mastered"><span class="dot"></span>覚えた</span>`
    : s.status==='learning' ? `<span class="chip st-learning"><span class="dot"></span>練習中</span>`
    : `<span class="chip st-new"><span class="dot"></span>未着手</span>`;
  return `<div class="li" data-edit="${s.id}">
    <div class="li-sq ${sqCls}">${sqInner}</div>
    <div class="li-main"><div class="li-ja">${escapeHtml(s.japanese)}</div>
      <div class="li-en">${escapeHtml(s.english)}</div>
      <div class="li-tags">${catTag}${stChip}</div></div>
  </div>`;
}

/* ============================================================
   設定
   ============================================================ */
function renderSettings() {
  const st = state.settings;
  app.innerHTML = `
    <div class="scr-header"><div class="h-title">設定</div></div>
    <div class="sect-label">学習</div>
    <div class="card" style="padding:4px 18px">
      <div class="setting-line"><span class="label">1セッションの出題数</span>
        <input class="input num-input" id="sSize" type="number" min="1" value="${st.sessionSize}"></div>
      <div class="setting-line"><span class="label">卒業に必要な連続正解</span>
        <input class="input num-input" id="sThresh" type="number" min="1" value="${st.masteredThreshold}"></div>
      <div class="setting-line"><span class="label">1日の目標（グリーンライト）</span>
        <input class="input num-input" id="sGoal" type="number" min="1" value="${st.dailyGoal}"></div>
      <div class="setting-line"><span class="label">音声認識</span>
        <div class="segment"><button data-lang="en-US" class="${st.recognitionLang==='en-US'?'on':''}">US</button><button data-lang="en-GB" class="${st.recognitionLang==='en-GB'?'on':''}">GB</button></div></div>
    </div>
    <div class="sect-label">通知・表示</div>
    <div class="card" style="padding:4px 18px">
      <div class="setting-line"><span class="label">練習リマインダー</span>
        <button class="toggle ${st.reminder?'on':''}" id="tReminder"></button></div>
      <div class="setting-line"><span class="label">ダークモード <span class="hint">（準備中）</span></span>
        <button class="toggle ${st.dark?'on':''}" id="tDark"></button></div>
    </div>
    <div class="sect-label">データ</div>
    <div class="card" style="padding:18px">
      <p class="hint" style="margin:0 0 12px">データは端末内（localStorage）にのみ保存されます。</p>
      <button class="btn btn-soft btn-block" id="exportBtn">${svg('download')} データをエクスポート</button>
      <button class="btn btn-soft btn-block" id="importBtn" style="margin-top:10px">インポート</button>
      <button class="btn btn-soft btn-block" id="resetBtn" style="margin-top:10px;color:var(--coral)">全データ削除</button>
      <input type="file" id="importFile" accept="application/json" style="display:none">
    </div>`;
  const num = (id, key, def) => app.querySelector(id).onchange = e => { state.settings[key] = Math.max(1, parseInt(e.target.value)||def); save(); };
  num('#sSize','sessionSize',10); num('#sThresh','masteredThreshold',2); num('#sGoal','dailyGoal',10);
  app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { state.settings.recognitionLang = b.dataset.lang; save(); renderSettings(); });
  app.querySelector('#tReminder').onclick = () => { state.settings.reminder = !state.settings.reminder; save(); renderSettings(); };
  app.querySelector('#tDark').onclick = () => { state.settings.dark = !state.settings.dark; save(); renderSettings(); };
  app.querySelector('#exportBtn').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); a.download = 'eibun-anki-backup.json'; a.click(); };
  const importFile = app.querySelector('#importFile');
  app.querySelector('#importBtn').onclick = () => importFile.click();
  importFile.onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const d = JSON.parse(rd.result); if (!Array.isArray(d.sentences)) throw new Error('形式不正'); state = { sentences:d.sentences, settings:{...DEFAULT_SETTINGS,...(d.settings||{})}, stats: normStats(d.stats) }; save(); alert('インポートしました'); go('home'); } catch(err){ alert('インポート失敗: '+err.message); } }; rd.readAsText(f); };
  app.querySelector('#resetBtn').onclick = () => { if (confirm('登録した英文と成績をすべて削除します。よろしいですか？')) { state = fresh(); save(); go('home'); } };
}

/* ---------- util ---------- */
function escapeHtml(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s='') { return escapeHtml(s).replace(/\n/g,'&#10;'); }
