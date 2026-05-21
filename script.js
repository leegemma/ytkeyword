/* ─────────────────────────────────────────────
 * ytkeyword — YouTube 키워드 분석
 * API 키는 사용자 브라우저 localStorage에만 저장
 * ───────────────────────────────────────────── */

const LS_KEY_API = 'ytkw:apiKey';
const LS_KEY_HISTORY = 'ytkw:history';
const LS_KEY_THEME = 'ytkw:theme';

const $ = (id) => document.getElementById(id);

/* DOM refs */
const keywordInput   = $('keywordInput');
const searchBtn      = $('searchBtn');
const historyChips   = $('historyChips');
const filterBtn      = $('filterBtn');
const exportCsvBtn   = $('exportCsvBtn');
const apiKeyBtn      = $('apiKeyBtn');
const themeToggleBtn = $('themeToggleBtn');
const apiKeyModal    = $('apiKeyModal');
const apiKeyInput    = $('apiKeyInput');
const apiKeySaveBtn  = $('apiKeySaveBtn');
const apiKeyClearBtn = $('apiKeyClearBtn');
const filterModal    = $('filterModal');
const filterApplyBtn = $('filterApplyBtn');
const filterResetBtn = $('filterResetBtn');
const filterResultCount = $('filterResultCount');
const resultsBody    = $('resultsBody');
const emptyState     = $('emptyState');
const tableWrap      = $('tableWrap');
const resultCountEl  = $('resultCount');
const thumbCount     = $('thumbCount');
const progressBar    = $('progressBar');
const toastEl        = $('toast');

const maxResultsEl   = $('maxResults');
const sortOrderEl    = $('sortOrder');
const videoDurationEl = $('videoDuration');
const periodEl       = $('period');
const regionEl       = $('region');

/* State */
let allResults = [];      // 검색 후 받은 전체 결과
let displayResults = []; // 필터 적용된 표시용
let currentSort = { key: 'performance', dir: 'desc' };
let filters = freshFilters();

function freshFilters() {
  return {
    viewMin: null, viewMax: null,
    subMin: null, subMax: null,
    likeMin: null, likeMax: null,
    dateMin: null, dateMax: null,
    contribution: new Set(),
    performance: new Set(),
    exposure: new Set(),
    shortsOnly: false,
    shortsRemove: false,
  };
}

/* ───────── 초기화 ───────── */
function init() {
  bindEvents();
  if (!getApiKey()) {
    showToast('API 키를 먼저 등록하세요 (우상단 🔑)');
  }
}

function bindEvents() {
  searchBtn.addEventListener('click', onSearch);
  keywordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSearch(); });

  apiKeyBtn.addEventListener('click', openApiKeyModal);
  themeToggleBtn.addEventListener('click', toggleTheme);

  // 사용자가 OS 테마를 바꾸면 (저장된 선택 없을 때만) 자동 반영
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(LS_KEY_THEME)) {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });
  apiKeySaveBtn.addEventListener('click', saveApiKey);
  apiKeyClearBtn.addEventListener('click', clearApiKey);

  filterBtn.addEventListener('click', openFilterModal);
  filterApplyBtn.addEventListener('click', applyFilters);
  filterResetBtn.addEventListener('click', resetFilters);

  exportCsvBtn.addEventListener('click', exportCsv);

  // Modal close
  document.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => {
      el.closest('.modal').classList.add('hidden');
    });
  });

  // Sort columns
  document.querySelectorAll('th.sortable').forEach((th) => {
    th.addEventListener('click', () => onSort(th.dataset.sort));
  });

  // Tier filter buttons (toggle)
  document.querySelectorAll('.tier-buttons').forEach((wrap) => {
    const key = wrap.dataset.filter;
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const tier = btn.dataset.tier;
      btn.classList.toggle('active');
      if (filters[key].has(tier)) filters[key].delete(tier);
      else filters[key].add(tier);
      updateFilterPreviewCount();
    });
  });

  // Toggle buttons (Shorts)
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      filters[key] = !filters[key];
      btn.classList.toggle('active');
      // 상호 배타
      if (key === 'shortsOnly' && filters[key]) {
        filters.shortsRemove = false;
        document.querySelector('[data-toggle="shortsRemove"]').classList.remove('active');
      }
      if (key === 'shortsRemove' && filters[key]) {
        filters.shortsOnly = false;
        document.querySelector('[data-toggle="shortsOnly"]').classList.remove('active');
      }
      updateFilterPreviewCount();
    });
  });

  // Quick period buttons
  document.querySelectorAll('.quick-period button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-period button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.dataset.days, 10);
      if (days) {
        const now = new Date();
        const since = new Date(Date.now() - days * 86400000);
        filters.dateMin = since.toISOString().slice(0, 10);
        filters.dateMax = now.toISOString().slice(0, 10);
        $('dateMin').value = filters.dateMin;
        $('dateMax').value = filters.dateMax;
      } else {
        filters.dateMin = null;
        filters.dateMax = null;
        $('dateMin').value = '';
        $('dateMax').value = '';
      }
      updateFilterPreviewCount();
    });
  });

  // Range inputs (live update)
  ['viewMin','viewMax','subMin','subMax','likeMin','likeMax','dateMin','dateMax'].forEach(id => {
    $(id).addEventListener('input', () => {
      const v = $(id).value;
      filters[id] = v === '' ? null : (id.startsWith('date') ? v : Number(v));
      updateFilterPreviewCount();
    });
  });
}

/* ───────── 테마 ───────── */
function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(LS_KEY_THEME, next);
  showToast(next === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드');
}

/* ───────── API 키 모달 ───────── */
function getApiKey() { return localStorage.getItem(LS_KEY_API) || ''; }

function openApiKeyModal() {
  apiKeyInput.value = getApiKey();
  apiKeyModal.classList.remove('hidden');
  setTimeout(() => apiKeyInput.focus(), 50);
}

function saveApiKey() {
  const v = apiKeyInput.value.trim();
  if (!v) { showToast('빈 값입니다'); return; }
  localStorage.setItem(LS_KEY_API, v);
  apiKeyModal.classList.add('hidden');
  showToast('✅ API 키 저장 완료');
}

function clearApiKey() {
  localStorage.removeItem(LS_KEY_API);
  apiKeyInput.value = '';
  showToast('🗑️ API 키 삭제됨');
}

/* ───────── 검색 ───────── */
async function onSearch() {
  const q = keywordInput.value.trim();
  if (!q) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    showToast('먼저 API 키를 등록하세요');
    openApiKeyModal();
    return;
  }

  progressBar.classList.add('active');
  emptyState.hidden = true;
  tableWrap.hidden = true;

  try {
    const params = buildSearchParams(q);
    const search = await ytFetch('search', { ...params, key: apiKey });
    const videos = (search.items || []).filter(v => v.id && v.id.videoId);
    if (!videos.length) {
      allResults = [];
      displayResults = [];
      renderResults();
      showToast('결과 없음');
      progressBar.classList.remove('active');
      return;
    }
    const videoIds = videos.map(v => v.id.videoId);
    const channelIds = [...new Set(videos.map(v => v.snippet.channelId))];

    const [videoStats, channelStats] = await Promise.all([
      fetchInBatches('videos', { part: 'statistics,contentDetails' }, videoIds, apiKey),
      fetchInBatches('channels', { part: 'statistics' }, channelIds, apiKey),
    ]);

    const detailMap = mapBy(videoStats, 'id');
    const channelMap = mapBy(channelStats, 'id');

    allResults = videos.map(v => {
      const d = detailMap[v.id.videoId] || {};
      const c = channelMap[v.snippet.channelId] || {};
      const subs = num(c.statistics?.subscriberCount);
      const views = num(d.statistics?.viewCount);
      const likes = num(d.statistics?.likeCount);
      const comments = num(d.statistics?.commentCount);
      const channelViews = num(c.statistics?.viewCount);
      const channelVideoCount = num(c.statistics?.videoCount);
      const days = daysSince(v.snippet.publishedAt);

      const performance = subs > 0 ? views / subs : null;
      const recentPerformance = performance !== null && days > 0 ? performance / days : null;
      const avgVideoViews = channelVideoCount > 0 ? channelViews / channelVideoCount : null;
      const contribution = avgVideoViews > 0 ? views / avgVideoViews : null;
      const exposure = views > 0 ? (likes + comments) / views * 100 : null;

      const duration = d.contentDetails?.duration || '';
      const durationSec = parseDurationSec(duration);
      const isShorts = durationSec > 0 && durationSec <= 60;

      return {
        videoId: v.id.videoId,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        channelId: v.snippet.channelId,
        publishedAt: v.snippet.publishedAt,
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '',
        subscriberCount: subs,
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        channelViewCount: channelViews,
        channelVideoCount,
        days,
        performance,
        recentPerformance,
        contribution,
        exposure,
        duration: formatDuration(durationSec),
        durationSec,
        isShorts,
        performanceTier: rateTier(performance, [0.3, 1, 3, 10]),
        contributionTier: rateTier(contribution, [0.3, 1, 3, 10]),
        exposureTier: rateTier(exposure, [0.5, 1.5, 4, 8]),
      };
    });

    // 검색 기록 저장
    pushHistory(q);

    // 정렬 + 표시
    displayResults = [...allResults];
    sortResults();
    renderResults();
    showToast(`✅ ${allResults.length}개 영상 검색됨`);
  } catch (err) {
    console.error(err);
    showToast(`오류: ${err.message}`);
  } finally {
    progressBar.classList.remove('active');
  }
}

function buildSearchParams(q) {
  const p = {
    part: 'snippet',
    type: 'video',
    maxResults: maxResultsEl.value,
    q,
  };
  const sort = sortOrderEl.value;
  if (sort === 'relevance') p.order = 'relevance';
  else if (sort === 'date') p.order = 'date';
  else if (sort === 'viewCount') p.order = 'viewCount';
  // 'performance'/'recent'은 받아온 뒤 자체 정렬

  const dur = videoDurationEl.value;
  if (dur && dur !== 'any') p.videoDuration = dur;

  const days = parseInt(periodEl.value, 10);
  if (days) p.publishedAfter = new Date(Date.now() - days * 86400000).toISOString();

  const region = regionEl.value;
  if (region) p.regionCode = region;

  return p;
}

async function fetchInBatches(endpoint, baseParams, ids, apiKey) {
  if (!ids.length) return [];
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await ytFetch(endpoint, { ...baseParams, id: batch.join(','), key: apiKey });
    out.push(...(data.items || []));
  }
  return out;
}

async function ytFetch(endpoint, params) {
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?` +
    Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('일일 API quota 초과. 내일 다시 시도하거나 새 키를 사용하세요.');
    }
    throw new Error(msg);
  }
  return data;
}

/* ───────── 정렬 ───────── */
function onSort(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === 'desc' ? 'asc' : 'desc';
  } else {
    currentSort.key = key;
    currentSort.dir = 'desc';
  }
  sortResults();
  renderResults();
}

function sortResults() {
  const { key, dir } = currentSort;
  const tierOrder = { worst: 0, bad: 1, normal: 2, good: 3, great: 4, null: -1, undefined: -1 };
  displayResults.sort((a, b) => {
    let av, bv;
    if (key === 'contribution') { av = a.contribution ?? -Infinity; bv = b.contribution ?? -Infinity; }
    else if (key === 'performance') { av = a.performance ?? -Infinity; bv = b.performance ?? -Infinity; }
    else if (key === 'exposure') { av = a.exposure ?? -Infinity; bv = b.exposure ?? -Infinity; }
    else if (key === 'publishedAt') { av = new Date(a.publishedAt).getTime(); bv = new Date(b.publishedAt).getTime(); }
    else { av = a[key] ?? -Infinity; bv = b[key] ?? -Infinity; }
    return dir === 'desc' ? bv - av : av - bv;
  });
  // 헤더 표시
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === key) th.classList.add(`sort-${dir}`);
  });
}

/* ───────── 렌더링 ───────── */
function renderResults() {
  resultCountEl.textContent = `${displayResults.length}개`;
  thumbCount.textContent = `(${displayResults.length})`;
  if (!displayResults.length) {
    tableWrap.hidden = true;
    emptyState.hidden = false;
    if (allResults.length) {
      emptyState.querySelector('p').textContent = '필터 조건에 맞는 결과가 없습니다.';
    }
    return;
  }
  emptyState.hidden = true;
  tableWrap.hidden = false;

  resultsBody.innerHTML = displayResults.map((r) => `
    <tr>
      <td class="cb"><input type="checkbox" data-id="${r.videoId}" /></td>
      <td>
        <div class="thumb-cell">
          <img src="${r.thumbnail}" alt="" loading="lazy" />
          ${r.duration ? `<span class="thumb-duration">${r.duration}</span>` : ''}
        </div>
      </td>
      <td>
        <a class="title-cell" href="https://www.youtube.com/watch?v=${r.videoId}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
      </td>
      <td class="num-cell">${fmt(r.viewCount)}</td>
      <td class="channel-cell">
        ${fmt(r.subscriberCount)}
        <span class="channel-name" title="${escapeHtml(r.channelTitle)}">${escapeHtml(r.channelTitle)}</span>
      </td>
      <td>${tierBadge(r.contributionTier)}</td>
      <td>${tierBadge(r.performanceTier)}</td>
      <td>${tierBadge(r.exposureTier)}</td>
      <td class="num-cell">${fmt(r.channelVideoCount)}</td>
      <td class="num-cell">${fmtDate(r.publishedAt)}</td>
    </tr>
  `).join('');
}

function tierBadge(tier) {
  if (!tier) return `<span class="dash-text">-</span>`;
  const labels = { worst: 'Worst', bad: 'Bad', normal: 'Normal', good: 'Good', great: 'Great' };
  return `<span class="tier ${tier} tier-text">${labels[tier]}</span>`;
}

/* ───────── 필터 ───────── */
function openFilterModal() {
  if (!allResults.length) {
    showToast('먼저 검색을 실행하세요');
    return;
  }
  // 통계 채우기
  $('viewStats').textContent  = statsLine(allResults.map(r => r.viewCount), '합계', '평균값', '중앙값');
  $('subStats').textContent   = statsLine(allResults.map(r => r.subscriberCount));
  $('likeStats').textContent  = statsLine(allResults.map(r => r.likeCount));
  // 티어별 카운트
  updateTierCounts();
  updateFilterPreviewCount();
  filterModal.classList.remove('hidden');
}

function statsLine(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  const avg = arr.length ? Math.round(sum / arr.length) : 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  return `합계: ${fmtCompact(sum)} | 평균값: ${fmtCompact(avg)} | 중앙값: ${fmtCompact(median)}`;
}

function updateTierCounts() {
  const tiers = ['worst','bad','normal','good','great'];
  const fields = [
    ['contributionTier','cnt-cont-'],
    ['performanceTier','cnt-perf-'],
    ['exposureTier','cnt-exp-'],
  ];
  for (const [field, prefix] of fields) {
    for (const t of tiers) {
      const c = allResults.filter(r => r[field] === t).length;
      const el = document.getElementById(prefix + t);
      if (el) el.textContent = `(${c})`;
    }
  }
}

function updateFilterPreviewCount() {
  filterResultCount.textContent = applyFiltersToArray(allResults).length;
}

function applyFiltersToArray(arr) {
  return arr.filter(r => {
    if (filters.viewMin !== null && r.viewCount < filters.viewMin) return false;
    if (filters.viewMax !== null && r.viewCount > filters.viewMax) return false;
    if (filters.subMin !== null && r.subscriberCount < filters.subMin) return false;
    if (filters.subMax !== null && r.subscriberCount > filters.subMax) return false;
    if (filters.likeMin !== null && r.likeCount < filters.likeMin) return false;
    if (filters.likeMax !== null && r.likeCount > filters.likeMax) return false;
    if (filters.dateMin) { if (new Date(r.publishedAt) < new Date(filters.dateMin)) return false; }
    if (filters.dateMax) { if (new Date(r.publishedAt) > new Date(filters.dateMax + 'T23:59:59')) return false; }
    if (filters.contribution.size && !filters.contribution.has(r.contributionTier)) return false;
    if (filters.performance.size && !filters.performance.has(r.performanceTier)) return false;
    if (filters.exposure.size && !filters.exposure.has(r.exposureTier)) return false;
    if (filters.shortsOnly && !r.isShorts) return false;
    if (filters.shortsRemove && r.isShorts) return false;
    return true;
  });
}

function applyFilters() {
  displayResults = applyFiltersToArray(allResults);
  sortResults();
  renderResults();
  filterModal.classList.add('hidden');
}

function resetFilters() {
  filters = freshFilters();
  document.querySelectorAll('.tier-buttons button.active').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.toggle-buttons button.active').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.quick-period button').forEach(b => b.classList.remove('active'));
  document.querySelector('.quick-period button[data-days=""]')?.classList.add('active');
  ['viewMin','viewMax','subMin','subMax','likeMin','likeMax','dateMin','dateMax'].forEach(id => { $(id).value = ''; });
  updateFilterPreviewCount();
}

/* ───────── 검색 기록 ───────── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY_HISTORY) || '[]'); } catch { return []; }
}
function pushHistory(q) {
  const h = getHistory().filter(x => x !== q);
  h.unshift(q);
  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(h.slice(0, 5)));
  renderHistory();
}
function renderHistory() {
  const h = getHistory();
  historyChips.innerHTML = h.map(q => `
    <span class="chip">
      ${escapeHtml(q)}
      <span class="chip-x" data-q="${escapeHtml(q)}">×</span>
    </span>
  `).join('');
  historyChips.querySelectorAll('.chip-x').forEach(x => {
    x.addEventListener('click', () => {
      const q = x.dataset.q;
      const h2 = getHistory().filter(v => v !== q);
      localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(h2));
      renderHistory();
    });
  });
  historyChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-x')) return;
      const q = chip.querySelector('.chip-x').dataset.q;
      keywordInput.value = q;
      onSearch();
    });
  });
}

/* ───────── CSV 내보내기 ───────── */
function exportCsv() {
  if (!displayResults.length) { showToast('내보낼 결과가 없습니다'); return; }
  const headers = ['순위','제목','채널명','구독자','채널 총 영상수','채널 총 조회수','조회수','좋아요','댓글','성과 배수','최신 성과도','기여도(배)','노출확률(%)','경과일','재생시간','게시일','영상 링크','채널 링크'];
  const rows = displayResults.map((r, i) => [
    i + 1,
    r.title,
    r.channelTitle,
    r.subscriberCount,
    r.channelVideoCount,
    r.channelViewCount,
    r.viewCount,
    r.likeCount,
    r.commentCount,
    r.performance?.toFixed(2) ?? '',
    r.recentPerformance?.toFixed(4) ?? '',
    r.contribution?.toFixed(2) ?? '',
    r.exposure?.toFixed(2) ?? '',
    r.days,
    r.duration,
    new Date(r.publishedAt).toISOString().slice(0, 19).replace('T',' '),
    `https://www.youtube.com/watch?v=${r.videoId}`,
    `https://www.youtube.com/channel/${r.channelId}`,
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ytkeyword-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('💾 CSV 저장됨');
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* ───────── 유틸 ───────── */
function num(x) { return Number(x || 0); }
function fmt(n) { return n.toLocaleString('ko-KR'); }
function fmtCompact(n) {
  if (n >= 1e8) return (n/1e8).toFixed(1) + '억';
  if (n >= 1e4) return (n/1e4).toFixed(1) + '만';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return String(n);
}
function fmtDate(iso) {
  const d = new Date(iso);
  const y = String(d.getFullYear()).slice(2);
  return `${y}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function daysSince(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}
function parseDurationSec(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
}
function formatDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function rateTier(val, thresholds) {
  // thresholds = [worstMax, badMax, normalMax, goodMax]; great = above goodMax
  if (val === null || val === undefined || isNaN(val)) return null;
  if (val < thresholds[0]) return 'worst';
  if (val < thresholds[1]) return 'bad';
  if (val < thresholds[2]) return 'normal';
  if (val < thresholds[3]) return 'good';
  return 'great';
}
function mapBy(arr, key) {
  const m = {};
  arr.forEach(it => m[it[key]] = it);
  return m;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 200);
  }, 2400);
}

/* ───────── 시작 ───────── */
init();
renderHistory();
