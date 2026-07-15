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
const LS_KEY_SAVED_CHANNELS = 'ytkw:savedChannels';
const LS_KEY_SAVED_KEYWORDS = 'ytkw:savedKeywords';
const LS_KEY_ASPECT = 'ytkw:aspect:'; // prefix for video aspect cache
const LS_KEY_QUOTA = 'ytkw:quotaUsage';
const LS_KEY_GITHUB_PAT = 'ytkw:githubPat';
const LS_KEY_GIST_ID = 'ytkw:gistId';
const GIST_FILENAME = 'ytkeyword-backup.json';
const ENDPOINT_COSTS = { search: 100, videos: 1, channels: 1, playlistItems: 1 };
const DAILY_LIMIT = 10000;

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
const quotaBtn       = $('quotaBtn');
const quotaModal     = $('quotaModal');
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
const keywordSection    = $('keywordSection');
const kwAnalysisInput   = $('kwAnalysisInput');
const kwAnalysisBtn     = $('kwAnalysisBtn');
const kwEmpty           = $('kwEmpty');
const kwLoading         = $('kwLoading');
const kwResults         = $('kwResults');
const kwOverallEl       = $('kwOverall');
const kwVolumeEl        = $('kwVolume');
const kwCompetitionEl   = $('kwCompetition');
const kwTableBody       = $('kwTableBody');
const kwHistoryChips    = $('kwHistoryChips');
const kwFavRow          = $('kwFavRow');
const kwFavChips        = $('kwFavChips');
const kwFavModalBtn     = $('kwFavModalBtn');
const kwFavModal        = $('kwFavModal');
const kwFavModalCount   = $('kwFavModalCount');
const kwFavModalHint    = $('kwFavModalHint');
const kwFavModalList    = $('kwFavModalList');
const clearAllKwFavBtn  = $('clearAllKwFavBtn');

let currentChannelDetail = null; // { channel, latest, popular: { videos, shorts } }
let currentTop10SubTab = 'videos';
let currentLatestSort = 'date_desc';

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
let currentVideoChart = null; // { viewCount, ageDays }
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

let savedVideos = [];
let savedVideoIds = new Set();
try {
  savedVideos = JSON.parse(localStorage.getItem(LS_KEY_SAVED_VIDEOS) || '[]');
  savedVideos.forEach(v => savedVideoIds.add(v.videoId));
} catch {}

let savedChannels = [];
let savedChannelIds = new Set();
try {
  savedChannels = JSON.parse(localStorage.getItem(LS_KEY_SAVED_CHANNELS) || '[]');
  savedChannels.forEach(c => savedChannelIds.add(c.channelId));
} catch {}

let savedListActiveTab = 'videos'; // 'videos' | 'channels'

function freshFilters() {
  return {
    viewMin: null, viewMax: null,
    subMin: null, subMax: null,
    likeMin: null, likeMax: null,
    videoCountMin: null, videoCountMax: null,
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
  renderKwFavorites();
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
  // 키워드 분석 탭은 기존 영상/채널 검색 UI와 완전히 별개 화면이라
  // 툴바+메인 결과 영역을 통째로 숨기고 전용 섹션만 보여준다.
  const isKeywordMode = searchMode === 'keyword';
  document.querySelector('header.toolbar').hidden = isKeywordMode;
  document.querySelector('.settings-bar').hidden = isKeywordMode;
  document.querySelector('main.results').hidden = isKeywordMode;
  keywordSection.hidden = !isKeywordMode;
}

function setSearchMode(mode) {
  if (mode === searchMode) return;
  searchMode = mode;
  localStorage.setItem(LS_KEY_MODE, mode);
  applySearchMode();
  renderHistory(); // 모드별 history 칩 갱신
  if (mode === 'keyword') {
    renderKwFavorites();
    return; // 키워드 탭은 아래 영상/채널 결과 초기화 로직 불필요
  }
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
  kwAnalysisBtn.addEventListener('click', onKeywordAnalysisSearch);
  kwAnalysisInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onKeywordAnalysisSearch(); });
  kwTableBody.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.kw-row-fav');
    if (favBtn) { toggleKeywordFavorite(favBtn.dataset.kw, favBtn.dataset.scores ? JSON.parse(favBtn.dataset.scores) : null); return; }
    const link = e.target.closest('.kw-keyword-link');
    if (link) runKeywordAnalysisFor(link.dataset.kw);
  });
  kwFavModalBtn.addEventListener('click', openKwFavModal);
  clearAllKwFavBtn.addEventListener('click', clearAllKwFav);

  apiKeyBtn.addEventListener('click', openApiKeyModal);
  quotaBtn.addEventListener('click', openQuotaModal);
  quotaModal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) quotaModal.classList.add('hidden');
    if (e.target.id === 'quotaResetBtn') {
      localStorage.removeItem(LS_KEY_QUOTA);
      renderQuotaModal();
    }
  });
  themeToggleBtn.addEventListener('click', toggleTheme);

  // 헤더 컬럼 툴팁
  const colTooltip = $('colTooltip');
  document.addEventListener('mouseover', (e) => {
    const th = e.target.closest('th[data-tooltip]');
    if (!th) return;
    const text = th.dataset.tooltip;
    colTooltip.textContent = text;
    colTooltip.hidden = false;
    positionColTooltip(e, colTooltip);
  });
  document.addEventListener('mousemove', (e) => {
    if (!e.target.closest('th[data-tooltip]')) return;
    positionColTooltip(e, colTooltip);
  });
  document.addEventListener('mouseout', (e) => {
    if (!e.target.closest('th[data-tooltip]')) return;
    colTooltip.hidden = true;
  });

  // 사용자가 OS 테마를 바꾸면 (저장된 선택 없을 때만) 자동 반영
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(LS_KEY_THEME)) {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });
  apiKeySaveBtn.addEventListener('click', saveApiKey);
  apiKeyClearBtn.addEventListener('click', clearApiKey);
  $('gistSaveBtn').addEventListener('click', saveToGist);
  $('gistLoadBtn').addEventListener('click', loadFromGist);

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

  // 저장한 영상/채널
  savedListBtn.addEventListener('click', () => openSavedListModal());
  $('clearAllSavedBtn').addEventListener('click', clearAllSaved);
  // 저장 모달 탭 (영상/채널)
  savedListModal.querySelectorAll('.detail-tab[data-savedtab]').forEach(b => {
    b.addEventListener('click', () => switchSavedTab(b.dataset.savedtab));
  });
  // 데이터 백업 / 복원
  let pendingImportMode = 'replace';
  $('exportDataBtn').addEventListener('click', exportData);
  $('importDataBtn').addEventListener('click', () => {
    pendingImportMode = 'replace';
    $('importDataInput').click();
  });
  $('mergeDataBtn').addEventListener('click', () => {
    pendingImportMode = 'merge';
    $('importDataInput').click();
  });
  $('importDataInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) importData(f, pendingImportMode);
    e.target.value = '';
  });

  // 디테일 모달 저장 토글들
  const vt = $('videoSaveToggle');
  if (vt) vt.addEventListener('click', () => {
    if (currentDetail?.result) toggleSave(currentDetail.result.videoId);
  });
  const vct = $('videoChannelSaveToggle');
  if (vct) vct.addEventListener('click', () => {
    if (currentDetail?.result) toggleSaveChannel(currentDetail.result.channelId);
  });
  const cdt = $('cdSaveToggle');
  if (cdt) cdt.addEventListener('click', () => {
    if (currentChannelDetail?.channel) toggleSaveChannel(currentChannelDetail.channel.channelId);
  });

  // mini 카드 저장 버튼 (모든 모달 내 미니 그리드)
  [detailModal, channelDetailModal, savedListModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      const btn = e.target.closest('.mini-save-btn[data-mini-save]');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      const id = btn.dataset.miniSave;
      const info = findMiniVideoInfo(id);
      toggleSave(id, info);
    });
  });

  // 저장 영상 카드 클릭 → 영상 상세 모달
  savedListModal.addEventListener('click', (e) => {
    if (e.target.closest('.mini-save-btn, .card-save-btn, [data-saved-channel-remove]')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    const card = e.target.closest('.result-card[data-mini-id]');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    const videoId = card.dataset.miniId;
    const saved = savedVideos.find(v => v.videoId === videoId);
    if (saved) openSavedVideoDetail(saved);
  });

  // 채널 타임라인 range 탭
  const ttabs = $('timelineRangeTabs');
  if (ttabs) ttabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.growth-tab');
    if (!tab) return;
    document.querySelectorAll('#timelineRangeTabs .growth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const range = tab.dataset.range === 'all' ? 'all' : Number(tab.dataset.range);
    if (currentChannelDetail) {
      currentChannelDetail.timelineRange = range;
      currentChannelDetail.timelineZoom = null; // 줌 리셋
      if (currentChannelDetail.timelineVideos) {
        drawChannelTimeline(currentChannelDetail.timelineVideos, range);
      }
    }
  });

  // 타임라인 차트 줌 (마우스 휠) + 더블클릭 리셋
  const tlChart = $('channelTimelineChart');
  if (tlChart) {
    tlChart.addEventListener('wheel', (e) => {
      if (!currentChannelDetail?.timelineVideos) return;
      const svg = tlChart.querySelector('svg');
      if (!svg) return;
      e.preventDefault();
      handleTimelineZoom(e, svg, tlChart, currentChannelDetail);
    }, { passive: false });
    tlChart.addEventListener('dblclick', () => {
      if (!currentChannelDetail) return;
      currentChannelDetail.timelineZoom = null;
      drawChannelTimeline(currentChannelDetail.timelineVideos, currentChannelDetail.timelineRange);
    });
  }

  // 영상 모달 채널 탭 — 타임라인 range탭 + 휠 줌 + 더블클릭 리셋
  const dtabs = $('detailTimelineRangeTabs');
  if (dtabs) dtabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.growth-tab');
    if (!tab) return;
    dtabs.querySelectorAll('.growth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const range = tab.dataset.range === 'all' ? 'all' : Number(tab.dataset.range);
    if (currentDetail) {
      currentDetail.timelineRange = range;
      currentDetail.timelineZoom = null;
      if (currentDetail.timelineVideos) {
        drawChannelTimeline(currentDetail.timelineVideos, range, null, $('detailChannelTimelineChart'));
      }
    }
  });
  const dtlChart = $('detailChannelTimelineChart');
  if (dtlChart) {
    dtlChart.addEventListener('wheel', (e) => {
      if (!currentDetail?.timelineVideos) return;
      const svg = dtlChart.querySelector('svg');
      if (!svg) return;
      e.preventDefault();
      handleTimelineZoom(e, svg, dtlChart, currentDetail);
    }, { passive: false });
    dtlChart.addEventListener('dblclick', () => {
      if (!currentDetail) return;
      currentDetail.timelineZoom = null;
      drawChannelTimeline(currentDetail.timelineVideos, currentDetail.timelineRange, null, dtlChart);
    });
  }

  // 그래프 탭
  const gtabs = $('growthTabs');
  if (gtabs) gtabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.growth-tab');
    if (!tab || tab.classList.contains('disabled')) return;
    document.querySelectorAll('#growthTabs .growth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (currentVideoChart) {
      const range = tab.dataset.range === 'all' ? 'all' : Number(tab.dataset.range);
      drawGrowthChart(currentVideoChart.viewCount, currentVideoChart.ageDays, range, currentVideoChart.publishedAt);
    }
  });

  // 검색 기록
  historyBtn.addEventListener('click', openHistoryModal);
  historyFilter.addEventListener('input', renderHistoryModal);
  $('clearAllHistoryBtn').addEventListener('click', clearAllHistory);

  // 설정 드롭다운 변경 → 조회 버튼 활성화 (자동 재검색 X)
  [maxResultsEl, videoDurationEl, periodEl].forEach(el => {
    el.addEventListener('change', markSettingsDirty);
  });
  sortOrderEl.addEventListener('change', handleSortOrderChange);

  const settingsSearchBtn = $('settingsSearchBtn');
  settingsSearchBtn.addEventListener('click', () => {
    settingsSearchBtn.classList.remove('dirty');
    triggerSettingsResearch();
  });

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
  ['viewMin','viewMax','subMin','subMax','likeMin','likeMax','videoCountMin','videoCountMax','dateMin','dateMax'].forEach(id => {
    $(id).addEventListener('input', () => {
      const v = $(id).value;
      filters[id] = v === '' ? null : (id.startsWith('date') ? v : Number(v));
      updateFilterPreviewCount();
    });
  });

  // 최신 업로드 정렬 버튼
  channelDetailModal.addEventListener('click', (e) => {
    const btn = e.target.closest('.latest-sort-btn[data-lsort]');
    if (!btn) return;
    currentLatestSort = btn.dataset.lsort;
    channelDetailModal.querySelectorAll('.latest-sort-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
    if (currentChannelDetail?.latest) {
      renderMiniGrid('cdLatestGrid', sortLatestItems(currentChannelDetail.latest));
    }
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
  currentDetail = { result, recent: null, popular: null, timelineVideos: null, timelineRange: 365, timelineZoom: null };
  const dtlEl = $('detailChannelTimelineChart');
  if (dtlEl) dtlEl.innerHTML = '<button class="timeline-load-btn" type="button" onclick="loadDetailChannelTimeline()">📊 그래프 불러오기 (~2 units)</button>';
  const dtabs = $('detailTimelineRangeTabs');
  if (dtabs) { dtabs.querySelectorAll('.growth-tab').forEach(t => t.classList.toggle('active', t.dataset.range === '365')); }
  populateVideoTab(result);
  populateChannelTab(result);
  // 저장 토글 상태 동기화
  updateSaveButtons(result.videoId, savedVideoIds.has(result.videoId));
  updateSaveChannelButtons(result.channelId, savedChannelIds.has(result.channelId));
  // 영상 저장 토글 (모달용)
  const vBtn = $('videoSaveToggle');
  if (vBtn) {
    const isSaved = savedVideoIds.has(result.videoId);
    vBtn.classList.toggle('saved', isSaved);
    vBtn.textContent = isSaved ? '★' : '☆';
    vBtn.title = isSaved ? '영상 저장 해제' : '영상 저장';
  }
  // 채널 저장 토글
  const cBtn = $('videoChannelSaveToggle');
  if (cBtn) {
    const isSaved = savedChannelIds.has(result.channelId);
    cBtn.classList.toggle('saved', isSaved);
    cBtn.textContent = isSaved ? '★' : '☆';
  }
  // 이전 영상의 인기 영상 그리드 잔존 리셋
  $('popularGrid').innerHTML = '<p class="loading-text">탭을 누르면 로딩됩니다 (API quota 100 units 사용)</p>';
  switchDetailTab('video');
  detailModal.classList.remove('hidden');
}

async function openSavedVideoDetail(saved) {
  const days = daysSince(saved.publishedAt);
  const hours = Math.max(1, (Date.now() - new Date(saved.publishedAt).getTime()) / 3600000);
  // 저장된 데이터로 즉시 모달 열기 (부분 데이터)
  const partial = {
    videoId: saved.videoId,
    title: saved.title,
    channelTitle: saved.channelTitle || '',
    channelId: saved.channelId || '',
    thumbnail: saved.thumbnail,
    duration: saved.duration || '',
    viewCount: saved.viewCount || 0,
    publishedAt: saved.publishedAt,
    isShorts: saved.isShorts,
    days,
    hours,
    vph: (saved.viewCount || 0) / hours,
    likeCount: 0, commentCount: 0,
    subscriberCount: 0, channelVideoCount: 0, channelViewCount: 0, channelDays: null,
    channelThumbnail: '', channelDescription: '', channelPublishedAt: '',
    uploadsPlaylistId: '',
    tags: [], description: '',
    performance: null, recentPerformance: null, contribution: null, exposure: null,
    performanceTier: null, contributionTier: null, exposureTier: null,
  };
  openVideoDetail(partial);

  const apiKey = getApiKey();
  if (!apiKey || !saved.channelId) return;
  try {
    const [videoData, channelData] = await Promise.all([
      ytFetch('videos', { part: 'statistics,contentDetails,snippet', id: saved.videoId, key: apiKey }),
      ytFetch('channels', { part: 'statistics,snippet,contentDetails', id: saved.channelId, key: apiKey }),
    ]);
    const v = videoData.items?.[0];
    const c = channelData.items?.[0];
    if (!v || !c) return;

    const subs = num(c.statistics?.subscriberCount);
    const views = num(v.statistics?.viewCount);
    const likes = num(v.statistics?.likeCount);
    const comments = num(v.statistics?.commentCount);
    const channelViews = num(c.statistics?.viewCount);
    const channelVideoCount = num(c.statistics?.videoCount);
    const avgVideoViews = channelVideoCount > 0 ? channelViews / channelVideoCount : null;
    const performance = subs > 0 ? views / subs : null;
    const contribution = avgVideoViews > 0 ? views / avgVideoViews : null;
    const exposure = views > 0 ? (likes + comments) / views * 100 : null;
    const durationSec = parseDurationSec(v.contentDetails?.duration);

    const full = {
      ...partial,
      viewCount: views, likeCount: likes, commentCount: comments,
      subscriberCount: subs, channelVideoCount, channelViewCount: channelViews,
      channelDays: c.snippet?.publishedAt ? daysSince(c.snippet.publishedAt) : null,
      channelThumbnail: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url || '',
      channelDescription: decodeHtml(c.snippet?.description || ''),
      channelPublishedAt: c.snippet?.publishedAt || '',
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads || '',
      tags: (v.snippet?.tags || []).map(decodeHtml),
      description: decodeHtml(v.snippet?.description || ''),
      duration: formatDuration(durationSec),
      vph: views / hours,
      performance, contribution, exposure,
      performanceTier: rateTier(performance, [0.3, 1, 3, 10]),
      contributionTier: rateTier(contribution, [0.3, 1, 3, 10]),
      exposureTier: rateTier(exposure, [0.5, 1.5, 4, 8]),
    };

    if (currentDetail?.result?.videoId === saved.videoId) {
      currentDetail.result = full;
      populateVideoTab(full);
      populateChannelTab(full);
    }
  } catch (err) {
    console.warn('저장 영상 상세 로딩 실패:', err);
  }
}

function populateVideoTab(r) {
  $('detailThumb').src = r.thumbnail;
  $('detailDuration').textContent = r.duration || '';
  $('detailTitle').textContent = r.title;
  $('detailMeta').textContent =
    `${fmtCompact(r.viewCount)} views · ${escapeText(r.channelTitle)} · ${fmtDate(r.publishedAt)} · ${r.days}일 전`;
  $('detailYouTubeBtn').href = `https://www.youtube.com/watch?v=${r.videoId}`;

  // Key metrics pills (Engagement / Outlier / VPH)
  $('kmEngagement').textContent = r.exposure != null
    ? r.exposure.toFixed(1) + '%' : '-';
  $('kmOutlier').textContent = r.performance != null
    ? (r.performance >= 100 ? '>100x' : (r.performance >= 10 ? Math.round(r.performance) + 'x' : r.performance.toFixed(1) + 'x'))
    : '-';
  $('kmVph').textContent = r.vph != null ? fmtVPHShort(r.vph) : '-';

  // 6장 통계 카드
  $('statViews').textContent  = fmtCompact(r.viewCount);
  $('statLikes').textContent  = fmtCompact(r.likeCount);
  $('statComments').textContent = fmtCompact(r.commentCount);
  $('statContribution').textContent = r.contribution != null
    ? (r.contribution >= 10 ? Math.round(r.contribution) + 'x' : r.contribution.toFixed(1) + 'x')
    : '-';
  $('statDays').textContent = (r.days || 0) + '일';
  $('statDuration').textContent = r.duration || '-';

  // 누적 조회수 추정 그래프
  initGrowthChart(r);

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
  if (tab === 'channel' && currentDetail) {
    if (!currentDetail.recent) loadChannelRecent();
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
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      return {
        videoId: id,
        title: decodeHtml(it.snippet.title),
        thumbnail: it.snippet.thumbnails?.medium?.url
          || it.snippet.thumbnails?.default?.url || '',
        viewCount: num(s.statistics?.viewCount),
        publishedAt: it.snippet.publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
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
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      return {
        videoId: v.id.videoId,
        title: decodeHtml(v.snippet.title),
        thumbnail: v.snippet.thumbnails?.medium?.url
          || v.snippet.thumbnails?.default?.url || '',
        viewCount: num(s.statistics?.viewCount),
        publishedAt: v.snippet.publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
      };
    });
    currentDetail.popular = items;
    renderMiniGrid('popularGrid', items);
  } catch (err) {
    $('popularGrid').innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

function renderMiniGrid(elOrId, items) {
  const grid = typeof elOrId === 'string' ? $(elOrId) : elOrId;
  if (!items.length) {
    grid.innerHTML = '<p class="empty-text">영상 없음</p>';
    return;
  }
  // isPortrait 우선, fallback isShorts
  const isP = it => (it.isPortrait !== undefined ? it.isPortrait : it.isShorts);
  const landscape = items.filter(it => !isP(it));
  const shorts = items.filter(it => isP(it));
  grid.className = '';
  const sections = [];
  if (landscape.length) {
    sections.push(`
      <section class="card-section">
        ${shorts.length ? `<h3 class="card-section-title">📺 일반 영상 <span class="section-count">${landscape.length}개</span></h3>` : ''}
        <div class="card-grid-landscape">
          ${landscape.map(it => miniCardHtml(it, false)).join('')}
        </div>
      </section>
    `);
  }
  if (shorts.length) {
    sections.push(`
      <section class="card-section">
        ${landscape.length ? `<h3 class="card-section-title">📱 Shorts <span class="section-count">${shorts.length}개</span></h3>` : ''}
        <div class="card-grid-portrait">
          ${shorts.map(it => miniCardHtml(it, true)).join('')}
        </div>
      </section>
    `);
  }
  grid.innerHTML = sections.join('');
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

function toggleSave(videoId, fallbackInfo) {
  // 결과 목록 우선, 없으면 fallback (미니 카드 등)
  const fromResults = allResults.find(r => r.videoId === videoId) || fallbackInfo;
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
      isShorts: fromResults.isShorts,
      isPortrait: fromResults.isPortrait,
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
  // 미니 카드의 mini-save-btn (인기/최신/저장 목록 등)
  document.querySelectorAll(`.mini-save-btn[data-mini-save="${CSS.escape(videoId)}"]`).forEach(b => {
    b.classList.toggle('saved', isSaved);
    b.textContent = isSaved ? '★' : '☆';
    b.title = isSaved ? '저장 해제' : '저장';
  });
  // 영상 디테일 모달 토글
  if (currentDetail?.result?.videoId === videoId) {
    const btn = $('videoSaveToggle');
    if (btn) {
      btn.classList.toggle('saved', isSaved);
      btn.textContent = isSaved ? '★' : '☆';
      btn.title = isSaved ? '영상 저장 해제' : '영상 저장';
    }
  }
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

function openSavedListModal(tab) {
  if (tab) savedListActiveTab = tab;
  switchSavedTab(savedListActiveTab);
  savedListModal.classList.remove('hidden');
}

function switchSavedTab(tab) {
  savedListActiveTab = tab;
  savedListModal.querySelectorAll('.detail-tab[data-savedtab]').forEach(b =>
    b.classList.toggle('active', b.dataset.savedtab === tab));
  $('savedVideosCount').textContent = savedVideos.length;
  $('savedChannelsCount').textContent = savedChannels.length;
  renderSavedList();
}

function renderSavedList() {
  const grid = $('savedListGrid');
  const hint = $('savedListHint');
  if (savedListActiveTab === 'channels') {
    hint.textContent = savedChannels.length
      ? `저장한 채널 ${savedChannels.length}개 — 카드 클릭 시 YouTube로 이동`
      : '저장한 채널이 없습니다. 채널 찾기 → 채널 상세 → ☆ 버튼으로 저장하세요.';
    if (!savedChannels.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = savedChannels.map(c => {
      const countryRegion = REGIONS.find(r => r.code === c.country);
      const flag = countryRegion ? countryRegion.flag : '';
      return `
        <a class="saved-channel-card" href="https://www.youtube.com/channel/${escapeHtml(c.channelId)}" target="_blank" rel="noopener" data-saved-channel-detail="${escapeHtml(c.channelId)}" style="margin-bottom:8px" title="클릭하면 채널 상세 (Cmd+클릭은 YouTube)">
          <img class="channel-avatar" src="${c.thumbnail || ''}" alt="" loading="lazy" />
          <div class="saved-channel-info">
            <div class="saved-channel-name">${flag ? flag + ' ' : ''}${escapeHtml(c.name)}</div>
            <div class="saved-channel-meta">구독자 ${fmtCompact(c.subscribers || 0)} · 영상 ${fmtCompact(c.videoCount || 0)}개</div>
          </div>
          <button class="card-save-btn saved" data-saved-channel-remove="${escapeHtml(c.channelId)}" type="button" title="저장 해제">★</button>
        </a>
      `;
    }).join('');
    // 별 클릭 → 저장 해제
    grid.querySelectorAll('[data-saved-channel-remove]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaveChannel(b.dataset.savedChannelRemove);
      });
    });
    // 카드 클릭 → 채널 디테일 모달
    grid.querySelectorAll('[data-saved-channel-detail]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-saved-channel-remove]')) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        openChannelDetailById(el.dataset.savedChannelDetail);
      });
    });
    return;
  }
  // 영상 탭
  hint.textContent = savedVideos.length
    ? `저장한 영상 ${savedVideos.length}개 — 카드 클릭 시 YouTube, ★로 저장 해제`
    : '저장한 영상이 없습니다. 검색 결과의 ☆ 버튼을 눌러 저장하세요.';
  if (!savedVideos.length) { grid.innerHTML = ''; return; }
  // mini-grid 패턴 (가로/세로 분리)
  renderMiniGrid(grid, savedVideos.map(v => ({ ...v, isShorts: v.isPortrait ?? v.isShorts, isPortrait: v.isPortrait ?? v.isShorts })));
  // 저장 해제 버튼 추가 (각 카드 위)
  grid.querySelectorAll('.result-card').forEach((card, i) => {
    const v = savedVideos[i];
    if (!v) return;
    const btn = document.createElement('button');
    btn.className = 'card-save-btn saved';
    btn.textContent = '★';
    btn.title = '저장 해제';
    btn.style.cssText = 'position:absolute; top:6px; right:6px; z-index:2';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSave(v.videoId);
    });
    card.style.position = 'relative';
    card.appendChild(btn);
  });
}

function clearAllSaved() {
  if (savedListActiveTab === 'channels') {
    if (!savedChannels.length) return;
    if (!confirm(`저장한 채널 ${savedChannels.length}개를 모두 삭제하시겠습니까?`)) return;
    const ids = savedChannels.map(c => c.channelId);
    savedChannels = [];
    savedChannelIds.clear();
    persistSavedChannels();
    updateSavedListButton();
    ids.forEach(id => updateSaveChannelButtons(id, false));
    savedListModal.classList.add('hidden');
    showToast('🗑 저장 채널 목록 비움');
  } else {
    if (!savedVideos.length) return;
    if (!confirm(`저장한 영상 ${savedVideos.length}개를 모두 삭제하시겠습니까?`)) return;
    const ids = savedVideos.map(v => v.videoId);
    savedVideos = [];
    savedVideoIds.clear();
    persistSaved();
    updateSavedListButton();
    ids.forEach(id => updateSaveButtons(id, false));
    savedListModal.classList.add('hidden');
    showToast('🗑 저장 영상 목록 비움');
  }
}

/* ───────── 저장한 채널 ───────── */
function persistSavedChannels() {
  localStorage.setItem(LS_KEY_SAVED_CHANNELS, JSON.stringify(savedChannels));
}

function toggleSaveChannel(channelId) {
  const channel = currentChannelDetail?.channel?.channelId === channelId
    ? currentChannelDetail.channel
    : (currentDetail?.result?.channelId === channelId
        ? buildChannelFromVideoResult(currentDetail.result)
        : allChannels.find(c => c.channelId === channelId));
  if (savedChannelIds.has(channelId)) {
    savedChannelIds.delete(channelId);
    savedChannels = savedChannels.filter(c => c.channelId !== channelId);
    persistSavedChannels();
    updateSavedListButton();
    updateSaveChannelButtons(channelId, false);
    showToast('⭐ 채널 저장 해제됨');
    if (!savedListModal.classList.contains('hidden')) renderSavedList();
  } else {
    if (!channel) {
      showToast('저장할 채널 정보를 찾을 수 없습니다');
      return;
    }
    const entry = {
      channelId: channel.channelId,
      name: channel.name || channel.channelTitle || '',
      thumbnail: channel.thumbnail || channel.channelThumbnail || '',
      country: channel.country || '',
      subscribers: channel.subscribers || channel.subscriberCount || 0,
      videoCount: channel.videoCount || channel.channelVideoCount || 0,
      savedAt: Date.now(),
    };
    savedChannels.unshift(entry);
    savedChannelIds.add(channelId);
    persistSavedChannels();
    updateSavedListButton();
    updateSaveChannelButtons(channelId, true);
    showToast(`⭐ "${entry.name}" 채널 저장됨`);
  }
}

function buildChannelFromVideoResult(r) {
  return {
    channelId: r.channelId,
    name: r.channelTitle,
    thumbnail: r.channelThumbnail,
    country: '',
    subscribers: r.subscriberCount,
    videoCount: r.channelVideoCount,
  };
}

function updateSaveChannelButtons(channelId, isSaved) {
  // 채널 디테일 모달 토글
  if (currentChannelDetail?.channel?.channelId === channelId) {
    const btn = $('cdSaveToggle');
    if (btn) {
      btn.classList.toggle('saved', isSaved);
      btn.textContent = isSaved ? '★' : '☆';
      btn.title = isSaved ? '채널 저장 해제' : '채널 저장';
    }
  }
  // 비디오 디테일 모달의 채널 정보 탭 토글
  if (currentDetail?.result?.channelId === channelId) {
    const btn = $('videoChannelSaveToggle');
    if (btn) {
      btn.classList.toggle('saved', isSaved);
      btn.textContent = isSaved ? '★' : '☆';
      btn.title = isSaved ? '채널 저장 해제' : '채널 저장';
    }
  }
}

function updateSavedListButton() {
  const total = savedVideoIds.size + savedChannelIds.size;
  if (total > 0) {
    savedListBtn.hidden = false;
    savedListCount.textContent = total;
  } else {
    savedListBtn.hidden = true;
  }
}

function positionColTooltip(e, el) {
  const pad = 12;
  const tw = el.offsetWidth, th2 = el.offsetHeight;
  let x = e.clientX + pad;
  let y = e.clientY - th2 - pad;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - pad;
  if (y < 8) y = e.clientY + pad;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
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

function openQuotaModal() {
  renderQuotaModal();
  quotaModal.classList.remove('hidden');
}

function renderQuotaModal() {
  const today = new Date().toLocaleDateString('en-CA');
  let usage;
  try { usage = JSON.parse(localStorage.getItem(LS_KEY_QUOTA)); } catch (_) {}
  if (!usage || usage.date !== today) usage = { date: today, total: 0, breakdown: {} };

  const pct = Math.min(100, (usage.total / DAILY_LIMIT) * 100);
  const remaining = Math.max(0, DAILY_LIMIT - usage.total);
  const barColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e';

  const EP_LABEL = { search: '검색 (search.list)', videos: '영상 정보 (videos.list)', channels: '채널 정보 (channels.list)', playlistItems: '재생목록 (playlistItems.list)' };
  const rows = Object.entries(usage.breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([ep, units]) => {
      const calls = Math.round(units / (ENDPOINT_COSTS[ep] || 1));
      return `<tr><td>${EP_LABEL[ep] || ep}</td><td class="quota-td-num">${calls}회</td><td class="quota-td-num">${units.toLocaleString()}</td></tr>`;
    }).join('');

  // 다음 리셋: 태평양 자정 기준 (UTC+0 기준 08:00 = PDT 자정)
  const nowUtc = Date.now();
  const nextResetUtc = (() => {
    const d = new Date();
    d.setUTCHours(8, 0, 0, 0); // PDT 자정 = UTC 07:00 (여름), PST = UTC 08:00
    if (d.getTime() <= nowUtc) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  })();
  const diffMs = nextResetUtc - nowUtc;
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  const resetStr = `${diffH}시간 ${diffM}분 후 초기화`;

  $('quotaModalBody').innerHTML = `
    <div class="quota-summary">
      <span class="quota-used-num">${usage.total.toLocaleString()}</span>
      <span class="quota-limit-label"> / ${DAILY_LIMIT.toLocaleString()} units</span>
    </div>
    <div class="quota-bar-wrap">
      <div class="quota-bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
    </div>
    <div class="quota-meta">
      <span>남은 유닛 <strong>${remaining.toLocaleString()}</strong></span>
      <span>${resetStr}</span>
    </div>
    <table class="quota-table">
      <thead><tr><th>엔드포인트</th><th>호출</th><th>유닛</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="quota-empty">오늘 API 호출 없음</td></tr>'}</tbody>
    </table>
    <p class="hint-small" style="margin-top:14px">search.list = 100 units · videos/channels/playlistItems = 1 unit · 일일 한도 10,000 units</p>
  `;
}

function openApiKeyModal() {
  apiKeyInput.value = getApiKey();
  geminiKeyInput.value = getGeminiKey();
  $('githubPatInput').value = localStorage.getItem(LS_KEY_GITHUB_PAT) || '';
  updateGistStatus();
  apiKeyModal.classList.remove('hidden');
  setTimeout(() => apiKeyInput.focus(), 50);
}

function saveApiKey() {
  const yt = apiKeyInput.value.trim();
  const gem = geminiKeyInput.value.trim();
  const pat = $('githubPatInput').value.trim();
  let saved = [];
  if (yt) { localStorage.setItem(LS_KEY_API, yt); saved.push('YouTube'); }
  if (gem) { localStorage.setItem(LS_KEY_GEMINI, gem); saved.push('Gemini'); }
  if (pat) { localStorage.setItem(LS_KEY_GITHUB_PAT, pat); saved.push('GitHub'); }
  apiKeyModal.classList.add('hidden');
  if (saved.length) showToast(`✅ ${saved.join(' + ')} 키 저장`);
  else showToast('변경 사항 없음');
}

function clearApiKey() {
  localStorage.removeItem(LS_KEY_API);
  localStorage.removeItem(LS_KEY_GEMINI);
  localStorage.removeItem(LS_KEY_GITHUB_PAT);
  localStorage.removeItem(LS_KEY_GIST_ID);
  apiKeyInput.value = '';
  geminiKeyInput.value = '';
  $('githubPatInput').value = '';
  showToast('🗑️ 모든 API 키 삭제됨');
}

function updateGistStatus() {
  const gistId = localStorage.getItem(LS_KEY_GIST_ID);
  const el = $('gistStatus');
  if (!el) return;
  el.textContent = gistId ? `연결된 Gist: https://gist.github.com/${gistId}` : '아직 저장된 Gist 없음';
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
  $('settingsSearchBtn').hidden = false;
  clearSettingsDirty();
  progressBar.classList.add('active');
  emptyState.hidden = true;
  tableWrap.hidden = true;
  channelsWrap.hidden = true;

  try {
    const params = buildSearchParams(q);
    const totalWanted = Math.min(500, parseInt(maxResultsEl.value, 10) || 50);
    // 한 번 호출에 50개 최대 → 페이지네이션
    let collected = [];
    let pageToken = '';
    while (collected.length < totalWanted) {
      const pageSize = Math.min(50, totalWanted - collected.length);
      const pageParams = { ...params, maxResults: pageSize, key: apiKey };
      if (pageToken) pageParams.pageToken = pageToken;
      const search = await ytFetch('search', pageParams);
      const items = (search.items || []).filter(v => v.id && v.id.videoId);
      collected = collected.concat(items);
      pageToken = search.nextPageToken || '';
      if (!pageToken || !items.length) break;
    }
    const videos = collected;
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
      // Shorts 판단: 3분 이하 (YouTube 정의)
      const isShorts = durationSec > 0 && durationSec <= 180;
      // 종횡비 판단: 우선 캐시 또는 duration 기반 초기값 → 백그라운드에서 썸네일로 정확 보정
      const cachedAspect = getCachedAspect(v.id.videoId);
      const isPortrait = cachedAspect
        ? cachedAspect === 'portrait'
        : (durationSec > 0 && durationSec <= 60); // 1분 이하만 확신, 그 이상은 백그라운드 감지

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
        isPortrait,
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

    // 백그라운드: 종횡비 정확히 감지 (썸네일 로드)
    detectAspectsForResults(allResults);
  } catch (err) {
    console.error(err);
    showError(`영상 검색 중 오류가 발생했습니다.\n\n${err.message}`, err.stack);
  } finally {
    progressBar.classList.remove('active');
  }
}

/* ───────── 종횡비 감지 (썸네일 native size) ───────── */
function getCachedAspect(videoId) {
  try { return localStorage.getItem(LS_KEY_ASPECT + videoId); } catch { return null; }
}
function setCachedAspect(videoId, aspect) {
  try { localStorage.setItem(LS_KEY_ASPECT + videoId, aspect); } catch {}
}

function detectAspectFromThumb(videoId) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (aspect) => { if (!settled) { settled = true; resolve(aspect); } };
    img.onload = () => {
      const ar = img.naturalWidth / img.naturalHeight;
      if (!isFinite(ar) || img.naturalWidth === 0) {
        finish(null);
      } else if (ar < 0.95) {
        finish('portrait');
      } else if (ar > 1.05) {
        finish('landscape');
      } else {
        finish(null); // 1:1 정사각 등 애매
      }
    };
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), 5000); // 5초 timeout
    img.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  });
}

async function detectAspectsForResults(results) {
  if (!results || !results.length) return;
  // 캐시 미스만 감지
  const toDetect = results.filter(r => !getCachedAspect(r.videoId));
  if (!toDetect.length) {
    // 캐시만으로 모두 결정 가능 — 이미 결과 객체에 반영됨
    return;
  }

  // 5개씩 병렬로 감지 (브라우저 동시 연결 제한 고려)
  const CONCURRENCY = 5;
  let updated = false;
  for (let i = 0; i < toDetect.length; i += CONCURRENCY) {
    const batch = toDetect.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (r) => {
      const aspect = await detectAspectFromThumb(r.videoId);
      if (!aspect) return; // 알 수 없음 — 기존 값 유지
      setCachedAspect(r.videoId, aspect);
      const newIsPortrait = aspect === 'portrait';
      if (r.isPortrait !== newIsPortrait) {
        r.isPortrait = newIsPortrait;
        updated = true;
      }
    }));
  }

  // 결과 갱신
  if (updated && viewMode === 'cards' && displayResults.length) {
    renderCards();
  }
}

/* ───────── 누적 조회수 추정 그래프 ───────── */
function initGrowthChart(r) {
  const ageDays = Math.max(1, r.days || 1);
  currentVideoChart = { viewCount: r.viewCount, ageDays, publishedAt: r.publishedAt };
  $('growthTotal').textContent = fmtCompact(r.viewCount);

  // 영상 게시 기간에 따라 적절한 탭만 활성화
  const tabs = document.querySelectorAll('#growthTabs .growth-tab');
  tabs.forEach(t => {
    t.classList.remove('active');
    const range = t.dataset.range;
    if (range === 'all') {
      t.classList.remove('disabled');
    } else {
      const n = Number(range);
      t.classList.toggle('disabled', n > ageDays);
    }
  });
  // 기본 활성 탭: All (또는 가장 큰 가능 값)
  let initial = 'all';
  if (ageDays < 1) initial = '1';
  else if (ageDays < 7) initial = '7';
  else if (ageDays < 28) initial = '28';
  else initial = 'all';
  const initialTab = document.querySelector(`#growthTabs .growth-tab[data-range="${initial}"]`);
  if (initialTab) initialTab.classList.add('active');

  const range = initial === 'all' ? 'all' : Number(initial);
  drawGrowthChart(r.viewCount, ageDays, range, r.publishedAt);
}

function formatGrowthXLabel(t, range, publishedAt, mode) {
  // mode: 'date' (실제 캘린더 날짜) / 'days' (N D) / 'hours' (NH)
  if (mode === 'hours') {
    return Math.round(t * 24) + 'H';
  }
  if (mode === 'days') {
    return Math.round(t) + 'D';
  }
  // date mode
  if (!publishedAt) return Math.round(t) + 'D';
  const date = new Date(new Date(publishedAt).getTime() + t * 86400000);
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function drawGrowthChart(viewCount, ageDays, rangeDays, publishedAt) {
  const svg = $('growthChart');
  if (!svg) return;
  const range = rangeDays === 'all' ? ageDays : Math.min(rangeDays, ageDays);
  const total = viewCount || 0;

  // 곡선 데이터: log 누적 모델
  // cumViews(t) = total * log(1+t) / log(1+ageDays)
  const N = 100;
  const points = [];
  const denom = Math.log(1 + ageDays) || 1;
  for (let i = 0; i <= N; i++) {
    const t = (range * i) / N;
    const v = total * Math.log(1 + t) / denom;
    points.push({ t, v });
  }
  const maxY = points[points.length - 1].v || 1;

  const W = 720, H = 280;
  const pad = { left: 20, right: 65, top: 20, bottom: 32 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const xs = points.map(p => pad.left + (p.t / range) * cw);
  const ys = points.map(p => pad.top + ch - (p.v / maxY) * ch);
  let path = '';
  for (let i = 0; i < points.length; i++) {
    path += (i === 0 ? 'M' : ' L') + xs[i].toFixed(1) + ',' + ys[i].toFixed(1);
  }

  const yLabels = [0, 0.25, 0.5, 0.75, 1];
  // X 라벨 모드 결정
  const xMode = (rangeDays === 'all' && ageDays >= 30) ? 'date'
              : (range >= 28) ? 'date'
              : (range >= 1) ? 'days'
              : 'hours';
  // X 라벨 개수 (라벨이 너무 빽빽하지 않게)
  const xCount = xMode === 'date' ? 6 : 5;
  const xLabels = [];
  for (let i = 0; i < xCount; i++) xLabels.push(i / (xCount - 1));

  svg.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yLabels.map(f => {
        const y = pad.top + ch * (1 - f);
        return `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.15" stroke-width="1"/>`;
      }).join('')}
      <path d="${path} L${xs[xs.length-1].toFixed(1)},${(pad.top + ch).toFixed(1)} L${xs[0].toFixed(1)},${(pad.top + ch).toFixed(1)} Z" fill="url(#growthGrad)"/>
      <path d="${path}" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${xs[xs.length-1].toFixed(1)}" cy="${ys[ys.length-1].toFixed(1)}" r="5" fill="#3b82f6"/>
      ${yLabels.map(f => {
        const y = pad.top + ch * (1 - f);
        const v = maxY * f;
        return `<text x="${W - pad.right + 6}" y="${(y + 4).toFixed(1)}" font-size="11" fill="currentColor" fill-opacity="0.6" font-family="sans-serif">${fmtCompact(Math.round(v))}</text>`;
      }).join('')}
      ${xLabels.map(f => {
        const x = pad.left + cw * f;
        const t = range * f;
        const label = formatGrowthXLabel(t, range, publishedAt, xMode);
        return `<text x="${x.toFixed(1)}" y="${H - 10}" font-size="10" fill="currentColor" fill-opacity="0.6" text-anchor="${f === 0 ? 'start' : (f === 1 ? 'end' : 'middle')}" font-family="sans-serif">${label}</text>`;
      }).join('')}
    </svg>
  `;
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
    const totalWanted = Math.min(500, parseInt(maxResultsEl.value, 10) || 50);
    let collected = [];
    let pageToken = '';
    while (collected.length < totalWanted) {
      const pageSize = Math.min(50, totalWanted - collected.length);
      const sp = {
        part: 'snippet',
        type: 'channel',
        maxResults: pageSize,
        q,
        key: apiKey,
        ...(currentRegion ? { regionCode: currentRegion } : {}),
      };
      if (pageToken) sp.pageToken = pageToken;
      const search = await ytFetch('search', sp);
      collected = collected.concat(search.items || []);
      pageToken = search.nextPageToken || '';
      if (!pageToken || !search.items?.length) break;
    }
    const ids = collected
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
        uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads || '',
        latestVideo: null,
        lastUploadAt: null,
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
    showToast(`✅ ${allChannels.length}개 채널 검색됨 · 최근 영상 로딩 중...`);

    // 각 채널의 최근 영상 1개 fetch (병렬, ~50 units)
    await fetchLatestVideosForChannels(allChannels, apiKey);
    sortChannels();
    renderChannelsTable();
  } catch (err) {
    console.error(err);
    showError(`채널 검색 중 오류가 발생했습니다.\n\n${err.message}`, err.stack);
  } finally {
    progressBar.classList.remove('active');
  }
}

async function fetchLatestVideosForChannels(channels, apiKey) {
  const promises = channels.map(async (c) => {
    if (!c.uploadsPlaylistId) return;
    try {
      const data = await ytFetch('playlistItems', {
        part: 'snippet,contentDetails',
        playlistId: c.uploadsPlaylistId,
        maxResults: 1,
        key: apiKey,
      });
      const item = data.items?.[0];
      if (!item) return;
      const videoId = item.contentDetails?.videoId
        || item.snippet?.resourceId?.videoId;
      c.latestVideo = {
        videoId,
        title: decodeHtml(item.snippet.title),
        thumbnail: item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url || '',
        publishedAt: item.snippet.publishedAt,
      };
      c.lastUploadAt = item.snippet.publishedAt;
    } catch (err) {
      // 개별 실패 무시
    }
  });
  await Promise.all(promises);
}

function sortChannels() {
  const { key, dir } = currentChannelSort;
  displayChannels.sort((a, b) => {
    let av, bv;
    if (key === 'publishedAt' || key === 'lastUploadAt') {
      av = a[key] ? new Date(a[key]).getTime() : -Infinity;
      bv = b[key] ? new Date(b[key]).getTime() : -Infinity;
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
    // 최근 영상 썸네일
    const latest = c.latestVideo;
    const latestThumbHtml = latest && latest.thumbnail
      ? `<a class="channel-latest-thumb" href="https://www.youtube.com/watch?v=${escapeHtml(latest.videoId)}" target="_blank" rel="noopener" title="${escapeHtml(latest.title)}">
           <img src="${latest.thumbnail}" alt="" loading="lazy" />
         </a>`
      : `<div class="channel-latest-thumb-empty">로딩 중</div>`;
    // 마지막 업로드일
    const lastUpload = c.lastUploadAt
      ? `<div class="last-upload-cell">
           <span class="last-upload-date">${fmtDate(c.lastUploadAt)}</span>
           <span class="last-upload-ago">${timeAgo(new Date(c.lastUploadAt).getTime())}</span>
         </div>`
      : `<div class="last-upload-cell"><span class="dash-text">-</span></div>`;
    return `
      <tr>
        <td class="cb"><input type="checkbox" data-channel-id="${escapeHtml(c.channelId)}" /></td>
        <td class="channel-avatar-cell">${latestThumbHtml}</td>
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
        <td>${lastUpload}</td>
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
async function openChannelDetailById(channelId) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showError('채널 정보를 가져오려면 YouTube API 키가 필요합니다.\n우상단 🔑 API 키에서 등록하세요.');
    return;
  }
  showToast('채널 정보 로딩 중...');
  try {
    const data = await ytFetch('channels', {
      part: 'snippet,statistics,contentDetails',
      id: channelId,
      key: apiKey,
    });
    const c = data.items?.[0];
    if (!c) {
      showError('채널을 찾을 수 없습니다.\n삭제되었거나 비공개 채널일 수 있습니다.');
      return;
    }
    const subs = num(c.statistics?.subscriberCount);
    const views = num(c.statistics?.viewCount);
    const videoCount = num(c.statistics?.videoCount);
    const publishedAt = c.snippet?.publishedAt || '';
    const days = publishedAt ? Math.max(1, daysSince(publishedAt)) : 1;
    const avgViewPerVideo = videoCount > 0 ? views / videoCount : 0;
    const viewToSubRatio = views > 0 ? (subs / views) * 100 : null;
    const dailySubGrowth = days > 0 ? subs / days : null;
    const videoPerformance = subs > 0 ? avgViewPerVideo / subs : null;
    const growthSpeed = days > 0 ? views / days : null;

    const channel = {
      channelId: c.id,
      name: decodeHtml(c.snippet?.title || ''),
      description: decodeHtml(c.snippet?.description || ''),
      thumbnail: c.snippet?.thumbnails?.medium?.url
        || c.snippet?.thumbnails?.default?.url || '',
      country: c.snippet?.country || '',
      customUrl: c.snippet?.customUrl || '',
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads || '',
      latestVideo: null,
      lastUploadAt: null,
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
    savedListModal.classList.add('hidden'); // 저장 목록 모달 닫기
    openChannelDetail(channel);
  } catch (err) {
    showError(`채널 정보 로딩 실패:\n${err.message}`, err.stack);
  }
}

async function openChannelDetail(channel) {
  currentChannelDetail = { channel, latest: null, popular: { videos: null, shorts: null }, avgLikes: null, timelineVideos: null, timelineRange: 365 };
  currentLatestSort = 'date_desc';
  channelDetailModal.querySelectorAll('.latest-sort-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lsort === 'date_desc'));
  populateChannelInfoTab(channel);
  // 도넛 차트 초기화
  const lv = $('cdLongViews'); const sv = $('cdShortViews');
  if (lv) lv.textContent = '-';
  if (sv) sv.textContent = '-';
  const dLong = $('cdDonutLong'); const dShort = $('cdDonutShort');
  if (dLong) { dLong.style.strokeDasharray = '0 220'; }
  if (dShort) { dShort.style.strokeDasharray = '0 220'; }
  const hint = $('cdLSHint');
  if (hint) hint.textContent = '최신업로드 탭을 클릭하면 표시됩니다';
  loadChannelTimeline();
  // 저장 토글 상태 동기화
  const btn = $('cdSaveToggle');
  if (btn) {
    const isSaved = savedChannelIds.has(channel.channelId);
    btn.classList.toggle('saved', isSaved);
    btn.textContent = isSaved ? '★' : '☆';
    btn.title = isSaved ? '채널 저장 해제' : '채널 저장';
  }
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

async function loadChannelTimeline() {
  if (!currentChannelDetail) return;
  const grid = $('channelTimelineChart');
  if (!grid) return;
  grid.innerHTML = '<p class="loading-text">로딩 중...</p>';
  try {
    const apiKey = getApiKey();
    if (!apiKey) { grid.innerHTML = '<p class="empty-text">API 키 필요</p>'; return; }
    const playlistId = await getUploadsPlaylistId(currentChannelDetail.channel.channelId, apiKey);
    if (!playlistId) { grid.innerHTML = '<p class="empty-text">업로드 정보 없음</p>'; return; }
    // 최근 50개 가져오기
    const data = await ytFetch('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId, maxResults: 50, key: apiKey,
    });
    const ids = (data.items || []).map(it => it.contentDetails.videoId).filter(Boolean);
    if (!ids.length) { grid.innerHTML = '<p class="empty-text">영상 없음</p>'; return; }
    const stats = await fetchInBatches('videos', { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const videos = (data.items || []).map(it => {
      const id = it.contentDetails.videoId;
      const s = statsMap[id] || {};
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      return {
        videoId: id,
        title: decodeHtml(it.snippet.title),
        viewCount: num(s.statistics?.viewCount),
        publishedAt: it.snippet.publishedAt,
        isShorts: durationSec > 0 && durationSec <= 180,
      };
    });
    currentChannelDetail.timelineVideos = videos;
    drawChannelTimeline(videos, currentChannelDetail.timelineRange);
  } catch (err) {
    grid.innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadDetailChannelTimeline() {
  if (!currentDetail) return;
  const el = $('detailChannelTimelineChart');
  if (!el) return;
  if (currentDetail.timelineVideos) {
    drawChannelTimeline(currentDetail.timelineVideos, currentDetail.timelineRange, null, el);
    return;
  }
  el.innerHTML = '<p class="loading-text">로딩 중...</p>';
  try {
    const apiKey = getApiKey();
    if (!apiKey) { el.innerHTML = '<p class="empty-text">API 키 필요</p>'; return; }
    const playlistId = currentDetail.result.uploadsPlaylistId
      || await getUploadsPlaylistId(currentDetail.result.channelId, apiKey);
    if (!playlistId) { el.innerHTML = '<p class="empty-text">업로드 정보 없음</p>'; return; }
    const data = await ytFetch('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: 50, key: apiKey });
    const ids = (data.items || []).map(it => it.contentDetails.videoId).filter(Boolean);
    if (!ids.length) { el.innerHTML = '<p class="empty-text">영상 없음</p>'; return; }
    const stats = await fetchInBatches('videos', { part: 'statistics,contentDetails' }, ids, apiKey);
    const statsMap = mapBy(stats, 'id');
    const videos = (data.items || []).map(it => {
      const id = it.contentDetails.videoId;
      const s = statsMap[id] || {};
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      return { videoId: id, title: decodeHtml(it.snippet.title), viewCount: num(s.statistics?.viewCount), publishedAt: it.snippet.publishedAt, isShorts: durationSec > 0 && durationSec <= 180 };
    });
    if (currentDetail) { currentDetail.timelineVideos = videos; }
    drawChannelTimeline(videos, currentDetail?.timelineRange || 365, null, el);
  } catch (err) {
    if (el) el.innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

function drawChannelTimeline(videos, rangeDays, zoom, targetEl) {
  const grid = targetEl || $('channelTimelineChart');
  if (!grid) return;
  const now = Date.now();
  const firstUpload = Math.min(...videos.map(v => new Date(v.publishedAt).getTime()));

  // 표시 범위 결정
  let minDate, maxDate;
  if (zoom) {
    minDate = zoom.start;
    maxDate = zoom.end;
  } else {
    // range가 첫 업로드 이전이면 첫 업로드일부터 시작 (앞 공백 제거)
    const rangeStart = rangeDays === 'all' ? firstUpload : (now - rangeDays * 86400000);
    minDate = Math.max(rangeStart, firstUpload);
    maxDate = now;
  }

  const filtered = videos.filter(v => {
    const ts = new Date(v.publishedAt).getTime();
    return ts >= minDate && ts <= maxDate;
  });
  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-text">선택한 기간/줌 범위에 영상이 없습니다</p>';
    return;
  }
  filtered.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

  const W = 800, H = 320;
  const pad = { left: 20, right: 65, top: 24, bottom: 60 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const dateRange = Math.max(1, maxDate - minDate);
  const maxView = Math.max(1, ...filtered.map(v => v.viewCount));

  const points = filtered.map(v => {
    const ts = new Date(v.publishedAt).getTime();
    const t = (ts - minDate) / dateRange;
    const f = v.viewCount / maxView;
    return {
      x: pad.left + t * cw,
      y: pad.top + ch - f * ch,
      viewCount: v.viewCount,
      isShorts: v.isShorts,
      title: v.title,
      videoId: v.videoId,
      date: ts,
    };
  });

  let path = '';
  for (let i = 0; i < points.length; i++) {
    path += (i === 0 ? 'M' : ' L') + points[i].x.toFixed(1) + ',' + points[i].y.toFixed(1);
  }

  // Y 라벨
  const yLabels = [0, 0.25, 0.5, 0.75, 1];
  // X 라벨 (날짜 5개)
  const xLabelCount = 5;
  const xLabels = [];
  for (let i = 0; i < xLabelCount; i++) {
    const f = i / (xLabelCount - 1);
    const ts = minDate + dateRange * f;
    const date = new Date(ts);
    const y = String(date.getFullYear()).slice(2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    xLabels.push({ f, label: `${y}.${m}.${d}` });
  }

  grid.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yLabels.map(f => {
        const y = pad.top + ch * (1 - f);
        return `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>`;
      }).join('')}
      <path d="${path} L${points[points.length-1].x.toFixed(1)},${(pad.top + ch).toFixed(1)} L${points[0].x.toFixed(1)},${(pad.top + ch).toFixed(1)} Z" fill="url(#timelineGrad)"/>
      <path d="${path}" stroke="#ef4444" stroke-width="2" fill="none" stroke-linejoin="round"/>
      ${points.map(p => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${p.isShorts ? '#a855f7' : '#ef4444'}" stroke="var(--bg)" stroke-width="2">
          <title>${escapeHtml(p.title)}
조회수 ${fmtCompact(p.viewCount)} · ${new Date(p.date).toISOString().slice(0,10)}</title>
        </circle>
      `).join('')}
      ${yLabels.map(f => {
        const y = pad.top + ch * (1 - f);
        return `<text x="${W - pad.right + 6}" y="${(y + 4).toFixed(1)}" font-size="11" fill="currentColor" fill-opacity="0.6" font-family="sans-serif">${fmtCompact(Math.round(maxView * f))}</text>`;
      }).join('')}
      ${xLabels.map(item => {
        const x = pad.left + cw * item.f;
        return `<text x="${x.toFixed(1)}" y="${pad.top + ch + 18}" font-size="10" fill="currentColor" fill-opacity="0.6" text-anchor="${item.f === 0 ? 'start' : (item.f === 1 ? 'end' : 'middle')}" font-family="sans-serif">${item.label}</text>`;
      }).join('')}
      <!-- 업로드 마커 (X축 아래) -->
      ${points.map(p => `
        <rect x="${(p.x - 2).toFixed(1)}" y="${(pad.top + ch + 28).toFixed(1)}" width="4" height="10" fill="${p.isShorts ? '#a855f7' : '#ef4444'}" rx="1" opacity="0.7">
          <title>업로드: ${new Date(p.date).toISOString().slice(0,10)} · ${escapeHtml(p.title)}</title>
        </rect>
      `).join('')}
      <text x="${pad.left}" y="${pad.top + ch + 52}" font-size="10" fill="currentColor" fill-opacity="0.5" font-family="sans-serif">업로드 시점</text>
    </svg>
  `;
}

function handleTimelineZoom(e, svg, targetEl, ctx) {
  const state = ctx || currentChannelDetail;
  if (!state) return;
  const videos = state.timelineVideos;
  const rect = svg.getBoundingClientRect();
  const W = 800;
  const pad = { left: 20, right: 65 };
  const cw = W - pad.left - pad.right;
  const mouseX = (e.clientX - rect.left) / rect.width * W;
  const now = Date.now();
  const firstUpload = Math.min(...videos.map(v => new Date(v.publishedAt).getTime()));
  const z = state.timelineZoom;
  let start, end;
  if (z) { start = z.start; end = z.end; }
  else {
    const r = state.timelineRange;
    const rangeStart = r === 'all' ? firstUpload : (now - r * 86400000);
    start = Math.max(rangeStart, firstUpload);
    end = now;
  }
  const dataX = start + Math.max(0, (mouseX - pad.left)) / cw * (end - start);
  const factor = e.deltaY < 0 ? 0.8 : 1.25;
  let newStart = dataX - (dataX - start) * factor;
  let newEnd = dataX + (end - dataX) * factor;
  const absMin = firstUpload;
  const absMax = now;
  const minSpan = 86400000;
  if (newEnd - newStart < minSpan) return;
  if (newStart < absMin) { const w = newEnd - newStart; newStart = absMin; newEnd = Math.min(absMax, newStart + w); }
  if (newEnd > absMax) { const w = newEnd - newStart; newEnd = absMax; newStart = Math.max(absMin, newEnd - w); }
  if (newStart >= newEnd) return;
  if (newStart <= absMin && newEnd >= absMax) {
    state.timelineZoom = null;
  } else {
    state.timelineZoom = { start: newStart, end: newEnd };
  }
  drawChannelTimeline(videos, state.timelineRange, state.timelineZoom, targetEl || $('channelTimelineChart'));
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
    const ch = currentChannelDetail.channel;
    const chSubs = ch.subscribers || 0;
    const chAvg = ch.avgViewPerVideo || 0;
    const items = (data.items || []).map(it => {
      const id = it.contentDetails.videoId;
      const s = statsMap[id] || {};
      const durationSec = parseDurationSec(s.contentDetails?.duration);
      const viewCount = num(s.statistics?.viewCount);
      const publishedAt = it.snippet.publishedAt;
      const hours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 3600000);
      const vph = viewCount / hours;
      const performance = chSubs > 0 ? viewCount / chSubs : null;
      const contribution = chAvg > 0 ? viewCount / chAvg : null;
      return {
        videoId: id,
        title: decodeHtml(it.snippet.title),
        thumbnail: it.snippet.thumbnails?.medium?.url
          || it.snippet.thumbnails?.default?.url || '',
        viewCount,
        likeCount: num(s.statistics?.likeCount),
        commentCount: num(s.statistics?.commentCount),
        publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
        vph,
        performance,
        performanceTier: rateTier(performance, [0.3, 1, 3, 10]),
        contribution,
        contributionTier: rateTier(contribution, [0.3, 1, 3, 10]),
      };
    });
    currentChannelDetail.latest = items;
    renderMiniGrid(grid, sortLatestItems(items));
    renderLSChart(items);
  } catch (err) {
    grid.innerHTML = `<p class="empty-text">오류: ${escapeHtml(err.message)}</p>`;
  }
}

function renderLSChart(items) {
  const longEl = $('cdLongViews');
  const shortEl = $('cdShortViews');
  const hintEl = $('cdLSHint');
  const donutLong = $('cdDonutLong');
  const donutShort = $('cdDonutShort');
  if (!longEl || !donutLong) return;

  const longs = items.filter(v => !v.isShorts);
  const shorts = items.filter(v => v.isShorts);
  const longViews = longs.reduce((s, v) => s + (v.viewCount || 0), 0);
  const shortViews = shorts.reduce((s, v) => s + (v.viewCount || 0), 0);
  const total = longViews + shortViews;

  longEl.textContent = fmtCompact(longViews);
  shortEl.textContent = fmtCompact(shortViews);

  if (total === 0) {
    hintEl.textContent = '조회수 데이터 없음';
    return;
  }

  hintEl.textContent = `최근 ${items.length}개 영상 기준 (롱 ${longs.length}개 · Shorts ${shorts.length}개)`;

  const C = 2 * Math.PI * 35; // circumference ≈ 219.9
  const GAP = 3;
  const longPct = longViews / total;
  const shortsPct = 1 - longPct;
  const longDash = Math.max(0, longPct * C - GAP);
  const shortsDash = Math.max(0, shortsPct * C - GAP);
  const startOffset = C * 0.25; // rotate to 12 o'clock

  donutLong.style.strokeDasharray = `${longDash} ${C - longDash}`;
  donutLong.style.strokeDashoffset = startOffset;

  donutShort.style.strokeDasharray = `${shortsDash} ${C - shortsDash}`;
  donutShort.style.strokeDashoffset = startOffset - longDash - GAP;
}

function sortLatestItems(items) {
  const arr = [...items];
  switch (currentLatestSort) {
    case 'date_asc':
      arr.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      break;
    case 'views_desc':
      arr.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      break;
    case 'views_asc':
      arr.sort((a, b) => (a.viewCount || 0) - (b.viewCount || 0));
      break;
    case 'vph_desc':
      arr.sort((a, b) => (b.vph || 0) - (a.vph || 0));
      break;
    default: // date_desc
      arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
  return arr;
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
      const publishedAt = v.snippet.publishedAt;
      const hours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 3600000);
      const vph = views / hours;
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
        publishedAt,
        duration: formatDuration(durationSec),
        isShorts: durationSec > 0 && durationSec <= 180,
        vph,
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
  grid.innerHTML = items.map(it => {
    const isSaved = savedVideoIds.has(it.videoId);
    return `
    <div class="top10-item" style="position:relative">
      <a class="top10-thumb" href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener">
        <img src="${it.thumbnail}" alt="" loading="lazy" />
        ${it.vph != null ? `<span class="mini-vph-chip vph-tier-${vphTier(it.vph)}" style="position:absolute;bottom:4px;left:4px;font-size:10px">${fmtVPHShort(it.vph)} VPH</span>` : ''}
        ${it.duration ? `<span class="duration-overlay">${it.duration}</span>` : ''}
      </a>
      <button class="mini-save-btn ${isSaved ? 'saved' : ''}" data-mini-save="${escapeHtml(it.videoId)}" type="button" title="${isSaved ? '저장 해제' : '저장'}" style="top:6px; right:auto; left:6px">${isSaved ? '★' : '☆'}</button>
      <a href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener" style="text-decoration:none; color:inherit; display:contents">
        <div class="top10-info">
          <h5>${escapeHtml(it.title)}</h5>
          <div class="top10-info-meta">${fmtCompact(it.viewCount)} views · ${fmtDate(it.publishedAt)}</div>
        </div>
        <div class="top10-stat">
          <div class="top10-stat-label">VPH</div>
          ${it.vph != null ? `<span class="mini-vph-chip vph-tier-${vphTier(it.vph)}">${fmtVPHShort(it.vph)}</span>` : '<span style="color:var(--gray-400)">-</span>'}
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
    </div>
  `;
  }).join('');
}

function findMiniVideoInfo(videoId) {
  const sources = [
    currentDetail?.recent, currentDetail?.popular,
    currentChannelDetail?.latest,
    currentChannelDetail?.popular?.videos, currentChannelDetail?.popular?.shorts,
    savedVideos,
  ];
  for (const arr of sources) {
    if (!Array.isArray(arr)) continue;
    const found = arr.find(it => it.videoId === videoId);
    if (found) {
      // 채널 정보 보충 (mini 카드는 channelId 없을 수도)
      const channelCtx = currentDetail?.result || currentChannelDetail?.channel;
      return {
        videoId: found.videoId,
        title: found.title,
        thumbnail: found.thumbnail,
        duration: found.duration,
        viewCount: found.viewCount,
        publishedAt: found.publishedAt,
        isShorts: found.isShorts,
        isPortrait: found.isPortrait,
        channelId: found.channelId || channelCtx?.channelId,
        channelTitle: found.channelTitle || channelCtx?.channelTitle || channelCtx?.name,
      };
    }
  }
  return null;
}

function fmtMultiplier(val) {
  if (val == null) return null;
  return val >= 100 ? '>100x' : (val >= 10 ? Math.round(val) + 'x' : val.toFixed(1) + 'x');
}

function miniCardHtml(it, isPortrait) {
  const isSaved = savedVideoIds.has(it.videoId);
  const vph = it.vph != null ? it.vph
    : (it.viewCount && it.publishedAt
        ? it.viewCount / Math.max(1, (Date.now() - new Date(it.publishedAt).getTime()) / 3600000)
        : null);
  const perfStr = fmtMultiplier(it.performance);
  const contribStr = fmtMultiplier(it.contribution);
  const hasStats = vph != null || perfStr || contribStr;
  return `
    <div class="result-card${isPortrait ? ' result-card-portrait' : ''}" data-mini-id="${escapeHtml(it.videoId)}">
      <a class="card-thumb" href="https://www.youtube.com/watch?v=${it.videoId}" target="_blank" rel="noopener">
        <img src="${it.thumbnail}" alt="" loading="lazy" />
        ${vph != null ? `<span class="mini-vph-chip vph-tier-${vphTier(vph)}">${fmtVPHShort(vph)} VPH</span>` : ''}
        ${it.duration ? `<span class="duration-overlay">${it.duration}</span>` : ''}
      </a>
      <button class="mini-save-btn ${isSaved ? 'saved' : ''}" data-mini-save="${escapeHtml(it.videoId)}" type="button" title="${isSaved ? '저장 해제' : '저장'}">${isSaved ? '★' : '☆'}</button>
      <div class="card-info">
        <h3 class="card-title">${escapeHtml(it.title)}</h3>
        <div class="card-meta">${fmtCompact(it.viewCount)} views · ${fmtDate(it.publishedAt)}${it.likeCount ? ` · 좋아요 ${fmtCompact(it.likeCount)}` : ''}</div>
        ${hasStats ? `<div class="mini-stats-row">
          ${perfStr ? `<span class="mini-stat-badge mult-${it.performanceTier || multTier(it.performance)}">성과도 ${perfStr}</span>` : ''}
          ${contribStr ? `<span class="mini-stat-badge mult-${it.contributionTier || multTier(it.contribution)}">기여도 ${contribStr}</span>` : ''}
        </div>` : ''}
      </div>
    </div>
  `;
}

function buildSearchParams(q) {
  // 페이지네이션을 호출 측에서 처리하므로 페이지당 50으로 캡
  const p = {
    part: 'snippet',
    type: 'video',
    maxResults: 50,
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
  trackQuota(endpoint);
  return data;
}

function trackQuota(endpoint) {
  const today = new Date().toLocaleDateString('en-CA');
  let usage;
  try { usage = JSON.parse(localStorage.getItem(LS_KEY_QUOTA)); } catch (_) {}
  if (!usage || usage.date !== today) usage = { date: today, total: 0, breakdown: {} };
  const cost = ENDPOINT_COSTS[endpoint] || 1;
  usage.total += cost;
  usage.breakdown[endpoint] = (usage.breakdown[endpoint] || 0) + cost;
  localStorage.setItem(LS_KEY_QUOTA, JSON.stringify(usage));
}

/* ───────── 키워드 분석 탭 ─────────
 * YouTube Data API는 검색량/경쟁도를 직접 제공하지 않는다.
 * 대신 해당 키워드로 검색되는 상위 25개 영상의 조회수(→검색량 추정)와
 * 그 영상들을 올린 채널의 구독자수(→경쟁도 추정)를 로그 스케일로
 * 정규화해서 0-100 점수/등급을 만든다. VidIQ류 실제 검색 트래픽
 * 데이터와는 다른, 어디까지나 YouTube API 기반 추정치다.
 */
const KW_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'in', 'on', 'at', 'is', 'are',
  'how', 'what', 'best', 'top', 'you', 'your', 'this', 'that', 'it', 'be', 'by', 'from', 'vs',
  '이', '그', '저', '것', '수', '등', '및', '를', '을', '은', '는', '이렇게', '어떻게', '하는', '하기', '방법', '추천',
]);

function tokenizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !KW_STOPWORDS.has(w));
}

// 원 키워드 검색 결과 제목들에서 자주 같이 등장하는 단어를 관련 키워드 후보로 추출
function extractRelatedTerms(titles, keyword, limit) {
  const kwWords = new Set(tokenizeTitle(keyword));
  const freq = {};
  titles.forEach(title => {
    const seen = new Set();
    tokenizeTitle(title).forEach(w => {
      if (kwWords.has(w) || seen.has(w)) return;
      seen.add(w);
      freq[w] = (freq[w] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function kwVolumeScore(avgViews) {
  if (avgViews <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(Math.log10(avgViews + 1) / Math.log10(200000) * 100)));
}
function kwVolumeLabel(avgViews) {
  const tier = rateTier(avgViews, [750, 5000, 30000, 150000]);
  const labels = { worst: 'Very low', bad: 'Low', normal: 'Medium', good: 'High', great: 'Very high' };
  return { tier, label: labels[tier] || '-' };
}

function kwCompetitionScore(avgSubs) {
  if (avgSubs <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(Math.log10(avgSubs + 1) / Math.log10(20000000) * 100)));
}
function kwCompetitionLabel(avgSubs) {
  // rateTier의 worst(구독자 적음)=경쟁 낮음(좋음), great(구독자 많음)=경쟁 높음(나쁨) → 톤 반전
  const rawTier = rateTier(avgSubs, [10000, 100000, 500000, 3000000]);
  const toneMap = { worst: 'great', bad: 'good', normal: 'normal', good: 'bad', great: 'worst' };
  const labelMap = { worst: 'Very low', bad: 'Low', normal: 'Medium', good: 'High', great: 'Very high' };
  return { tier: toneMap[rawTier] || 'normal', label: labelMap[rawTier] || '-' };
}

function kwScoreBadge(label, tier) {
  return `<span class="mult-badge mult-inline mult-${tier}">${escapeHtml(label)}</span>`;
}

const KW_TIER_BAR_COLOR = {
  great: '#22c55e', good: '#3b82f6', normal: '#fbbf24', bad: '#f87171', worst: '#ef4444',
};
function kwScoreBar(score, tier) {
  const color = KW_TIER_BAR_COLOR[tier] || '#9ca3af';
  const pct = Math.max(0, Math.min(100, score));
  return `<div class="kw-score-bar"><div class="kw-score-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

async function analyzeKeyword(term, apiKey) {
  const searchData = await ytFetch('search', {
    part: 'snippet', q: term, type: 'video', order: 'relevance', maxResults: 25, key: apiKey,
  });
  const items = searchData.items || [];
  const videoIds = items.map(it => it.id?.videoId).filter(Boolean);
  const channelIds = [...new Set(items.map(it => it.snippet?.channelId).filter(Boolean))];

  const [videoStats, channelStats] = await Promise.all([
    fetchInBatches('videos', { part: 'statistics' }, videoIds, apiKey),
    fetchInBatches('channels', { part: 'statistics' }, channelIds, apiKey),
  ]);

  const avgViews = videoStats.length
    ? videoStats.reduce((s, v) => s + num(v.statistics?.viewCount), 0) / videoStats.length
    : 0;
  const avgSubs = channelStats.length
    ? channelStats.reduce((s, c) => s + num(c.statistics?.subscriberCount), 0) / channelStats.length
    : 0;

  const vol = kwVolumeLabel(avgViews);
  const volScore = kwVolumeScore(avgViews);
  const comp = kwCompetitionLabel(avgSubs);
  const compScore = kwCompetitionScore(avgSubs);
  const overall = Math.round(volScore * 0.5 + (100 - compScore) * 0.5);

  return {
    keyword: term,
    titles: items.map(it => it.snippet?.title || ''),
    avgViews, avgSubs, volScore, volTier: vol.tier, volLabel: vol.label,
    compScore, compTier: comp.tier, compLabel: comp.label,
    overall,
    wordCount: term.trim().split(/\s+/).filter(Boolean).length,
  };
}

let kwRunToken = 0; // 새 검색이 시작되면 이전 요청 결과를 버리기 위한 토큰

async function runKeywordAnalysisFor(keyword) {
  kwAnalysisInput.value = keyword;
  await onKeywordAnalysisSearch();
}

async function onKeywordAnalysisSearch() {
  const keyword = kwAnalysisInput.value.trim();
  if (!keyword) return;
  const apiKey = getApiKey();
  if (!apiKey) { showToast('API 키를 먼저 등록하세요 (우상단 🔑)'); return; }

  const runToken = ++kwRunToken;
  kwEmpty.hidden = true;
  kwResults.hidden = true;
  kwLoading.hidden = false;

  try {
    const primary = await analyzeKeyword(keyword, apiKey);
    const candidates = extractRelatedTerms(primary.titles, keyword, 5);

    const related = [];
    for (const { word, count } of candidates) {
      try {
        const r = await analyzeKeyword(word, apiKey);
        r.relatedScore = Math.round((count / primary.titles.length) * 100) / 10;
        related.push(r);
      } catch (_) { /* 개별 관련 키워드 실패는 건너뜀 */ }
    }

    if (runToken !== kwRunToken) return; // 그 사이 새 검색이 시작됐으면 버림
    pushHistory(keyword);
    renderKeywordResults(primary, related);
  } catch (err) {
    if (runToken !== kwRunToken) return;
    kwLoading.hidden = true;
    kwEmpty.hidden = false;
    kwEmpty.textContent = `오류: ${err.message}`;
  }
}

/* ───────── 즐겨찾기 키워드 ───────── */
function getSavedKeywords() {
  try { return JSON.parse(localStorage.getItem(LS_KEY_SAVED_KEYWORDS) || '[]'); }
  catch { return []; }
}
function isKeywordSaved(kw) {
  return getSavedKeywords().some(x => x.keyword === kw);
}
function toggleKeywordFavorite(kw, scores) {
  if (!kw) return;
  let saved = getSavedKeywords();
  if (saved.some(x => x.keyword === kw)) {
    saved = saved.filter(x => x.keyword !== kw);
    showToast('☆ 즐겨찾기 해제됨');
  } else {
    saved.unshift({ keyword: kw, at: Date.now(), ...(scores || {}) });
    showToast('⭐ 즐겨찾기 추가됨');
  }
  localStorage.setItem(LS_KEY_SAVED_KEYWORDS, JSON.stringify(saved));
  renderKwFavorites();
  renderKeywordTableFavStates();
}
function renderKwFavorites() {
  const saved = getSavedKeywords();
  kwFavRow.hidden = saved.length === 0;
  kwFavChips.innerHTML = saved.map(item => `
    <span class="chip">
      ${escapeHtml(item.keyword)}
      <span class="chip-x" data-kw="${escapeHtml(item.keyword)}">×</span>
    </span>
  `).join('');
  kwFavChips.querySelectorAll('.chip-x').forEach(x => {
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKeywordFavorite(x.dataset.kw);
    });
  });
  kwFavChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-x')) return;
      runKeywordAnalysisFor(chip.querySelector('.chip-x').dataset.kw);
    });
  });
  if (!kwFavModal.classList.contains('hidden')) renderKwFavModal();
}
// 결과 테이블이 이미 그려진 상태에서 즐겨찾기만 바뀌었을 때 별 아이콘만 갱신
function renderKeywordTableFavStates() {
  kwTableBody.querySelectorAll('.kw-row-fav').forEach(btn => {
    const active = isKeywordSaved(btn.dataset.kw);
    btn.classList.toggle('active', active);
    btn.textContent = active ? '★' : '☆';
  });
}

function openKwFavModal() {
  renderKwFavModal();
  kwFavModal.classList.remove('hidden');
}

function renderKwFavModal() {
  const saved = getSavedKeywords();
  kwFavModalCount.textContent = saved.length;
  kwFavModalHint.textContent = saved.length
    ? '클릭하면 그 키워드로 다시 분석합니다.'
    : '즐겨찾기한 키워드가 없습니다. 검색 결과 테이블의 ☆ 버튼으로 추가하세요.';
  kwFavModalList.innerHTML = saved.map(item => {
    const hasScores = item.overall != null;
    const scoreChips = hasScores ? `
      <div class="kw-fav-scores">
        ${kwScoreBadge(item.volLabel, item.volTier)}
        ${kwScoreBadge(item.compLabel, item.compTier)}
        ${kwScoreBadge(item.overall, overallTier(item.overall))}
      </div>` : '';
    return `
    <div class="history-item" data-kw="${escapeHtml(item.keyword)}">
      <div class="history-item-info">
        <div class="history-item-q">${escapeHtml(item.keyword)}</div>
        ${scoreChips}
        <div class="history-item-meta">${item.at ? timeAgo(item.at) : ''}</div>
      </div>
      <button class="history-item-remove" data-remove="${escapeHtml(item.keyword)}" title="삭제">×</button>
    </div>`;
  }).join('');
  kwFavModalList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.history-item-remove')) return;
      kwFavModal.classList.add('hidden');
      runKeywordAnalysisFor(el.dataset.kw);
    });
  });
  kwFavModalList.querySelectorAll('.history-item-remove').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKeywordFavorite(b.dataset.remove);
    });
  });
}

function clearAllKwFav() {
  if (!confirm('즐겨찾기한 키워드를 모두 삭제하시겠습니까?')) return;
  localStorage.setItem(LS_KEY_SAVED_KEYWORDS, '[]');
  renderKwFavorites();
  renderKeywordTableFavStates();
  renderKwFavModal();
  showToast('🗑 즐겨찾기 키워드 삭제됨');
}

function overallTier(score) {
  return score >= 60 ? 'great' : score >= 35 ? 'normal' : 'worst';
}
function overallLabel(score) {
  return score >= 60 ? 'High' : score >= 35 ? 'Medium' : 'Low';
}

function renderKeywordResults(primary, related) {
  kwLoading.hidden = true;
  kwResults.hidden = false;

  const oTier = overallTier(primary.overall);
  kwOverallEl.innerHTML = `${primary.overall} ${kwScoreBadge(overallLabel(primary.overall), oTier)}${kwScoreBar(primary.overall, oTier)}`;
  kwVolumeEl.innerHTML = `${fmt(Math.round(primary.avgViews))} ${kwScoreBadge(primary.volLabel, primary.volTier)}`;
  kwCompetitionEl.innerHTML = kwScoreBadge(primary.compLabel, primary.compTier);

  const rows = [{ ...primary, relatedScore: null }, ...related];
  kwTableBody.innerHTML = rows.map(r => `
    <tr>
      <td>
        <div class="kw-keyword-cell">
          <button type="button" class="kw-row-fav${isKeywordSaved(r.keyword) ? ' active' : ''}" data-kw="${escapeHtml(r.keyword)}" data-scores="${escapeHtml(JSON.stringify({ volLabel: r.volLabel, volTier: r.volTier, compLabel: r.compLabel, compTier: r.compTier, overall: r.overall, avgViews: r.avgViews }))}" title="즐겨찾기">${isKeywordSaved(r.keyword) ? '★' : '☆'}</button>
          <button type="button" class="kw-keyword-link" data-kw="${escapeHtml(r.keyword)}">${escapeHtml(r.keyword)}</button>
        </div>
      </td>
      <td class="num">${r.relatedScore === null ? '<span class="dash-text">-</span>' : r.relatedScore}</td>
      <td class="num">${fmt(Math.round(r.avgViews))}</td>
      <td class="num">${kwScoreBadge(r.compLabel, r.compTier)}</td>
      <td class="num">${kwScoreBadge(r.overall, overallTier(r.overall))}</td>
      <td class="num">${r.wordCount}</td>
    </tr>
  `).join('');
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
  // isPortrait (썸네일 native aspect 기반)로 분리. fallback: isShorts
  const isPortraitOf = r => (r.isPortrait !== undefined ? r.isPortrait : r.isShorts);
  const landscape = displayResults.filter(r => !isPortraitOf(r));
  const shorts = displayResults.filter(r => isPortraitOf(r));

  const sections = [];
  if (landscape.length) {
    sections.push(`
      <section class="card-section">
        <h3 class="card-section-title">📺 일반 영상 <span class="section-count">${landscape.length}개</span></h3>
        <div class="card-grid-landscape">
          ${landscape.map(r => cardHtml(r, false)).join('')}
        </div>
      </section>
    `);
  }
  if (shorts.length) {
    sections.push(`
      <section class="card-section">
        <h3 class="card-section-title">📱 Shorts <span class="section-count">${shorts.length}개</span></h3>
        <div class="card-grid-portrait">
          ${shorts.map(r => cardHtml(r, true)).join('')}
        </div>
      </section>
    `);
  }
  cardGrid.innerHTML = sections.join('');
}

function cardHtml(r, isPortrait) {
  return `
    <article class="result-card${isPortrait ? ' result-card-portrait' : ''}">
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
  `;
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
  $('viewStats').textContent  = statsLine(allResults.map(r => r.viewCount));
  $('subStats').textContent   = statsLine(allResults.map(r => r.subscriberCount));
  $('likeStats').textContent  = statsLine(allResults.map(r => r.likeCount));
  $('videoCountStats').textContent = statsLine(allResults.map(r => r.channelVideoCount));
  // 티어별 카운트
  updateTierCounts();
  updateFilterPreviewCount();
  filterModal.classList.remove('hidden');
}

function statsLine(arr) {
  const nums = arr.filter(v => typeof v === 'number' && !isNaN(v));
  if (!nums.length) return '데이터 없음';
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / nums.length);
  const sorted = [...nums].sort((a,b)=>a-b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return `합계: ${fmtCompact(sum)} · 평균: ${fmtCompact(avg)} · 중앙값: ${fmtCompact(median)}`;
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
    if (filters.videoCountMin !== null && r.channelVideoCount < filters.videoCountMin) return false;
    if (filters.videoCountMax !== null && r.channelVideoCount > filters.videoCountMax) return false;
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
  ['viewMin','viewMax','subMin','subMax','likeMin','likeMax','videoCountMin','videoCountMax','dateMin','dateMax'].forEach(id => { $(id).value = ''; });
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
  if (searchMode === 'keyword') {
    renderKwHistory();
    return;
  }
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

function renderKwHistory() {
  const top = getHistoryForMode().slice(0, 5);
  kwHistoryChips.innerHTML = top.map(item => `
    <span class="chip">
      ${escapeHtml(item.q)}
      <span class="chip-x" data-q="${escapeHtml(item.q)}">×</span>
    </span>
  `).join('');
  kwHistoryChips.querySelectorAll('.chip-x').forEach(x => {
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      removeHistory(x.dataset.q);
    });
  });
  kwHistoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip-x')) return;
      runKeywordAnalysisFor(chip.querySelector('.chip-x').dataset.q);
    });
  });
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
    // YouTube API 정렬 (relevance/date/viewCount): 조회 버튼 필요
    markSettingsDirty();
  }
}

function markSettingsDirty() {
  if (!hasSearched) return;
  const btn = $('settingsSearchBtn');
  if (!btn) return;
  btn.hidden = false;
  btn.classList.add('dirty');
}

function clearSettingsDirty() {
  const btn = $('settingsSearchBtn');
  if (btn) btn.classList.remove('dirty');
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
function vphTier(vph) {
  if (vph == null || isNaN(vph)) return 'minimal';
  if (vph >= 10000) return 'extreme';
  if (vph >= 1000) return 'high';
  if (vph >= 100) return 'mid';
  if (vph >= 10) return 'low';
  return 'minimal';
}

function fmtVPHShort(v) {
  if (v === null || v === undefined || isNaN(v)) return '-';
  if (v < 1) return v.toFixed(1);
  if (v < 1000) return Math.round(v).toLocaleString();
  if (v < 1e6) return (v/1000).toFixed(1) + 'k';
  return (v/1e6).toFixed(1) + 'M';
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
/* ───────── 데이터 백업/복원 ───────── */
async function exportData() {
  const data = {};
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('ytkw:')) continue;
    // 캐시는 제외 (재생성 가능, 용량 큼)
    if (k.startsWith('ytkw:summary:')) continue;
    if (k.startsWith('ytkw:aspect:')) continue;
    data[k] = localStorage.getItem(k);
    count++;
  }
  const payload = {
    _meta: {
      app: 'ytkeyword',
      version: 1,
      exportedAt: new Date().toISOString(),
      itemCount: count,
    },
    data,
  };
  const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  const filename = `ytkeyword-backup-${stamp}.json`;
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  if (window.showSaveFilePicker) {
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON 백업 파일', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // 사용자가 취소
    }
  }
  // fallback: 일반 다운로드
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast(`💾 ${count}개 항목 백업됨`);
}

function importData(file, mode) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const data = (parsed && typeof parsed.data === 'object') ? parsed.data : parsed;
      if (typeof data !== 'object' || Array.isArray(data) || !data) {
        showError('잘못된 백업 파일 형식입니다.');
        return;
      }
      const keys = Object.keys(data).filter(k => k.startsWith('ytkw:'));
      if (!keys.length) {
        showError('파일에서 ytkw 데이터를 찾을 수 없습니다.');
        return;
      }
      const meta = parsed._meta || {};
      const when = meta.exportedAt ? new Date(meta.exportedAt).toLocaleString('ko-KR') : '시점 미상';
      const modeLabel = mode === 'merge' ? '병합 (중복 제거 후 추가)' : '덮어쓰기 (기존 → 백업으로 교체)';
      if (!confirm(
        `백업 파일 정보:\n` +
        `· 항목 수: ${keys.length}개\n` +
        `· 백업 시점: ${when}\n` +
        `· 복원 방식: ${modeLabel}\n\n` +
        `계속할까요?`
      )) return;

      if (mode === 'merge') {
        mergeImportedData(data);
      } else {
        keys.forEach(k => {
          const v = data[k];
          if (typeof v === 'string') localStorage.setItem(k, v);
          else localStorage.setItem(k, JSON.stringify(v));
        });
      }
      showToast(`✅ ${mode === 'merge' ? '병합' : '복원'} 완료 — 1초 후 새로고침`);
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showError(`백업 파일을 읽을 수 없습니다.\n${err.message}`, err.stack);
    }
  };
  reader.onerror = () => showError('파일 읽기 실패');
  reader.readAsText(file);
}

/* ───────── GitHub Gist 동기화 ───────── */
function buildBackupPayload() {
  const data = {};
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('ytkw:')) continue;
    if (k.startsWith('ytkw:summary:') || k.startsWith('ytkw:aspect:')) continue;
    data[k] = localStorage.getItem(k);
    count++;
  }
  return { _meta: { app: 'ytkeyword', version: 1, exportedAt: new Date().toISOString(), itemCount: count }, data };
}

async function saveToGist() {
  const pat = ($('githubPatInput').value.trim()) || localStorage.getItem(LS_KEY_GITHUB_PAT);
  if (!pat) { showToast('GitHub PAT를 먼저 입력하세요'); return; }

  const btn = $('gistSaveBtn');
  btn.disabled = true;
  btn.textContent = '저장 중...';

  try {
    const gistId = localStorage.getItem(LS_KEY_GIST_ID);
    const headers = { Authorization: `token ${pat}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' };

    // 기존 Gist가 있으면 먼저 내려받아 로컬과 병합
    if (gistId) {
      btn.textContent = '병합 중...';
      try {
        const getRes = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
        if (getRes.ok) {
          const gistJson = await getRes.json();
          const fileContent = gistJson.files?.[GIST_FILENAME]?.content;
          if (fileContent) {
            const parsed = JSON.parse(fileContent);
            const gistData = parsed.data || parsed;
            if (typeof gistData === 'object' && !Array.isArray(gistData)) {
              mergeImportedData(gistData); // Gist 데이터를 로컬에 병합
            }
          }
        }
      } catch (_) { /* 병합 실패 시 로컬 데이터만으로 저장 진행 */ }
      btn.textContent = '저장 중...';
    }

    // 병합된 로컬 데이터로 페이로드 빌드
    const payload = buildBackupPayload();
    const body = { description: 'ytkeyword 데이터 백업', public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } } };

    const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
    const method = gistId ? 'PATCH' : 'POST';

    const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    localStorage.setItem(LS_KEY_GIST_ID, json.id);
    if (pat) localStorage.setItem(LS_KEY_GITHUB_PAT, pat);
    updateGistStatus();
    showToast(`☁️ Gist 병합 저장 완료 (${payload._meta.itemCount}개 항목)`);
  } catch (err) {
    showError(`Gist 저장 실패: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '☁️ Gist에 저장';
  }
}

async function loadFromGist() {
  const pat = ($('githubPatInput').value.trim()) || localStorage.getItem(LS_KEY_GITHUB_PAT);
  const gistId = localStorage.getItem(LS_KEY_GIST_ID);
  if (!pat) { showToast('GitHub PAT를 먼저 입력하세요'); return; }
  if (!gistId) { showToast('저장된 Gist가 없습니다. 먼저 저장해주세요'); return; }

  const btn = $('gistLoadBtn');
  btn.disabled = true;
  btn.textContent = '불러오는 중...';

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const fileContent = json.files?.[GIST_FILENAME]?.content;
    if (!fileContent) throw new Error('백업 파일을 찾을 수 없습니다');

    const parsed = JSON.parse(fileContent);
    const data = parsed.data || parsed;
    const keys = Object.keys(data).filter(k => k.startsWith('ytkw:'));
    if (!keys.length) throw new Error('유효한 데이터가 없습니다');

    const when = parsed._meta?.exportedAt ? new Date(parsed._meta.exportedAt).toLocaleString('ko-KR') : '시점 미상';
    if (!confirm(`Gist 백업 정보:\n· 항목 수: ${keys.length}개\n· 백업 시점: ${when}\n\n현재 데이터를 덮어쓸까요?`)) return;

    keys.forEach(k => {
      const v = data[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    showToast('✅ Gist에서 복원 완료 — 새로고침합니다');
    setTimeout(() => location.reload(), 1000);
  } catch (err) {
    showError(`Gist 불러오기 실패: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇️ Gist에서 불러오기';
  }
}

function parseMaybeJSON(s) {
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return null; }
}

function mergeImportedData(newData) {
  // 영상 저장 (videoId 기준 중복 제거, savedAt 더 최근 우선)
  mergeArrayById('ytkw:savedVideos', newData['ytkw:savedVideos'], 'videoId', 'savedAt');
  // 채널 저장 (channelId 기준)
  mergeArrayById('ytkw:savedChannels', newData['ytkw:savedChannels'], 'channelId', 'savedAt');
  // 즐겨찾기 키워드 (keyword 기준)
  mergeArrayById('ytkw:savedKeywords', newData['ytkw:savedKeywords'], 'keyword', 'at');
  // 차단 영상 (ID 배열, 합집합)
  mergeIdArray('ytkw:blockedVideos', newData['ytkw:blockedVideos']);
  // 차단 채널 (객체, 키 기준 merge)
  mergeObject('ytkw:blockedChannels', newData['ytkw:blockedChannels']);
  // 검색 기록 (q+mode 기준, count 합산, at 최신)
  mergeHistory(newData['ytkw:history']);
  // 요약 캐시 (있으면 합치기 — 충돌 시 새 파일 우선)
  Object.keys(newData).forEach(k => {
    if (k.startsWith('ytkw:summary:') && !localStorage.getItem(k)) {
      localStorage.setItem(k, newData[k]);
    }
    if (k.startsWith('ytkw:aspect:') && !localStorage.getItem(k)) {
      localStorage.setItem(k, newData[k]);
    }
  });
  // 설정값 — 기존이 없을 때만 새 값 사용 (현재 사용자 설정 존중)
  ['ytkw:apiKey','ytkw:geminiKey','ytkw:theme','ytkw:viewMode','ytkw:region','ytkw:mode','ytkw:features'].forEach(k => {
    if (!localStorage.getItem(k) && newData[k]) {
      localStorage.setItem(k, newData[k]);
    }
  });
}

function mergeArrayById(lsKey, newRaw, idField, dateField) {
  const newArr = parseMaybeJSON(newRaw);
  if (!Array.isArray(newArr)) return;
  const existingArr = parseMaybeJSON(localStorage.getItem(lsKey) || '[]') || [];
  const map = new Map();
  // 기존 먼저
  existingArr.forEach(it => { if (it && it[idField]) map.set(it[idField], it); });
  // 새로 추가 / 비교
  newArr.forEach(it => {
    if (!it || !it[idField]) return;
    if (!map.has(it[idField])) {
      map.set(it[idField], it);
    } else if (dateField && (it[dateField] || 0) > (map.get(it[idField])[dateField] || 0)) {
      map.set(it[idField], it);
    }
  });
  // 최신순 정렬 (dateField 기준)
  const merged = [...map.values()].sort((a, b) =>
    (b[dateField] || 0) - (a[dateField] || 0));
  localStorage.setItem(lsKey, JSON.stringify(merged));
}

function mergeIdArray(lsKey, newRaw) {
  const newArr = parseMaybeJSON(newRaw);
  if (!Array.isArray(newArr)) return;
  const existingArr = parseMaybeJSON(localStorage.getItem(lsKey) || '[]') || [];
  const set = new Set([...existingArr, ...newArr].filter(Boolean));
  localStorage.setItem(lsKey, JSON.stringify([...set]));
}

function mergeObject(lsKey, newRaw) {
  const newObj = parseMaybeJSON(newRaw);
  if (!newObj || typeof newObj !== 'object' || Array.isArray(newObj)) return;
  const existing = parseMaybeJSON(localStorage.getItem(lsKey) || '{}') || {};
  const merged = { ...existing, ...newObj };
  localStorage.setItem(lsKey, JSON.stringify(merged));
}

function mergeHistory(newRaw) {
  const newArr = parseMaybeJSON(newRaw);
  if (!Array.isArray(newArr)) return;
  const existing = parseMaybeJSON(localStorage.getItem('ytkw:history') || '[]') || [];
  const map = new Map();
  const normalize = (item) => typeof item === 'string'
    ? { q: item, at: 0, count: 1, mode: 'video' }
    : { mode: 'video', count: 1, at: 0, ...item };
  [...existing, ...newArr].forEach(raw => {
    const item = normalize(raw);
    if (!item.q) return;
    const key = item.q + '|' + (item.mode || 'video');
    if (map.has(key)) {
      const prev = map.get(key);
      prev.count = (prev.count || 1) + (item.count || 1);
      prev.at = Math.max(prev.at || 0, item.at || 0);
    } else {
      map.set(key, item);
    }
  });
  const merged = [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 200);
  localStorage.setItem('ytkw:history', JSON.stringify(merged));
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
