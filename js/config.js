/* ============================================================
   eibun-anki プロトタイプ — vanilla JS（B案 / MyRoutine 風）
   仕様: docs/spec.md 準拠（ゆるめ判定 / 間違えボックス / 件数10 / 連続2回卒業 / CSV / カテゴリ複数選択）
   ============================================================ */
const STORE_KEY = 'eibun-anki/v1';
const DEFAULT_SETTINGS = {
  recognitionLang: 'en-US', masteredThreshold: 2, sessionSize: 10,
  dailyGoal: 10, reminder: true, dark: false,
};

/* ---------- アイコン（インラインSVG） ---------- */
const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  shield: '<path d="M12 3l7 2.5V11c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V5.5z" fill="currentColor" stroke="none"/>',
  download: '<path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"/>', plus: '<path d="M12 6v12M6 12h12"/>',
  check: '<path d="M5 12l4 4 10-10"/>', circle: '<circle cx="12" cy="12" r="9"/>',
  home: '<path d="M4 11l8-7 8 7M6 10v9h12v-9"/>',
  practice: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
  settings: '<circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="16" r="2.4"/><path d="M11 8h9M4 8h2M13 16h7M4 16h6"/>',
};
function svg(name, opts = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${opts}>${ICON[name] || ''}</svg>`;
}
function micon(name, extraClass = '') {
  return `<span class="material-symbols-rounded mat-icon ${extraClass}" aria-hidden="true">${name}</span>`;
}
