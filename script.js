/* ─────────────────────────────────────────────
 * ytkeyword — YouTube 키워드 분석
 * API 키는 사용자 브라우저 localStorage에만 저장
 * ───────────────────────────────────────────── */

const LS_KEY_API = 'ytkw:apiKey';
const LS_KEY_GEMINI = 'ytkw:geminiKey';
const LS_KEY_HISTORY = 'ytkw:history';
const LS_KEY_THEME = 'ytkw:theme';
const LS_KEY_VIEW = 'ytkw:viewMode';
const LS_KEY_SUMMARY = 'ytkw:summary:';
const LS_KEY_BLOCKED_VIDEOS = 'ytkw:blockedVideos';
const LS_KEY_BLOCKED_CHANNELS = 'ytkw:blockedChannels';
const GEMINI_MODEL = 'gemini-2.5-flash';

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
const cardGrid       = $('cardGrid');
const resultsControls = $('resultsControls');
const detailModal    = $('detailModal');
const summaryModal   = $('summaryModal');
const summaryMeta    = $('summaryMeta');
const summaryContent = $('summaryContent');
const summaryCopyBtn = $('summaryCopyBtn');
const summaryRegenBtn = $('summaryRegenBtn');
const geminiKeyInput = $('geminiKeyInput');
const bulkActions    = $('bulkActions');
const selectedCount  = $('selectedCount');
const blockListBtn   = $('blockListBtn');
const blockListCount = $('blockListCount');
const blockListModal = $('blockListModal');
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
let allResults = [];
let displayResults = [];
let hasSearched = false;
let currentSort = { key: 'performance', dir: 'desc' };
let filters = freshFilters();
let viewMode = localStorage.getItem(LS_KEY_VIEW) || 'table';
let activePreset = null;
let savedSortBeforePreset = null;
let savedSortOrderBeforePreset = null;
let currentDetail = null; // { result, recent, popular }
let currentSummaryVideo = null;
let selectedIds = new Set();
let blockedVideos = new Set(JSON.parse(localStorage.getItem(LS_KEY_BLOCKED_VIDEOS) || '[]'));
let blockedChannels = new Set(); // { id: name } 매핑은 별도
let blockedChannelMap = {};
try {
  const raw = JSON.parse(localStorage.getItem(LS_KEY_BLOCKED_CHANNELS) || '{}');
  blockedChannelMap = raw;
  Object.keys(raw).forEach(id => blockedChannels.add(id));
} catch {}

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
  applyViewModeButtonState();
  updateBlockListButton();
  if (!getApiKey()) {
    showToast('API 키를 먼저 등록하세요 (우상단 🔑)');
  }
}

function applyViewModeButtonState() {
  document.querySelectorAll('.view-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewMode);
  });
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

  // 프리셋 칩
  document.querySelectorAll('.preset-chip').forEach(b => {
    b.addEventListener('click', () => applyPreset(b.dataset.preset));
  });
  // 뷰 모드 토글
  document.querySelectorAll('.view-mode-btn').forEach(b => {
    b.addEventListener('click', () => setViewMode(b.dataset.view));
  });

  // 영상 클릭 → 디테일 모달
  [tableWrap, cardGrid].forEach(container => {
    container.addEventListener('click', handleResultClick);
  });

  // 요약 버튼
  tableWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.summary-btn[data-summary-id]');
    if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.summaryId;
    const r = allResults.find(x => x.videoId === id);
    if (r) openSummary(r);
  });
  summaryCopyBtn.addEventListener('click', copySummary);
  summaryRegenBtn.addEventListener('click', regenerateSummary);

  // 체크박스 (델리게이트)
  tableWrap.addEventListener('change', handleCheckboxChange);
  // bulk 액션
  $('blockVideosBtn').addEventListener('click', blockSelectedVideos);
  $('blockChannelsBtn').addEventListener('click', blockSelectedChannels);
  $('clearSelectionBtn').addEventListener('click', clearSelection);
  // 차단 목록 모달
  blockListBtn.addEventListener('click', openBlockListModal);
  $('clearAllBlocksBtn').addEventListener('click', clearAllBlocks);

  // 디테일 모달 탭 + 액션
  detailModal.querySelector('.detail-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.detail-tab');
    if (tab) switchDetailTab(tab.dataset.tab);
  });
  detailModal.querySelector('.action-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (btn) handleQuickAction(btn.dataset.action);
  });

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

/* ───────── 프리셋 칩 + 뷰 토글 ───────── */
function applyPreset(preset) {
  // Shorts 토글은 별도 처리 (필터 상태 토글)
  if (preset === 'shortsOnly' || preset === 'shortsRemove') {
    const wasActive = filters[preset];
    filters[preset] = !wasActive;
    if (filters.shortsOnly && filters.shortsRemove) {
      filters[preset === 'shortsOnly' ? 'shortsRemove' : 'shortsOnly'] = false;
    }
    refreshPresetChips();
    displayResults = applyFiltersToArray(allResults);
    sortResults();
    renderResults();
    return;
  }

  // 정렬 프리셋 (outliers / trending / latest)
  // 같은 칩 다시 누름 → 해제 + 이전 정렬로 복원
  if (activePreset === preset) {
    activePreset = null;
    if (savedSortBeforePreset) {
      currentSort = savedSortBeforePreset;
      savedSortBeforePreset = null;
    }
    if (savedSortOrderBeforePreset !== null) {
      sortOrderEl.value = savedSortOrderBeforePreset;
      savedSortOrderBeforePreset = null;
    }
    refreshPresetChips();
    sortResults();
    renderResults();
    return;
  }

  // 첫 활성화 시점에만 이전 상태 저장 (프리셋 간 전환 시 prev는 그대로 유지)
  if (!activePreset) {
    savedSortBeforePreset = { ...currentSort };
    savedSortOrderBeforePreset = sortOrderEl.value;
  }

  if (preset === 'outliers') {
    sortOrderEl.value = 'performance';
    currentSort = { key: 'performance', dir: 'desc' };
  } else if (preset === 'trending') {
    currentSort = { key: 'vph', dir: 'desc' };
  } else if (preset === 'latest') {
    sortOrderEl.value = 'date';
    currentSort = { key: 'publishedAt', dir: 'desc' };
  }
  activePreset = preset;
  refreshPresetChips();
  sortResults();
  renderResults();
}

function refreshPresetChips() {
  document.querySelectorAll('.preset-chip').forEach(b => {
    const p = b.dataset.preset;
    if (p === 'shortsOnly') b.classList.toggle('active', !!filters.shortsOnly);
    else if (p === 'shortsRemove') b.classList.toggle('active', !!filters.shortsRemove);
    else b.classList.toggle('active', activePreset === p);
  });
}

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem(LS_KEY_VIEW, mode);
  applyViewModeButtonState();
  if (displayResults.length) renderResults();
}

/* ───────── 영상 디테일 모달 ───────── */
function handleResultClick(e) {
  // 요약 버튼/체크박스 클릭은 무시
  if (e.target.closest('.summary-btn, input[type="checkbox"]')) return;
  const trigger = e.target.closest('[data-detail-id]');
  if (!trigger) return;
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  const id = trigger.dataset.detailId;
  const result = allResults.find(r => r.videoId === id);
  if (result) openVideoDetail(result);
}

function openVideoDetail(result) {
  currentDetail = { result, recent: null, popular: null };
  populateVideoTab(result);
  populateChannelTab(result);
  // 이전 영상의 인기 영상 그리드 잔존 리셋
  $('popularGrid').innerHTML = '<p class="loading-text">탭을 누르면 로딩됩니다 (API quota 100 units 사용)</p>';
  switchDetailTab('video');
  detailModal.classList.remove('hidden');
}

function populateVideoTab(r) {
  $('detailThumb').src = r.thumbnail;
  $('detailDuration').textContent = r.duration || '';
  $('detailTitle').textContent = r.title;
  $('detailMeta').textContent =
    `${fmtCompact(r.viewCount)} views · ${escapeText(r.channelTitle)} · ${fmtDate(r.publishedAt)} · ${r.days}일 전`;
  $('detailYouTubeBtn').href = `https://www.youtube.com/watch?v=${r.videoId}`;

  $('statOutlier').innerHTML  = r.performance != null
    ? multiplierBadge(r.performance)
    : '<span class="dash-text">-</span>';
  $('statViews').textContent  = fmtCompact(r.viewCount);
  $('statVph').textContent    = fmtVPH(r.vph);
  $('statLikes').textContent  = fmtCompact(r.likeCount);
  $('statContribution').textContent = r.contribution != null
    ? (r.contribution >= 10 ? Math.round(r.contribution) + 'x' : r.contribution.toFixed(1) + 'x')
    : '-';
  $('statEngagement').textContent = r.exposure != null
    ? r.exposure.toFixed(1) + '%'
    : '-';

  // 태그 + 설명
  const tagsHtml = (r.tags && r.tags.length)
    ? r.tags.slice(0, 20).map(t => `<span style="margin-right:6px">#${escapeHtml(t)}</span>`).join('')
    : '<span style="color:var(--gray-400)">태그 없음</span>';
  $('detailTags').innerHTML = tagsHtml;
  $('detailDescription').textContent = r.description || '설명 없음';
}

function populateChannelTab(r) {
  $('channelThumb').src = r.channelThumbnail || '';
  $('channelName').textContent = r.channelTitle;
  $('channelYouTubeLink').href = `https://www.youtube.com/channel/${r.channelId}`;
  $('chStat1').textContent = fmtCompact(r.subscriberCount);
  $('chStat2').textContent = fmtCompact(r.channelVideoCount);
  $('chStat3').textContent = r.channelDays != null ? r.channelDays.toLocaleString() + '일' : '-';
  $('chStat4').textContent = fmtCompact(r.channelViewCount);
  $('chStat5').textContent = r.channelVideoCount > 0
    ? fmtCompact(Math.round(r.channelViewCount / r.channelVideoCount))
    : '-';
  $('channelDescription').textContent = r.channelDescription || '소개 없음';
  // 최근 영상 영역은 탭 진입 시 lazy 로드
  $('channelRecentGrid').innerHTML = '<p class="loading-text">탭을 누르면 로딩됩니다</p>';
}

function switchDetailTab(tab) {
  document.querySelectorAll('.detail-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.detail-pane').forEach(p =>
    p.classList.toggle('hidden', p.dataset.pane !== tab));
  if (tab === 'channel' && currentDetail && !currentDetail.recent) {
    loadChannelRecent();
  } else if (tab === 'popular' && currentDetail && !currentDetail.popular) {
    loadChannelPopular();
  }
}

async function loadChannelRecent() {
  if (!currentDetail) return;
  const playlistId = currentDetail.result.uploadsPlaylistId;
  if (!playlistId) {
    $('channelRecentGrid').innerHTML = '<p class="empty-text">최근 영상 정보 없음</p>';
    return;
  }
  $('channelRecentGrid').innerHTML = '<p class="loading-text">로딩 중...</p>';
  try {
    const apiKey = getApiKey();
    const data = await ytFetch('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 12,
      key: apiKey,
    });
    const ids = (data.items || []).map(it => it.contentDetails.videoId).filter(Boolean);
    const stats = await fetchInBatches('videos',
      { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const items = (data.items || []).map(it => {
      const id = it.contentDetails.videoId;
      const s = statsMap[id] || {};
      return {
        videoId: id,
        title: decodeHtml(it.snippet.title),
        thumbnail: it.snippet.thumbnails?.medium?.url
          || it.snippet.thumbnails?.default?.url || '',
        viewCount: num(s.statistics?.viewCount),
        publishedAt: it.snippet.publishedAt,
        duration: formatDuration(parseDurationSec(s.contentDetails?.duration)),
      };
    });
    currentDetail.recent = items;
    renderMiniGrid('channelRecentGrid', items);
  } catch (err) {
    $('channelRecentGrid').innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadChannelPopular() {
  if (!currentDetail) return;
  const channelId = currentDetail.result.channelId;
  $('popularGrid').innerHTML = '<p class="loading-text">로딩 중... (API quota 100 units 사용)</p>';
  try {
    const apiKey = getApiKey();
    const search = await ytFetch('search', {
      part: 'snippet',
      type: 'video',
      channelId,
      order: 'viewCount',
      maxResults: 12,
      key: apiKey,
    });
    const videos = (search.items || []).filter(v => v.id?.videoId);
    const ids = videos.map(v => v.id.videoId);
    const stats = await fetchInBatches('videos',
      { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const items = videos.map(v => {
      const s = statsMap[v.id.videoId] || {};
      return {
        videoId: v.id.videoId,
        title: decodeHtml(v.snippet.title),
        thumbnail: v.snippet.thumbnails?.medium?.url
          || v.snippet.thumbnails?.default?.url || '',
        viewCount: num(s.statistics?.viewCount),
        publishedAt: v.snippet.publishedAt,
        duration: formatDuration(parseDurationSec(s.contentDetails?.duration)),
      };
    });
    currentDetail.popular = items;
    renderMiniGrid('popularGrid', items);
  } catch (err) {
    $('popularGrid').innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

function renderMiniGrid(elId, items) {
  if (!items.length) {
    $(elId).innerHTML = '<p class="empty-text">영상 없음</p>';
    return;
  }
  $(elId).innerHTML = items.map(it => `
    <a class="mini-card" href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener">
      <div class="mini-thumb">
        <img src="${it.thumbnail}" alt="" loading="lazy" />
        ${it.duration ? `<span class="duration-overlay">${it.duration}</span>` : ''}
      </div>
      <div class="mini-info">
        <h5>${escapeHtml(it.title)}</h5>
        <div class="mini-meta">${fmtCompact(it.viewCount)} views · ${fmtDate(it.publishedAt)}</div>
      </div>
    </a>
  `).join('');
}

function handleQuickAction(action) {
  if (!currentDetail) return;
  const r = currentDetail.result;
  switch (action) {
    case 'openYT':
      window.open(`https://www.youtube.com/watch?v=${r.videoId}`, '_blank', 'noopener');
      break;
    case 'similarTitles':
    case 'similarThumbs': {
      // 제목에서 해시태그/이모지 제거 → 핵심 단어 추출 → 새 검색
      const cleaned = String(r.title)
        .replace(/[#@][^\s]+/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const keyword = cleaned.split(' ').slice(0, 4).join(' ') || r.title;
      detailModal.classList.add('hidden');
      keywordInput.value = keyword;
      onSearch();
      break;
    }
    case 'copyTitle':
      navigator.clipboard.writeText(r.title);
      showToast('📋 제목 복사됨');
      break;
    case 'copyLink':
      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${r.videoId}`);
      showToast('🔗 링크 복사됨');
      break;
    case 'addCompetitor': {
      const key = 'ytkw:competitors';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (list.find(c => c.id === r.channelId)) {
        showToast('이미 저장된 채널입니다');
      } else {
        list.push({ id: r.channelId, name: r.channelTitle, savedAt: Date.now() });
        localStorage.setItem(key, JSON.stringify(list));
        showToast(`⭐ "${r.channelTitle}" 저장됨`);
      }
      break;
    }
  }
}

function escapeText(s) { return String(s ?? ''); }

/* ───────── Gemini 요약 ───────── */
function hasCachedSummary(videoId) {
  return !!localStorage.getItem(LS_KEY_SUMMARY + videoId);
}

function getCachedSummary(videoId) {
  try {
    const raw = localStorage.getItem(LS_KEY_SUMMARY + videoId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCachedSummary(videoId, text) {
  try {
    localStorage.setItem(LS_KEY_SUMMARY + videoId, JSON.stringify({
      text, generatedAt: Date.now()
    }));
  } catch (err) {
    console.warn('요약 저장 실패 (용량 초과 가능)', err);
  }
}

async function openSummary(result) {
  currentSummaryVideo = result;
  summaryMeta.innerHTML = `
    <div class="summary-title-text">${escapeHtml(result.title)}</div>
    <div class="summary-channel">${escapeHtml(result.channelTitle)} · ${fmtCompact(result.viewCount)} views · ${fmtDate(result.publishedAt)}</div>
  `;
  summaryModal.classList.remove('hidden');

  const cached = getCachedSummary(result.videoId);
  if (cached) {
    renderSummary(cached.text);
    return;
  }
  await generateSummary(result, false);
}

async function regenerateSummary() {
  if (!currentSummaryVideo) return;
  localStorage.removeItem(LS_KEY_SUMMARY + currentSummaryVideo.videoId);
  await generateSummary(currentSummaryVideo, true);
}

async function generateSummary(result, force) {
  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    summaryContent.innerHTML = `
      <div class="summary-error">
        <p>⚠️ Gemini API 키가 설정되지 않았습니다.</p>
        <p>우상단 "🔑 API 키" → Gemini API 키 입력 → 저장</p>
        <p class="hint-small">무료 발급: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a></p>
      </div>`;
    return;
  }

  summaryContent.innerHTML = `
    <div class="summary-loading">
      <div class="spinner"></div>
      <p>Gemini가 영상을 분석 중...</p>
      <p class="hint-small">영상 길이에 따라 10초~1분 정도 걸립니다</p>
    </div>
  `;

  const prompt = buildSummaryPrompt(result);
  const youtubeUrl = `https://www.youtube.com/watch?v=${result.videoId}`;

  try {
    // 1차: YouTube URL 직접 분석 (Gemini가 영상 자체를 봄)
    const text = await callGemini(geminiKey, prompt, youtubeUrl);
    saveCachedSummary(result.videoId, text);
    renderSummary(text);
    // 캐시 상태 반영 위해 테이블 재렌더
    if (viewMode === 'table' && displayResults.length) renderTable();
  } catch (err) {
    console.error(err);
    // 2차: 영상 분석 실패 → 텍스트만으로 요약 시도
    try {
      const fallbackPrompt = buildFallbackPrompt(result);
      const text = await callGemini(geminiKey, fallbackPrompt, null);
      saveCachedSummary(result.videoId, '⚠️ 영상 본체 분석 실패 → 제목/설명 기반 요약\n\n' + text);
      renderSummary(text);
      if (viewMode === 'table' && displayResults.length) renderTable();
    } catch (err2) {
      summaryContent.innerHTML = `
        <div class="summary-error">
          <p>요약 실패: ${escapeHtml(err2.message || err.message)}</p>
        </div>`;
    }
  }
}

function buildSummaryPrompt(r) {
  return [
    `다음 YouTube 영상을 한국어로 분석해주세요.`,
    ``,
    `[영상 정보]`,
    `제목: ${r.title}`,
    `채널: ${r.channelTitle} (구독자 ${fmtCompact(r.subscriberCount)})`,
    `조회수: ${fmtCompact(r.viewCount)} · 게시 ${r.days}일 전 · ${r.duration || ''}`,
    ``,
    `[요청 형식]`,
    `한줄 요약: (영상 한 줄 핵심)`,
    ``,
    `핵심 내용:`,
    `- (불릿 4-6개, 영상에서 다룬 주요 내용)`,
    ``,
    `왜 잘됐나/왜 안됐나:`,
    `(이 영상의 조회수 패턴에 대한 1-2문장 분석)`,
    ``,
    `톤: (정보형/감성적/코믹/리뷰/튜토리얼 등 한 단어)`,
    ``,
    `마크다운 없이, 순수 텍스트로 작성. 200-400자.`,
  ].join('\n');
}

function buildFallbackPrompt(r) {
  return [
    `다음 YouTube 영상을 한국어로 요약해주세요. 영상 본체는 볼 수 없고, 제목과 설명만 보고 추측해주세요.`,
    ``,
    `제목: ${r.title}`,
    `채널: ${r.channelTitle}`,
    `설명: ${(r.description || '').slice(0, 1500)}`,
    `태그: ${(r.tags || []).slice(0, 20).join(', ')}`,
    ``,
    `[요청]`,
    `- 한줄 요약 (제목/설명 기반)`,
    `- 다룰 것으로 추정되는 핵심 내용 3-5개 불릿`,
    `- 영상 톤/스타일 추정`,
    ``,
    `마크다운 없이 순수 텍스트로.`,
  ].join('\n');
}

async function callGemini(apiKey, prompt, youtubeUrl) {
  const parts = [{ text: prompt }];
  if (youtubeUrl) {
    parts.push({ fileData: { fileUri: youtubeUrl } });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n').trim();
  if (!text) throw new Error('빈 응답');
  return text;
}

function renderSummary(text) {
  // 마크다운-라이트: 줄별 처리, '- '로 시작은 리스트, 'X:' 패턴은 섹션 헤더로
  const lines = text.split('\n');
  const out = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }
    const t = line.trim();
    if (/^[-•*]\s/.test(t)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${escapeHtml(t.replace(/^[-•*]\s/, ''))}</li>`);
      continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    // "한줄 요약:" 같은 섹션 헤더 감지
    const m = t.match(/^(한줄 요약|핵심 내용|왜 잘됐나|왜 안됐나|왜 잘됐나\/왜 안됐나|톤|시청자 반응|영상 톤|영상 스타일)\s*[:：]\s*(.*)/);
    if (m) {
      out.push(`<div class="summary-section">${escapeHtml(m[1])}</div>`);
      if (m[2]) out.push(`<p>${escapeHtml(m[2])}</p>`);
      continue;
    }
    out.push(`<p>${escapeHtml(t)}</p>`);
  }
  if (inList) out.push('</ul>');
  summaryContent.innerHTML = out.join('');
}

function copySummary() {
  const text = summaryContent.innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  showToast('📋 요약 복사됨');
}

/* ───────── 다중 선택 + 차단 ───────── */
function handleCheckboxChange(e) {
  const cb = e.target;
  if (cb.type !== 'checkbox') return;
  if (cb.id === 'selectAll') {
    const all = resultsBody.querySelectorAll('input[type="checkbox"][data-id]');
    all.forEach(c => {
      c.checked = cb.checked;
      if (cb.checked) selectedIds.add(c.dataset.id);
      else selectedIds.delete(c.dataset.id);
    });
  } else if (cb.dataset.id) {
    if (cb.checked) selectedIds.add(cb.dataset.id);
    else selectedIds.delete(cb.dataset.id);
    // selectAll 동기화
    const sa = $('selectAll');
    if (sa) {
      const all = resultsBody.querySelectorAll('input[type="checkbox"][data-id]');
      sa.checked = all.length > 0 && [...all].every(c => c.checked);
    }
  }
  updateBulkActions();
}

function updateBulkActions() {
  const n = selectedIds.size;
  if (n > 0) {
    bulkActions.classList.remove('hidden');
    selectedCount.textContent = n;
  } else {
    bulkActions.classList.add('hidden');
  }
}

function clearSelection() {
  selectedIds.clear();
  resultsBody.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  syncSelectAll();
  updateBulkActions();
}

function syncSelectAll() {
  const sa = $('selectAll');
  if (!sa) return;
  const all = resultsBody.querySelectorAll('input[type="checkbox"][data-id]');
  if (all.length === 0) {
    sa.checked = false;
    sa.indeterminate = false;
    return;
  }
  const checkedCount = [...all].filter(c => c.checked).length;
  if (checkedCount === 0) {
    sa.checked = false;
    sa.indeterminate = false;
  } else if (checkedCount === all.length) {
    sa.checked = true;
    sa.indeterminate = false;
  } else {
    sa.checked = false;
    sa.indeterminate = true;
  }
}

function blockSelectedVideos() {
  if (!selectedIds.size) return;
  const ids = [...selectedIds];
  ids.forEach(id => blockedVideos.add(id));
  persistBlocks();
  selectedIds.clear();
  // 현재 결과에서 제거
  allResults = allResults.filter(r => !blockedVideos.has(r.videoId));
  displayResults = applyFiltersToArray(allResults);
  sortResults();
  renderResults();
  updateBulkActions();
  updateBlockListButton();
  showToast(`🗑 ${ids.length}개 영상 차단 — 다음 검색에서도 안 보입니다`);
}

function blockSelectedChannels() {
  if (!selectedIds.size) return;
  const channels = new Map();
  [...selectedIds].forEach(id => {
    const r = allResults.find(x => x.videoId === id);
    if (r) channels.set(r.channelId, r.channelTitle);
  });
  if (!channels.size) return;
  channels.forEach((name, id) => {
    blockedChannels.add(id);
    blockedChannelMap[id] = name;
  });
  persistBlocks();
  selectedIds.clear();
  allResults = allResults.filter(r => !blockedChannels.has(r.channelId));
  displayResults = applyFiltersToArray(allResults);
  sortResults();
  renderResults();
  updateBulkActions();
  updateBlockListButton();
  showToast(`🚫 ${channels.size}개 채널 차단 (해당 채널의 모든 영상 숨김)`);
}

function persistBlocks() {
  localStorage.setItem(LS_KEY_BLOCKED_VIDEOS, JSON.stringify([...blockedVideos]));
  localStorage.setItem(LS_KEY_BLOCKED_CHANNELS, JSON.stringify(blockedChannelMap));
}

function updateBlockListButton() {
  const total = blockedVideos.size + blockedChannels.size;
  if (total > 0) {
    blockListBtn.hidden = false;
    blockListCount.textContent = total;
  } else {
    blockListBtn.hidden = true;
  }
}

function openBlockListModal() {
  $('blockedVideoCount').textContent = blockedVideos.size;
  $('blockedChannelCount').textContent = blockedChannels.size;
  // 차단된 채널 목록 (이름 있으니까)
  const listEl = $('blockedChannelList');
  if (blockedChannels.size === 0) {
    listEl.innerHTML = '';
  } else {
    listEl.innerHTML = [...blockedChannels].map(id => {
      const name = blockedChannelMap[id] || id;
      return `
        <div class="blocked-item" data-channel-id="${escapeHtml(id)}">
          <span class="blocked-label">🚫 ${escapeHtml(name)}</span>
          <button class="unblock-btn" data-unblock="${escapeHtml(id)}">해제</button>
        </div>
      `;
    }).join('');
    // unblock 핸들러
    listEl.querySelectorAll('.unblock-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.unblock;
        blockedChannels.delete(id);
        delete blockedChannelMap[id];
        persistBlocks();
        updateBlockListButton();
        openBlockListModal();
      });
    });
  }
  blockListModal.classList.remove('hidden');
}

function clearAllBlocks() {
  if (!confirm('차단된 영상과 채널을 모두 해제하시겠습니까?')) return;
  blockedVideos.clear();
  blockedChannels.clear();
  blockedChannelMap = {};
  persistBlocks();
  updateBlockListButton();
  blockListModal.classList.add('hidden');
  showToast('✅ 모든 차단 해제됨');
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
function getGeminiKey() { return localStorage.getItem(LS_KEY_GEMINI) || ''; }

function openApiKeyModal() {
  apiKeyInput.value = getApiKey();
  geminiKeyInput.value = getGeminiKey();
  apiKeyModal.classList.remove('hidden');
  setTimeout(() => apiKeyInput.focus(), 50);
}

function saveApiKey() {
  const yt = apiKeyInput.value.trim();
  const gem = geminiKeyInput.value.trim();
  let saved = [];
  if (yt) { localStorage.setItem(LS_KEY_API, yt); saved.push('YouTube'); }
  if (gem) { localStorage.setItem(LS_KEY_GEMINI, gem); saved.push('Gemini'); }
  apiKeyModal.classList.add('hidden');
  if (saved.length) showToast(`✅ ${saved.join(' + ')} 키 저장`);
  else showToast('변경 사항 없음');
}

function clearApiKey() {
  localStorage.removeItem(LS_KEY_API);
  localStorage.removeItem(LS_KEY_GEMINI);
  apiKeyInput.value = '';
  geminiKeyInput.value = '';
  showToast('🗑️ 모든 API 키 삭제됨');
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

  hasSearched = true;
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
      fetchInBatches('videos', { part: 'statistics,contentDetails,snippet' }, videoIds, apiKey),
      fetchInBatches('channels', { part: 'statistics,snippet,contentDetails' }, channelIds, apiKey),
    ]);

    const detailMap = mapBy(videoStats, 'id');
    const channelMap = mapBy(channelStats, 'id');

    allResults = videos.filter(v => {
      // 차단된 영상/채널 제외
      const vid = v.id?.videoId;
      const cid = v.snippet?.channelId;
      if (vid && blockedVideos.has(vid)) return false;
      if (cid && blockedChannels.has(cid)) return false;
      return true;
    }).map(v => {
      const d = detailMap[v.id.videoId] || {};
      const c = channelMap[v.snippet.channelId] || {};
      const subs = num(c.statistics?.subscriberCount);
      const views = num(d.statistics?.viewCount);
      const likes = num(d.statistics?.likeCount);
      const comments = num(d.statistics?.commentCount);
      const channelViews = num(c.statistics?.viewCount);
      const channelVideoCount = num(c.statistics?.videoCount);
      const days = daysSince(v.snippet.publishedAt);
      const hours = Math.max(1, (Date.now() - new Date(v.snippet.publishedAt).getTime()) / 3600000);
      const vph = views / hours;

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
        title: decodeHtml(v.snippet.title),
        channelTitle: decodeHtml(v.snippet.channelTitle),
        channelId: v.snippet.channelId,
        publishedAt: v.snippet.publishedAt,
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '',
        description: decodeHtml(d.snippet?.description || v.snippet?.description || ''),
        tags: (d.snippet?.tags || []).map(decodeHtml),
        channelThumbnail: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url || '',
        channelDescription: decodeHtml(c.snippet?.description || ''),
        channelPublishedAt: c.snippet?.publishedAt || '',
        channelDays: c.snippet?.publishedAt ? daysSince(c.snippet.publishedAt) : null,
        uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads || '',
        subscriberCount: subs,
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        channelViewCount: channelViews,
        channelVideoCount,
        days,
        hours,
        vph,
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
  displayResults.sort((a, b) => {
    let av, bv;
    if (key === 'contribution') { av = a.contribution ?? -Infinity; bv = b.contribution ?? -Infinity; }
    else if (key === 'performance') { av = a.performance ?? -Infinity; bv = b.performance ?? -Infinity; }
    else if (key === 'exposure') { av = a.exposure ?? -Infinity; bv = b.exposure ?? -Infinity; }
    else if (key === 'vph') { av = a.vph ?? -Infinity; bv = b.vph ?? -Infinity; }
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
  if (thumbCount) thumbCount.textContent = `(${displayResults.length})`;

  if (!displayResults.length) {
    tableWrap.hidden = true;
    cardGrid.hidden = true;
    resultsControls.hidden = true;
    bulkActions.classList.add('hidden');
    emptyState.hidden = false;
    const p = emptyState.querySelector('p');
    if (!hasSearched) {
      p.textContent = '검색어를 입력하고 검색 버튼을 클릭하세요.';
    } else if (allResults.length > 0) {
      p.textContent = '필터 조건에 맞는 결과가 없습니다. 필터를 조정해보세요.';
    } else {
      p.textContent = '검색 결과가 없습니다. 다른 키워드를 시도하거나 검색 옵션을 바꿔보세요.';
    }
    return;
  }
  emptyState.hidden = true;
  resultsControls.hidden = false;

  if (viewMode === 'cards') {
    tableWrap.hidden = true;
    cardGrid.hidden = false;
    renderCards();
  } else {
    cardGrid.hidden = true;
    tableWrap.hidden = false;
    renderTable();
  }
}

function renderTable() {
  resultsBody.innerHTML = displayResults.map((r) => `
    <tr data-detail-id="${r.videoId}">
      <td class="cb"><input type="checkbox" data-id="${r.videoId}" ${selectedIds.has(r.videoId) ? 'checked' : ''} /></td>
      <td>
        <div class="thumb-cell" data-detail-id="${r.videoId}">
          <img src="${r.thumbnail}" alt="" loading="lazy" />
          ${r.duration ? `<span class="thumb-duration">${r.duration}</span>` : ''}
        </div>
      </td>
      <td>
        <a class="title-cell" href="https://www.youtube.com/watch?v=${r.videoId}" target="_blank" rel="noopener" data-detail-id="${r.videoId}">${escapeHtml(r.title)}</a>
      </td>
      <td style="text-align:center">
        <button class="summary-btn ${hasCachedSummary(r.videoId) ? 'has-cache' : ''}" data-summary-id="${r.videoId}" type="button" title="${hasCachedSummary(r.videoId) ? '저장된 요약 보기' : 'Gemini로 영상 요약'}">
          ✨ ${hasCachedSummary(r.videoId) ? '요약' : '요약'}
        </button>
      </td>
      <td class="num-cell">${fmt(r.viewCount)}</td>
      <td class="num-cell">${fmtVPH(r.vph)}</td>
      <td class="channel-cell">
        ${fmt(r.subscriberCount)}
        <span class="channel-name" title="${escapeHtml(r.channelTitle)}">${escapeHtml(r.channelTitle)}</span>
      </td>
      <td>${multBadgeCell(r.contribution, r.contributionTier, 'x')}</td>
      <td>${multBadgeCell(r.performance, r.performanceTier, 'x')}</td>
      <td>${multBadgeCell(r.exposure, r.exposureTier, '%')}</td>
      <td class="num-cell">${fmt(r.channelVideoCount)}</td>
      <td class="num-cell">${fmtDate(r.publishedAt)}</td>
    </tr>
  `).join('');
  syncSelectAll();
}

function renderCards() {
  cardGrid.innerHTML = displayResults.map((r) => `
    <article class="result-card">
      <a class="card-thumb" href="https://www.youtube.com/watch?v=${r.videoId}" target="_blank" rel="noopener" data-detail-id="${r.videoId}">
        <img src="${r.thumbnail}" alt="" loading="lazy" />
        ${multiplierBadge(r.performance)}
        <span class="vph-pill">${fmtVPH(r.vph)}</span>
        ${r.duration ? `<span class="duration-overlay">${r.duration}</span>` : ''}
      </a>
      <div class="card-info">
        <h3 class="card-title">${escapeHtml(r.title)}</h3>
        <div class="card-channel" title="${escapeHtml(r.channelTitle)}">${escapeHtml(r.channelTitle)} · 구독자 ${fmtCompact(r.subscriberCount)}</div>
        <div class="card-meta">${fmtCompact(r.viewCount)} views · ${fmtDate(r.publishedAt)}</div>
      </div>
    </article>
  `).join('');
}

function multTier(val) {
  if (val === null || val === undefined || isNaN(val)) return 'minimal';
  if (val >= 100) return 'extreme';
  if (val >= 10) return 'high';
  if (val >= 3) return 'mid';
  if (val >= 1) return 'low';
  return 'minimal';
}

function multiplierBadge(val) {
  if (val === null || val === undefined || isNaN(val)) return '';
  const tier = multTier(val);
  const label = val >= 100 ? '>100x' : (val >= 10 ? Math.round(val) + 'x' : val.toFixed(1) + 'x');
  return `<span class="mult-badge mult-${tier}">${label}</span>`;
}

function multBadgeCell(val, tier, suffix) {
  if (val === null || val === undefined || isNaN(val)) return `<span class="dash-text">-</span>`;
  let label;
  if (suffix === 'x') {
    label = val >= 100 ? '>100x' : (val >= 10 ? Math.round(val) + 'x' : val.toFixed(1) + 'x');
  } else if (suffix === '%') {
    label = val.toFixed(1) + '%';
  } else {
    label = String(val);
  }
  const t = tier || multTier(val);
  return `<span class="mult-badge mult-inline mult-${t}">${label}</span>`;
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
  refreshPresetChips();
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
  const headers = ['순위','제목','채널명','구독자','채널 총 영상수','채널 총 조회수','조회수','VPH','좋아요','댓글','성과 배수','최신 성과도','기여도(배)','노출확률(%)','경과일','재생시간','게시일','영상 링크','채널 링크'];
  const rows = displayResults.map((r, i) => [
    i + 1,
    r.title,
    r.channelTitle,
    r.subscriberCount,
    r.channelVideoCount,
    r.channelViewCount,
    r.viewCount,
    r.vph?.toFixed(2) ?? '',
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
function fmtVPH(v) {
  if (v === null || v === undefined || isNaN(v)) return '-';
  if (v < 1) return v.toFixed(2) + ' VPH';
  if (v < 10) return v.toFixed(1) + ' VPH';
  if (v < 1000) return Math.round(v) + ' VPH';
  if (v < 1e6) return (v/1000).toFixed(1) + 'k VPH';
  return (v/1e6).toFixed(1) + 'M VPH';
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

// YouTube API가 제목 등에 보내는 HTML 엔티티(&#39;, &amp;, &quot;)를 실제 문자로 복원
const _decodeEl = document.createElement('textarea');
function decodeHtml(s) {
  if (s === null || s === undefined) return s;
  _decodeEl.innerHTML = String(s);
  return _decodeEl.value;
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
