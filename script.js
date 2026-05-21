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
const LS_KEY_FEATURES = 'ytkw:features';
const LS_KEY_SAVED_VIDEOS = 'ytkw:savedVideos';

const DEFAULT_FEATURES = { summary: false };
const LS_KEY_REGION = 'ytkw:region';
const LS_KEY_MODE = 'ytkw:mode';

const REGIONS = [
  { code: 'KR', flag: '🇰🇷', label: '한국' },
  { code: 'US', flag: '🇺🇸', label: '미국' },
  { code: 'JP', flag: '🇯🇵', label: '일본' },
  { code: 'GB', flag: '🇬🇧', label: '영국' },
  { code: 'CN', flag: '🇨🇳', label: '중국' },
  { code: 'TW', flag: '🇹🇼', label: '대만' },
  { code: 'HK', flag: '🇭🇰', label: '홍콩' },
  { code: 'VN', flag: '🇻🇳', label: '베트남' },
  { code: 'TH', flag: '🇹🇭', label: '태국' },
  { code: 'ID', flag: '🇮🇩', label: '인도네시아' },
  { code: 'PH', flag: '🇵🇭', label: '필리핀' },
  { code: 'IN', flag: '🇮🇳', label: '인도' },
  { code: 'FR', flag: '🇫🇷', label: '프랑스' },
  { code: 'DE', flag: '🇩🇪', label: '독일' },
  { code: 'IT', flag: '🇮🇹', label: '이탈리아' },
  { code: 'ES', flag: '🇪🇸', label: '스페인' },
  { code: 'RU', flag: '🇷🇺', label: '러시아' },
  { code: 'BR', flag: '🇧🇷', label: '브라질' },
  { code: 'MX', flag: '🇲🇽', label: '멕시코' },
  { code: 'CA', flag: '🇨🇦', label: '캐나다' },
  { code: 'AU', flag: '🇦🇺', label: '호주' },
  { code: 'TR', flag: '🇹🇷', label: '튀르키예' },
  { code: 'SA', flag: '🇸🇦', label: '사우디아라비아' },
  { code: '',   flag: '🌐', label: '전체 (지역 무관)' },
];
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
const featureBtn     = $('featureBtn');
const featureModal   = $('featureModal');
const savedListBtn   = $('savedListBtn');
const savedListCount = $('savedListCount');
const savedListModal = $('savedListModal');
const historyBtn     = $('historyBtn');
const historyBtnCount = $('historyBtnCount');
const historyModal   = $('historyModal');
const historyFilter  = $('historyFilter');
const regionFlagBtn  = $('regionFlagBtn');
const regionPopover  = $('regionPopover');
const modeTabs       = $('modeTabs');
const channelsWrap   = $('channelsWrap');
const channelsBody   = $('channelsBody');
const channelDetailModal = $('channelDetailModal');

let currentChannelDetail = null; // { channel, latest, popular: { videos, shorts } }
let currentTop10SubTab = 'videos';

let currentRegion = localStorage.getItem(LS_KEY_REGION);
if (currentRegion === null) currentRegion = 'KR'; // 기본
if (!REGIONS.find(r => r.code === currentRegion)) currentRegion = 'KR';

let searchMode = localStorage.getItem(LS_KEY_MODE) || 'video'; // 'video' | 'channel'
let allChannels = [];
let displayChannels = [];
let currentChannelSort = { key: 'growthSpeed', dir: 'desc' };
const resultCountEl  = $('resultCount');
const thumbCount     = $('thumbCount');
const progressBar    = $('progressBar');
const toastEl        = $('toast');

const maxResultsEl   = $('maxResults');
const sortOrderEl    = $('sortOrder');
const videoDurationEl = $('videoDuration');
const periodEl       = $('period');

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

let features = { ...DEFAULT_FEATURES };
try {
  Object.assign(features, JSON.parse(localStorage.getItem(LS_KEY_FEATURES) || '{}'));
} catch {}

let savedVideos = []; // [{ videoId, title, channelTitle, channelId, thumbnail, duration, viewCount, publishedAt, savedAt }]
let savedVideoIds = new Set();
try {
  savedVideos = JSON.parse(localStorage.getItem(LS_KEY_SAVED_VIDEOS) || '[]');
  savedVideos.forEach(v => savedVideoIds.add(v.videoId));
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
  applyFeatureFlags();
  applyRegionFlag();
  applySearchMode();
  updateBlockListButton();
  updateSavedListButton();
  if (!getApiKey()) {
    showToast('API 키를 먼저 등록하세요 (우상단 🔑)');
  }
}

function applySearchMode() {
  document.body.classList.toggle('mode-channel', searchMode === 'channel');
  modeTabs.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === searchMode);
  });
  if (searchMode === 'channel') {
    keywordInput.placeholder = '채널 관련 키워드 입력';
  } else {
    keywordInput.placeholder = '단어 또는 문장 입력';
  }
}

function setSearchMode(mode) {
  if (mode === searchMode) return;
  searchMode = mode;
  localStorage.setItem(LS_KEY_MODE, mode);
  applySearchMode();
  renderHistory(); // 모드별 history 칩 갱신
  // 결과 영역 초기화
  tableWrap.hidden = true;
  cardGrid.hidden = true;
  channelsWrap.hidden = true;
  resultsControls.hidden = true;
  bulkActions.classList.add('hidden');
  emptyState.hidden = false;
  emptyState.querySelector('p').textContent = mode === 'channel'
    ? '키워드로 채널을 검색하세요. 예) minimalism, 영어회화'
    : '검색어를 입력하고 검색 버튼을 클릭하세요.';
  hasSearched = false;
  resultCountEl.textContent = '0개';
}

function applyRegionFlag() {
  const r = REGIONS.find(x => x.code === currentRegion) || REGIONS[0];
  regionFlagBtn.textContent = r.flag;
  regionFlagBtn.title = `검색 국가: ${r.label}`;
}

function applyFeatureFlags() {
  Object.entries(features).forEach(([key, enabled]) => {
    document.body.classList.toggle(`feat-${key}`, !!enabled);
  });
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

  // 실험 기능 모달
  featureBtn.addEventListener('click', openFeatureModal);
  featureModal.querySelectorAll('input[type="checkbox"][data-feature-key]').forEach(cb => {
    cb.addEventListener('change', () => {
      setFeature(cb.dataset.featureKey, cb.checked);
    });
  });

  // 저장한 영상
  savedListBtn.addEventListener('click', openSavedListModal);
  $('clearAllSavedBtn').addEventListener('click', clearAllSaved);

  // 검색 기록
  historyBtn.addEventListener('click', openHistoryModal);
  historyFilter.addEventListener('input', renderHistoryModal);
  $('clearAllHistoryBtn').addEventListener('click', clearAllHistory);

  // 설정 변경 시 자동 재검색
  [maxResultsEl, videoDurationEl, periodEl].forEach(el => {
    el.addEventListener('change', triggerSettingsResearch);
  });
  // 정렬 기준: 클라이언트 정렬은 재검색 안 함, 서버 정렬은 재검색
  sortOrderEl.addEventListener('change', handleSortOrderChange);

  // 모드 탭 (영상 / 채널)
  modeTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.mode-tab');
    if (tab) setSearchMode(tab.dataset.mode);
  });

  // 채널 컬럼 정렬
  channelsWrap.addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable[data-csort]');
    if (!th) return;
    const key = th.dataset.csort;
    if (currentChannelSort.key === key) {
      currentChannelSort.dir = currentChannelSort.dir === 'desc' ? 'asc' : 'desc';
    } else {
      currentChannelSort.key = key;
      currentChannelSort.dir = 'desc';
    }
    sortChannels();
    renderChannelsTable();
  });

  // 채널명 클릭 → 채널 디테일 모달
  channelsWrap.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-channel-detail]');
    if (!trigger) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    const channel = allChannels.find(c => c.channelId === trigger.dataset.channelDetail);
    if (channel) openChannelDetail(channel);
  });

  // 채널 디테일 모달 탭 + top10 sub-tab
  channelDetailModal.querySelector('.detail-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.detail-tab');
    if (tab) switchChannelDetailTab(tab.dataset.ctab);
  });
  channelDetailModal.addEventListener('click', (e) => {
    const sub = e.target.closest('.top10-tab');
    if (sub) {
      currentTop10SubTab = sub.dataset.top10;
      channelDetailModal.querySelectorAll('.top10-tab').forEach(t =>
        t.classList.toggle('active', t === sub));
      renderTopGrid();
    }
  });

  // 국가 선택기 (플래그)
  regionFlagBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRegionPopover();
  });
  regionPopover.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-region]');
    if (!btn) return;
    setRegion(btn.dataset.region);
  });
  // 바깥 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!regionPopover.hidden && !e.target.closest('.region-picker')) {
      regionPopover.hidden = true;
    }
  });
  // ESC로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !regionPopover.hidden) regionPopover.hidden = true;
  });
  // 저장 버튼 (테이블 + 카드 + mini-grid)
  [tableWrap, cardGrid].forEach(c => {
    c.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-save-id]');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      toggleSave(btn.dataset.saveId);
    });
  });

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
  // 액션 버튼/체크박스 클릭은 무시
  if (e.target.closest('.summary-btn, .save-btn, .card-save-btn, input[type="checkbox"]')) return;
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

/* ───────── 실험 기능 ───────── */
function openFeatureModal() {
  featureModal.querySelectorAll('input[type="checkbox"][data-feature-key]').forEach(cb => {
    cb.checked = !!features[cb.dataset.featureKey];
  });
  featureModal.classList.remove('hidden');
}

function setFeature(key, enabled) {
  features[key] = !!enabled;
  localStorage.setItem(LS_KEY_FEATURES, JSON.stringify(features));
  applyFeatureFlags();
  showToast(`${enabled ? '✅' : '⛔'} ${key} 기능 ${enabled ? '켬' : '끔'}`);
}

/* ───────── 저장한 영상 ───────── */
function persistSaved() {
  localStorage.setItem(LS_KEY_SAVED_VIDEOS, JSON.stringify(savedVideos));
}

function updateSavedListButton() {
  if (savedVideoIds.size > 0) {
    savedListBtn.hidden = false;
    savedListCount.textContent = savedVideoIds.size;
  } else {
    savedListBtn.hidden = true;
  }
}

function toggleSave(videoId) {
  // 결과 목록에서 찾거나 savedVideos에서 찾기
  const fromResults = allResults.find(r => r.videoId === videoId);
  if (savedVideoIds.has(videoId)) {
    // 저장 해제
    savedVideoIds.delete(videoId);
    savedVideos = savedVideos.filter(v => v.videoId !== videoId);
    persistSaved();
    updateSavedListButton();
    // 표시 갱신
    updateSaveButtons(videoId, false);
    showToast('⭐ 저장 해제됨');
    // 만약 저장 목록 모달이 열려있으면 다시 그려줌
    if (!savedListModal.classList.contains('hidden')) renderSavedList();
  } else {
    // 저장
    if (!fromResults) {
      showToast('저장할 영상 정보를 찾을 수 없습니다');
      return;
    }
    const entry = {
      videoId: fromResults.videoId,
      title: fromResults.title,
      channelTitle: fromResults.channelTitle,
      channelId: fromResults.channelId,
      thumbnail: fromResults.thumbnail,
      duration: fromResults.duration,
      viewCount: fromResults.viewCount,
      publishedAt: fromResults.publishedAt,
      savedAt: Date.now(),
    };
    savedVideos.unshift(entry);
    savedVideoIds.add(videoId);
    persistSaved();
    updateSavedListButton();
    updateSaveButtons(videoId, true);
    showToast('⭐ 저장됨 — 우상단에서 다시 볼 수 있어요');
  }
}

function updateSaveButtons(videoId, isSaved) {
  // 테이블 셀의 save-btn
  document.querySelectorAll(`.save-btn[data-save-id="${CSS.escape(videoId)}"]`).forEach(b => {
    b.classList.toggle('saved', isSaved);
    b.textContent = isSaved ? '★' : '☆';
    b.title = isSaved ? '저장 해제' : '저장';
  });
  // 카드의 card-save-btn
  document.querySelectorAll(`.card-save-btn[data-save-id="${CSS.escape(videoId)}"]`).forEach(b => {
    b.classList.toggle('saved', isSaved);
    b.textContent = isSaved ? '★' : '☆';
    b.title = isSaved ? '저장 해제' : '저장';
  });
  // 카드 썸네일의 saved-badge
  if (viewMode === 'cards') {
    const card = document.querySelector(`.card-thumb[data-detail-id="${CSS.escape(videoId)}"]`);
    if (card) {
      const existing = card.querySelector('.saved-badge');
      if (isSaved && !existing) {
        const span = document.createElement('span');
        span.className = 'saved-badge';
        span.textContent = '⭐ 저장됨';
        card.appendChild(span);
      } else if (!isSaved && existing) {
        existing.remove();
      }
    }
  }
}

function openSavedListModal() {
  renderSavedList();
  savedListModal.classList.remove('hidden');
}

function renderSavedList() {
  const grid = $('savedListGrid');
  $('savedListHint').textContent = savedVideos.length
    ? `저장한 영상 ${savedVideos.length}개 — 카드 클릭 시 YouTube로 이동, 별 표시로 저장 해제`
    : '아직 저장한 영상이 없습니다. 검색 결과의 ☆ 버튼을 눌러 저장하세요.';
  if (!savedVideos.length) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = savedVideos.map(v => `
    <div class="mini-card" style="position:relative">
      <a class="mini-thumb" href="https://www.youtube.com/watch?v=${v.videoId}" target="_blank" rel="noopener" style="display:block">
        <img src="${v.thumbnail}" alt="" loading="lazy" />
        ${v.duration ? `<span class="duration-overlay">${v.duration}</span>` : ''}
      </a>
      <div class="mini-info">
        <h5>${escapeHtml(v.title)}</h5>
        <div class="mini-meta">${escapeHtml(v.channelTitle)} · ${fmtCompact(v.viewCount || 0)} views</div>
      </div>
      <button class="card-save-btn saved" data-saved-remove="${escapeHtml(v.videoId)}" type="button" title="저장 해제" style="top:6px; right:6px">★</button>
    </div>
  `).join('');
  // unsave 핸들러
  grid.querySelectorAll('[data-saved-remove]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSave(b.dataset.savedRemove);
    });
  });
}

function clearAllSaved() {
  if (!confirm(`저장한 영상 ${savedVideos.length}개를 모두 삭제하시겠습니까?`)) return;
  const ids = savedVideos.map(v => v.videoId);
  savedVideos = [];
  savedVideoIds.clear();
  persistSaved();
  updateSavedListButton();
  ids.forEach(id => updateSaveButtons(id, false));
  savedListModal.classList.add('hidden');
  showToast('🗑 저장 목록 비움');
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

  if (searchMode === 'channel') {
    return onSearchChannels(q, apiKey);
  }

  hasSearched = true;
  progressBar.classList.add('active');
  emptyState.hidden = true;
  tableWrap.hidden = true;
  channelsWrap.hidden = true;

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
      // Shorts 판단: 3분 이하 (2024년 YouTube가 Shorts 최대 길이를 3분으로 변경)
      const isShorts = durationSec > 0 && durationSec <= 180;

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
    showError(`영상 검색 중 오류가 발생했습니다.\n\n${err.message}`, err.stack);
  } finally {
    progressBar.classList.remove('active');
  }
}

/* ───────── 채널 검색 ───────── */
async function onSearchChannels(q, apiKey) {
  hasSearched = true;
  progressBar.classList.add('active');
  emptyState.hidden = true;
  tableWrap.hidden = true;
  cardGrid.hidden = true;
  channelsWrap.hidden = true;

  try {
    const search = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      maxResults: maxResultsEl.value,
      q,
      ...(currentRegion ? { regionCode: currentRegion } : {}),
      key: apiKey,
    });
    const ids = (search.items || [])
      .map(it => it.snippet?.channelId || it.id?.channelId)
      .filter(Boolean);
    if (!ids.length) {
      allChannels = [];
      displayChannels = [];
      renderChannelResults();
      showToast('채널 결과 없음');
      return;
    }

    const details = await fetchInBatches('channels',
      { part: 'snippet,statistics,contentDetails' }, ids, apiKey);

    allChannels = details.filter(c => {
      // 차단된 채널 제외
      return !blockedChannels.has(c.id);
    }).map(c => {
      const subs   = num(c.statistics?.subscriberCount);
      const views  = num(c.statistics?.viewCount);
      const videoCount = num(c.statistics?.videoCount);
      const publishedAt = c.snippet?.publishedAt || '';
      const days = publishedAt ? Math.max(1, daysSince(publishedAt)) : 1;
      const avgViewPerVideo = videoCount > 0 ? views / videoCount : 0;

      const viewToSubRatio = views > 0 ? (subs / views) * 100 : null; // %
      const dailySubGrowth = days > 0 ? subs / days : null; // 명/일
      const videoPerformance = subs > 0 ? avgViewPerVideo / subs : null; // 배수
      const growthSpeed = days > 0 ? views / days : null; // 일평균 조회수

      return {
        channelId: c.id,
        name: decodeHtml(c.snippet?.title || ''),
        description: decodeHtml(c.snippet?.description || ''),
        thumbnail: c.snippet?.thumbnails?.medium?.url
          || c.snippet?.thumbnails?.default?.url || '',
        country: c.snippet?.country || '',
        customUrl: c.snippet?.customUrl || '',
        publishedAt,
        days,
        subscribers: subs,
        totalViews: views,
        videoCount,
        avgViewPerVideo,
        viewToSubRatio,
        viewToSubTier: rateTier(viewToSubRatio, [0.5, 1, 3, 6]),
        dailySubGrowth,
        dailySubTier: rateTier(dailySubGrowth, [1, 10, 100, 1000]),
        videoPerformance,
        videoPerfTier: rateTier(videoPerformance, [0.05, 0.2, 0.5, 1.5]),
        growthSpeed,
        growthTier: rateTier(growthSpeed, [100, 1000, 10000, 100000]),
      };
    });

    pushHistory(q);
    displayChannels = [...allChannels];
    sortChannels();
    renderChannelResults();
    showToast(`✅ ${allChannels.length}개 채널 검색됨`);
  } catch (err) {
    console.error(err);
    showError(`채널 검색 중 오류가 발생했습니다.\n\n${err.message}`, err.stack);
  } finally {
    progressBar.classList.remove('active');
  }
}

function sortChannels() {
  const { key, dir } = currentChannelSort;
  displayChannels.sort((a, b) => {
    let av, bv;
    if (key === 'publishedAt') {
      av = new Date(a.publishedAt).getTime();
      bv = new Date(b.publishedAt).getTime();
    } else {
      av = a[key] ?? -Infinity;
      bv = b[key] ?? -Infinity;
    }
    return dir === 'desc' ? bv - av : av - bv;
  });
  // 헤더 표시
  channelsWrap.querySelectorAll('th.sortable[data-csort]').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.csort === key) th.classList.add(`sort-${dir}`);
  });
}

function renderChannelResults() {
  resultCountEl.textContent = `${displayChannels.length}개`;
  if (!displayChannels.length) {
    channelsWrap.hidden = true;
    emptyState.hidden = false;
    const p = emptyState.querySelector('p');
    p.textContent = '채널 검색 결과가 없습니다. 키워드를 바꿔보세요.';
    return;
  }
  emptyState.hidden = true;
  channelsWrap.hidden = false;
  renderChannelsTable();
}

function renderChannelsTable() {
  const r2 = REGIONS.find(r => r.code === currentRegion);
  channelsBody.innerHTML = displayChannels.map(c => {
    // 국가 플래그 표시
    const country = c.country || '';
    const countryRegion = REGIONS.find(r => r.code === country);
    const flagEmoji = countryRegion ? countryRegion.flag : '';
    return `
      <tr>
        <td class="cb"><input type="checkbox" data-channel-id="${escapeHtml(c.channelId)}" /></td>
        <td class="channel-avatar-cell">
          <div class="channel-avatar-wrap">
            <img class="channel-avatar" src="${c.thumbnail}" alt="" loading="lazy" />
            ${flagEmoji ? `<span class="channel-country-flag" title="${escapeHtml(country)}">${flagEmoji}</span>` : ''}
          </div>
        </td>
        <td>
          <a class="channel-name" href="https://www.youtube.com/channel/${escapeHtml(c.channelId)}" target="_blank" rel="noopener" data-channel-detail="${escapeHtml(c.channelId)}" title="클릭하면 채널 상세 (Cmd+클릭은 YouTube)">${escapeHtml(c.name)}</a>
        </td>
        <td>${fmtDate(c.publishedAt)}</td>
        <td class="num-cell">${fmtCompact(c.subscribers)}</td>
        <td>${tierWithValue(c.viewToSubRatio, c.viewToSubTier, '%')}</td>
        <td>${tierWithValue(c.dailySubGrowth, c.dailySubTier, '명')}</td>
        <td>${tierWithValue(c.videoPerformance, c.videoPerfTier, 'x')}</td>
        <td>${tierWithValue(c.growthSpeed, c.growthTier, 'v/일')}</td>
        <td class="num-cell">${fmtCompact(c.totalViews)}</td>
        <td class="num-cell">${fmtCompact(c.videoCount)}</td>
      </tr>
    `;
  }).join('');
}

function tierWithValue(val, tier, suffix) {
  if (val === null || val === undefined || isNaN(val)) return '<span class="dash-text">-</span>';
  let label;
  if (suffix === '%') {
    label = val < 0.1 ? val.toFixed(2) + '%' : val.toFixed(1) + '%';
  } else if (suffix === 'x') {
    label = val >= 100 ? '>100x' : (val >= 10 ? Math.round(val) + 'x' : val.toFixed(2) + 'x');
  } else if (suffix === '명') {
    label = fmtCompact(Math.round(val)) + '/일';
  } else if (suffix === 'v/일') {
    label = fmtCompact(Math.round(val)) + '/일';
  } else {
    label = String(val);
  }
  const t = tier || 'minimal';
  return `<span class="mult-badge mult-inline mult-${t}">${label}</span>`;
}

/* ───────── 채널 디테일 모달 ───────── */
async function openChannelDetail(channel) {
  // 채널 정보 탭에 필요한 추가 데이터 (description, customUrl 등은 이미 있음)
  // 평균 좋아요는 영상 통계에서 계산 필요 → 디테일 모달에서 한 번 더 fetch
  currentChannelDetail = { channel, latest: null, popular: { videos: null, shorts: null }, avgLikes: null };
  populateChannelInfoTab(channel);
  // 평균 좋아요는 가벼우니 백그라운드로 로드
  loadAvgLikes();
  switchChannelDetailTab('info');
  channelDetailModal.classList.remove('hidden');
}

function populateChannelInfoTab(c) {
  $('cdThumb').src = c.thumbnail || '';
  $('cdName').textContent = c.name;
  $('cdYTLink').href = `https://www.youtube.com/channel/${c.channelId}`;

  // 국가
  const countryRegion = REGIONS.find(r => r.code === c.country);
  if (countryRegion) {
    $('cdCountryChip').innerHTML = `<span style="font-size:14px">${countryRegion.flag}</span> ${escapeHtml(countryRegion.label)}`;
    $('cdCountryChip').hidden = false;
  } else if (c.country) {
    $('cdCountryChip').innerHTML = `🌐 ${escapeHtml(c.country)}`;
    $('cdCountryChip').hidden = false;
  } else {
    $('cdCountryChip').hidden = true;
  }

  // 통계 카드
  $('cdSubs').textContent = fmtCompact(c.subscribers);
  $('cdVideoCount').textContent = fmtCompact(c.videoCount);
  $('cdDays').textContent = c.days.toLocaleString() + '일';
  $('cdTotalViews').textContent = fmtCompact(c.totalViews);
  $('cdAvgViews').textContent = c.videoCount > 0
    ? fmtCompact(Math.round(c.totalViews / c.videoCount)) : '-';
  $('cdAvgLikes').textContent = '계산 중...';

  // 4 지표 (배지로)
  $('cdViewToSub').innerHTML = tierWithValue(c.viewToSubRatio, c.viewToSubTier, '%');
  $('cdDailySub').innerHTML  = tierWithValue(c.dailySubGrowth, c.dailySubTier, '명');
  $('cdVideoPerf').innerHTML = tierWithValue(c.videoPerformance, c.videoPerfTier, 'x');
  $('cdGrowthSpeed').innerHTML = tierWithValue(c.growthSpeed, c.growthTier, 'v/일');

  $('cdDescription').textContent = c.description || '소개 없음';
  $('cdTags').textContent = '-'; // channels API 의 brandingSettings.channel.keywords 가 필요한데 제한적
}

function switchChannelDetailTab(tab) {
  channelDetailModal.querySelectorAll('.detail-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.ctab === tab));
  channelDetailModal.querySelectorAll('.detail-pane').forEach(p =>
    p.classList.toggle('hidden', p.dataset.cpane !== tab));
  if (tab === 'latest' && currentChannelDetail && !currentChannelDetail.latest) {
    loadChannelLatest();
  } else if (tab === 'top' && currentChannelDetail
    && !currentChannelDetail.popular.videos
    && !currentChannelDetail.popular.shorts) {
    loadChannelTop();
  }
}

async function loadAvgLikes() {
  if (!currentChannelDetail) return;
  try {
    const apiKey = getApiKey();
    if (!apiKey) return;
    const playlistId = await getUploadsPlaylistId(currentChannelDetail.channel.channelId, apiKey);
    if (!playlistId) return;
    // 최근 영상 10개의 좋아요 평균
    const data = await ytFetch('playlistItems', {
      part: 'contentDetails',
      playlistId,
      maxResults: 10,
      key: apiKey,
    });
    const ids = (data.items || []).map(it => it.contentDetails.videoId).filter(Boolean);
    if (!ids.length) { $('cdAvgLikes').textContent = '-'; return; }
    const stats = await fetchInBatches('videos', { part: 'statistics' }, ids, apiKey);
    const likes = stats.map(s => num(s.statistics?.likeCount));
    const avg = likes.length ? Math.round(likes.reduce((a, b) => a + b, 0) / likes.length) : 0;
    currentChannelDetail.avgLikes = avg;
    $('cdAvgLikes').textContent = fmtCompact(avg);
  } catch (err) {
    console.warn('평균 좋아요 계산 실패:', err);
    $('cdAvgLikes').textContent = '-';
  }
}

async function getUploadsPlaylistId(channelId, apiKey) {
  // 캐시 단순화 — channels.list 한 번 더 호출. 1 unit.
  const data = await ytFetch('channels', {
    part: 'contentDetails',
    id: channelId,
    key: apiKey,
  });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function loadChannelLatest() {
  if (!currentChannelDetail) return;
  const grid = $('cdLatestGrid');
  grid.innerHTML = '<p class="loading-text">로딩 중...</p>';
  try {
    const apiKey = getApiKey();
    if (!apiKey) { grid.innerHTML = '<p class="empty-text">API 키 필요</p>'; return; }
    const playlistId = await getUploadsPlaylistId(currentChannelDetail.channel.channelId, apiKey);
    if (!playlistId) {
      grid.innerHTML = '<p class="empty-text">최근 영상을 불러올 수 없음</p>';
      return;
    }
    const data = await ytFetch('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 10,
      key: apiKey,
    });
    const ids = (data.items || []).map(it => it.contentDetails.videoId).filter(Boolean);
    const stats = await fetchInBatches('videos',
      { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const items = (data.items || []).map(it => {
      const id = it.contentDetails.videoId;
      const s = statsMap[id] || {};
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      return {
        videoId: id,
        title: decodeHtml(it.snippet.title),
        thumbnail: it.snippet.thumbnails?.medium?.url
          || it.snippet.thumbnails?.default?.url || '',
        viewCount: num(s.statistics?.viewCount),
        likeCount: num(s.statistics?.likeCount),
        commentCount: num(s.statistics?.commentCount),
        publishedAt: it.snippet.publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
      };
    });
    currentChannelDetail.latest = items;
    renderChannelMiniGrid(grid, items);
  } catch (err) {
    grid.innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadChannelTop() {
  if (!currentChannelDetail) return;
  const grid = $('cdTopGrid');
  grid.innerHTML = '<p class="loading-text">로딩 중... (API quota 약 100 units)</p>';
  try {
    const apiKey = getApiKey();
    if (!apiKey) { grid.innerHTML = '<p class="empty-text">API 키 필요</p>'; return; }
    const search = await ytFetch('search', {
      part: 'snippet',
      type: 'video',
      channelId: currentChannelDetail.channel.channelId,
      order: 'viewCount',
      maxResults: 50,
      key: apiKey,
    });
    const videos = (search.items || []).filter(v => v.id?.videoId);
    const ids = videos.map(v => v.id.videoId);
    const stats = await fetchInBatches('videos',
      { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const items = videos.map(v => {
      const s = statsMap[v.id.videoId] || {};
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      const views = num(s.statistics?.viewCount);
      const channelAvg = currentChannelDetail.channel.avgViewPerVideo || 1;
      const contribution = channelAvg > 0 ? views / channelAvg : null;
      const subs = currentChannelDetail.channel.subscribers || 1;
      const performance = subs > 0 ? views / subs : null;
      return {
        videoId: v.id.videoId,
        title: decodeHtml(v.snippet.title),
        thumbnail: v.snippet.thumbnails?.medium?.url
          || v.snippet.thumbnails?.default?.url || '',
        viewCount: views,
        publishedAt: v.snippet.publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
        contribution,
        contributionTier: rateTier(contribution, [0.3, 1, 3, 10]),
        performance,
        performanceTier: rateTier(performance, [0.3, 1, 3, 10]),
      };
    });
    currentChannelDetail.popular.videos = items.filter(it => !it.isShorts).slice(0, 10);
    currentChannelDetail.popular.shorts = items.filter(it => it.isShorts).slice(0, 10);
    renderTopGrid();
  } catch (err) {
    grid.innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

function renderTopGrid() {
  if (!currentChannelDetail) return;
  const grid = $('cdTopGrid');
  const items = currentTop10SubTab === 'shorts'
    ? currentChannelDetail.popular.shorts
    : currentChannelDetail.popular.videos;
  if (!items) {
    grid.innerHTML = '<p class="loading-text">로딩 중...</p>';
    return;
  }
  if (!items.length) {
    grid.innerHTML = `<p class="empty-text">${currentTop10SubTab === 'shorts' ? 'Shorts' : '동영상'} 결과 없음</p>`;
    return;
  }
  grid.className = 'top10-grid';
  grid.innerHTML = items.map(it => `
    <a class="top10-item" href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener" style="text-decoration:none; color:inherit">
      <div class="top10-thumb">
        <img src="${it.thumbnail}" alt="" loading="lazy" />
        ${it.duration ? `<span class="duration-overlay">${it.duration}</span>` : ''}
      </div>
      <div class="top10-info">
        <h5>${escapeHtml(it.title)}</h5>
        <div class="top10-info-meta">${fmtCompact(it.viewCount)} views · ${fmtDate(it.publishedAt)}</div>
      </div>
      <div class="top10-stat">
        <div class="top10-stat-label">기여도</div>
        ${tierWithValue(it.contribution, it.contributionTier, 'x')}
      </div>
      <div class="top10-stat">
        <div class="top10-stat-label">성과도</div>
        ${tierWithValue(it.performance, it.performanceTier, 'x')}
      </div>
      <div class="top10-stat">
        <div class="top10-stat-label">조회수</div>
        <strong>${fmtCompact(it.viewCount)}</strong>
      </div>
    </a>
  `).join('');
}

function renderChannelMiniGrid(grid, items) {
  if (!items.length) {
    grid.innerHTML = '<p class="empty-text">영상 없음</p>';
    return;
  }
  grid.className = 'mini-grid';
  grid.innerHTML = items.map(it => `
    <a class="mini-card" href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener">
      <div class="mini-thumb">
        <img src="${it.thumbnail}" alt="" loading="lazy" />
        ${it.duration ? `<span class="duration-overlay">${it.duration}</span>` : ''}
      </div>
      <div class="mini-info">
        <h5>${escapeHtml(it.title)}</h5>
        <div class="mini-meta">${fmtCompact(it.viewCount)} views · 좋아요 ${fmtCompact(it.likeCount)} · ${fmtDate(it.publishedAt)}</div>
      </div>
    </a>
  `).join('');
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

  if (currentRegion) p.regionCode = currentRegion;

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
      <td class="cell-actions">
        <button class="save-btn ${savedVideoIds.has(r.videoId) ? 'saved' : ''}" data-save-id="${r.videoId}" type="button" title="${savedVideoIds.has(r.videoId) ? '저장 해제' : '저장'}">
          ${savedVideoIds.has(r.videoId) ? '★' : '☆'}
        </button>
        <button class="summary-btn ${hasCachedSummary(r.videoId) ? 'has-cache' : ''}" data-summary-id="${r.videoId}" data-feature="summary" type="button" title="Gemini로 영상 요약">
          ✨
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
        ${savedVideoIds.has(r.videoId) ? '<span class="saved-badge">⭐ 저장됨</span>' : ''}
        <span class="vph-pill">${fmtVPH(r.vph)}</span>
        ${r.duration ? `<span class="duration-overlay">${r.duration}</span>` : ''}
      </a>
      <div class="card-info">
        <h3 class="card-title">${escapeHtml(r.title)}</h3>
        <div class="card-channel" title="${escapeHtml(r.channelTitle)}">${escapeHtml(r.channelTitle)} · 구독자 ${fmtCompact(r.subscriberCount)}</div>
        <div class="card-meta">${fmtCompact(r.viewCount)} views · ${fmtDate(r.publishedAt)}</div>
        <button class="card-save-btn ${savedVideoIds.has(r.videoId) ? 'saved' : ''}" data-save-id="${r.videoId}" type="button" title="${savedVideoIds.has(r.videoId) ? '저장 해제' : '저장'}">
          ${savedVideoIds.has(r.videoId) ? '★' : '☆'}
        </button>
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
const HISTORY_MAX = 200;

function getHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY_HISTORY) || '[]');
    // 이전 형식 마이그레이션: string[] / mode 없는 객체 → 영상 모드로 가정
    return raw.map(x => typeof x === 'string'
      ? { q: x, at: 0, count: 1, mode: 'video' }
      : { mode: 'video', count: 1, at: 0, ...x });
  } catch { return []; }
}

function getHistoryForMode() {
  return getHistory().filter(x => x.mode === searchMode);
}

function saveHistory(h) {
  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(h.slice(0, HISTORY_MAX)));
}

function pushHistory(q) {
  let h = getHistory();
  const existing = h.find(x => x.q === q && x.mode === searchMode);
  if (existing) {
    existing.at = Date.now();
    existing.count = (existing.count || 1) + 1;
    h = [existing, ...h.filter(x => !(x.q === q && x.mode === searchMode))];
  } else {
    h.unshift({ q, at: Date.now(), count: 1, mode: searchMode });
  }
  saveHistory(h);
  renderHistory();
}

function renderHistory() {
  const h = getHistoryForMode();
  const top = h.slice(0, 5);
  historyChips.innerHTML = top.map(item => `
    <span class="chip">
      ${escapeHtml(item.q)}
      <span class="chip-x" data-q="${escapeHtml(item.q)}">×</span>
    </span>
  `).join('');
  historyChips.querySelectorAll('.chip-x').forEach(x => {
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      removeHistory(x.dataset.q);
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
  // 우상단 기록 버튼
  if (h.length > 0) {
    historyBtn.hidden = false;
    historyBtnCount.textContent = h.length;
  } else {
    historyBtn.hidden = true;
  }
}

function removeHistory(q) {
  // 현재 모드 기록에서만 제거
  const h = getHistory().filter(x => !(x.q === q && x.mode === searchMode));
  saveHistory(h);
  renderHistory();
  if (!historyModal.classList.contains('hidden')) renderHistoryModal();
}

function openHistoryModal() {
  historyFilter.value = '';
  renderHistoryModal();
  historyModal.classList.remove('hidden');
  setTimeout(() => historyFilter.focus(), 50);
}

function renderHistoryModal() {
  const h = getHistoryForMode();
  const filter = (historyFilter.value || '').trim().toLowerCase();
  const filtered = filter ? h.filter(item => item.q.toLowerCase().includes(filter)) : h;
  const modeLabel = searchMode === 'channel' ? '채널' : '영상';
  $('historyHint').textContent = `${modeLabel} 검색 기록 ${h.length}개 · 모드별 분리 저장 · 클릭하면 다시 검색`;
  const listEl = $('historyList');
  listEl.innerHTML = filtered.map(item => `
    <div class="history-item" data-q="${escapeHtml(item.q)}">
      <div class="history-item-info">
        <div class="history-item-q">${escapeHtml(item.q)}</div>
        <div class="history-item-meta">${item.at ? timeAgo(item.at) : ''}</div>
      </div>
      ${item.count > 1 ? `<span class="history-item-count">${item.count}회</span>` : ''}
      <button class="history-item-remove" data-remove="${escapeHtml(item.q)}" title="삭제">×</button>
    </div>
  `).join('');
  // 클릭 → 검색 / × → 삭제
  listEl.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.history-item-remove')) return;
      keywordInput.value = el.dataset.q;
      historyModal.classList.add('hidden');
      onSearch();
    });
  });
  listEl.querySelectorAll('.history-item-remove').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      removeHistory(b.dataset.remove);
    });
  });
}

function clearAllHistory() {
  const modeLabel = searchMode === 'channel' ? '채널' : '영상';
  if (!confirm(`${modeLabel} 검색 기록을 모두 삭제하시겠습니까? (다른 모드 기록은 유지됩니다)`)) return;
  // 현재 모드 기록만 삭제, 다른 모드는 유지
  const h = getHistory().filter(x => x.mode !== searchMode);
  saveHistory(h);
  renderHistory();
  historyModal.classList.add('hidden');
  showToast(`🗑 ${modeLabel} 검색 기록 삭제됨`);
}

/* ───────── 국가 선택 ───────── */
function toggleRegionPopover() {
  if (regionPopover.hidden) {
    renderRegionPopover();
    regionPopover.hidden = false;
  } else {
    regionPopover.hidden = true;
  }
}

function renderRegionPopover() {
  regionPopover.innerHTML = REGIONS.map(r => `
    <button data-region="${r.code}" class="${r.code === currentRegion ? 'active' : ''}" type="button">
      <span class="flag-emoji">${r.flag}</span>
      <span>${r.label}</span>
    </button>
  `).join('');
}

function setRegion(code) {
  currentRegion = code;
  localStorage.setItem(LS_KEY_REGION, code);
  applyRegionFlag();
  regionPopover.hidden = true;
  triggerSettingsResearch();
}

function triggerSettingsResearch() {
  if (!hasSearched) return;
  const q = keywordInput.value.trim();
  if (!q) return;
  showToast('🔄 조건 변경 — 재검색 중...');
  onSearch();
}

function handleSortOrderChange() {
  if (!hasSearched) return;
  const q = keywordInput.value.trim();
  if (!q) return;
  const v = sortOrderEl.value;
  // 클라이언트 정렬: 재검색 없이 즉시 재정렬
  if (v === 'performance' || v === 'recent') {
    const keyMap = { performance: 'performance', recent: 'recentPerformance' };
    currentSort = { key: keyMap[v], dir: 'desc' };
    activePreset = null;
    savedSortBeforePreset = null;
    savedSortOrderBeforePreset = null;
    refreshPresetChips();
    sortResults();
    renderResults();
  } else {
    // YouTube API 정렬 (relevance/date/viewCount): 재검색 필요
    triggerSettingsResearch();
  }
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  if (day < 30) return `${Math.floor(day / 7)}주 전`;
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
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
function showError(message, details) {
  $('errorMessage').textContent = message || '알 수 없는 오류';
  if (details) {
    $('errorDetailsText').textContent = typeof details === 'string'
      ? details : JSON.stringify(details, null, 2);
    $('errorDetailsWrap').hidden = false;
  } else {
    $('errorDetailsWrap').hidden = true;
  }
  $('errorModal').classList.remove('hidden');
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
