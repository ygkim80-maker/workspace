// ===== navigate 확장 =====
const _origNavigate = navigate;
function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  const titles = {
    dashboard: '대시보드', leads: '리드관리', customers: '고객관리', pipeline: '파이프라인',
    projects: '프로젝트 현황', contracts: '계약관리', sites: '현장관리', issues: '이슈관리',
    meetings: '미팅관리', emails: '메일관리', tasks: '할일', schedules: '일정',
    insights: '메모·인사이트', settings: '설정',
    worklog: '일일 작업관리', kpi: 'KPI 현황', documents: '문서함', feed: '팀 피드',
    hourly: '시간대별 물량', tbm: 'TBM 기록',
    'safety-edu': '안전교육 관리', staffing: '인원 배치',
    'safety-mgmt': '안전보건 관리',
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  const loaders = {
    dashboard: loadDashboard, leads: loadLeads, customers: loadCustomers,
    pipeline: loadPipeline, projects: loadProjects, contracts: loadContracts,
    sites: loadSites, issues: loadIssues, meetings: loadMeetings,
    emails: loadEmails, tasks: loadTasks, schedules: loadSchedules,
    insights: loadInsights, settings: loadSettings,
    worklog: loadWorklog, kpi: loadKpi, documents: loadDocuments, feed: loadFeed,
    hourly: loadHourly, tbm: loadTBM,
    'safety-edu': loadSafetyEdu, staffing: loadStaffing,
    'safety-mgmt': loadSafetyMgmt,
  };
  if (loaders[page]) loaders[page]();
}

// ===== 일일 작업관리 =====
async function loadWorklog() {
  const dateEl = document.getElementById('worklog-date');
  const siteEl = document.getElementById('worklog-site');
  if (!dateEl.value) {
    const today = new Date().toISOString().slice(0, 10);
    dateEl.value = today;
  }
  let url = '/api/v1/worklogs?';
  const dateVal = dateEl.value;
  const siteVal = siteEl.value;

  const all = await api.get('/api/v1/worklogs');

  // 현장 목록 갱신
  const sites = [...new Set(all.map(r => r.site).filter(Boolean))];
  const curSite = siteEl.value;
  siteEl.innerHTML = '<option value="">전체 현장</option>' +
    sites.map(s => `<option ${curSite === s ? 'selected' : ''}>${s}</option>`).join('');
  siteEl.value = curSite;

  const filtered = all.filter(r => {
    if (dateVal && r.date !== dateVal) return false;
    if (siteVal && r.site !== siteVal) return false;
    return true;
  });

  // 오늘 KPI 요약
  const todayAll = all.filter(r => r.date === dateEl.value);
  const tTarget = todayAll.reduce((s, r) => s + (r.target_qty || 0), 0);
  const tActual = todayAll.reduce((s, r) => s + (r.actual_qty || 0), 0);
  const tWorkers = todayAll.reduce((s, r) => s + (r.worker_count || 0), 0);
  document.getElementById('wl-target').textContent = tTarget.toLocaleString();
  document.getElementById('wl-actual').textContent = tActual.toLocaleString();
  document.getElementById('wl-rate').textContent = tTarget ? (tActual / tTarget * 100).toFixed(1) + '%' : '-';
  document.getElementById('wl-workers').textContent = tWorkers + '명';

  document.getElementById('worklog-tbody').innerHTML = filtered.map(r => {
    const rate = r.target_qty ? (r.actual_qty / r.target_qty * 100).toFixed(1) : '-';
    const totalHours = (r.work_hours || 8) * (r.worker_count || 1);
    const prod = totalHours ? (r.actual_qty / totalHours).toFixed(1) : '-';
    const rateColor = r.target_qty && (r.actual_qty / r.target_qty) >= 1 ? '#00b894' : '#e17055';
    return `<tr>
      <td>${r.date || '-'}</td>
      <td>${r.site || '-'}</td>
      <td>${r.work_type || '-'}</td>
      <td>${(r.target_qty || 0).toLocaleString()}</td>
      <td>${(r.actual_qty || 0).toLocaleString()}</td>
      <td style="font-weight:700;color:${rateColor}">${rate !== '-' ? rate + '%' : '-'}</td>
      <td>${r.worker_count || 0}명</td>
      <td>${r.work_hours || 8}h</td>
      <td>${prod}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes || '-'}</td>
      <td>
        <button class="btn-icon" onclick="editWorklog(${r.id})">수정</button>
        <button class="btn-danger" onclick="deleteWorklog(${r.id})">삭제</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="11" class="empty-state">등록된 작업이 없습니다</td></tr>';
}

function worklogForm(r = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const types = ['입고', '출고', '분류', '포장', '이적', '배송준비', '재고조사', '기타'];
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input name="date" type="date" value="${r.date || today}"></div>
      <div class="form-group"><label>현장명</label><input name="site" value="${r.site || ''}"></div>
    </div>
    <div class="form-group"><label>작업유형</label>
      <select name="work_type">
        ${types.map(t => `<option ${r.work_type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>목표량</label><input name="target_qty" type="number" value="${r.target_qty || 0}"></div>
      <div class="form-group"><label>실적량</label><input name="actual_qty" type="number" value="${r.actual_qty || 0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>투입인원</label><input name="worker_count" type="number" value="${r.worker_count || 0}"></div>
      <div class="form-group"><label>작업시간(h)</label><input name="work_hours" type="number" step="0.5" value="${r.work_hours || 8}"></div>
    </div>
    <div class="form-group"><label>비고</label><textarea name="notes">${r.notes || ''}</textarea></div>`;
}

function addWorklog() {
  showModal('작업 등록', worklogForm(), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'work_type', 'target_qty', 'actual_qty', 'worker_count', 'work_hours', 'notes']);
    d.target_qty = parseInt(d.target_qty) || 0;
    d.actual_qty = parseInt(d.actual_qty) || 0;
    d.worker_count = parseInt(d.worker_count) || 0;
    d.work_hours = parseFloat(d.work_hours) || 8;
    await api.post('/api/v1/worklogs/', d);
    loadWorklog();
  });
}

async function editWorklog(id) {
  const r = await api.get(`/api/v1/worklogs/${id}`);
  showModal('작업 수정', worklogForm(r), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'work_type', 'target_qty', 'actual_qty', 'worker_count', 'work_hours', 'notes']);
    d.target_qty = parseInt(d.target_qty) || 0;
    d.actual_qty = parseInt(d.actual_qty) || 0;
    d.worker_count = parseInt(d.worker_count) || 0;
    d.work_hours = parseFloat(d.work_hours) || 8;
    await api.put(`/api/v1/worklogs/${id}`, d);
    loadWorklog();
  });
}

async function deleteWorklog(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  await api.del(`/api/v1/worklogs/${id}`);
  loadWorklog();
}

// ===== KPI 차트 =====
let chartAchieve = null, chartWorkers = null;

async function loadKpi() {
  const days = document.getElementById('kpi-days').value || 14;
  const d = await api.get(`/api/v1/kpi?days=${days}`);

  document.getElementById('kpi-summary-inline').innerHTML = `
    <span class="kpi-inline-item">달성률 <strong style="color:var(--primary)">${d.achievement}%</strong></span>
    <span class="kpi-inline-item">인시생산성 <strong>${d.productivity}</strong>건/h</span>
    <span class="kpi-inline-item">총 실적 <strong>${(d.total_actual || 0).toLocaleString()}</strong>건</span>
    <span class="kpi-inline-item">투입인원 합계 <strong>${(d.total_workers || 0).toLocaleString()}</strong>명</span>`;

  const labels = d.trend.map(t => t.date.slice(5));
  const targets = d.trend.map(t => t.target);
  const actuals = d.trend.map(t => t.actual);
  const workers = d.trend.map(t => t.workers);

  if (chartAchieve) chartAchieve.destroy();
  chartAchieve = new Chart(document.getElementById('chart-achievement'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '목표량', data: targets, backgroundColor: '#b2bec3' },
        { label: '실적량', data: actuals, backgroundColor: '#00b894' },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } },
  });

  if (chartWorkers) chartWorkers.destroy();
  chartWorkers = new Chart(document.getElementById('chart-workers'), {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: '투입인원(명)', data: workers, borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,.1)', fill: true, tension: 0.3 }],
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } },
  });
}

// ===== 문서함 =====
let currentDocId = null, docDirty = false;

async function loadDocuments(q = '', category = '') {
  let url = '/api/v1/documents?';
  if (q) url += `q=${encodeURIComponent(q)}&`;
  if (category) url += `status=${encodeURIComponent(category)}&`;
  const docs = await api.get(url);
  document.getElementById('doc-list').innerHTML = docs.map(d => `
    <div class="doc-list-item ${currentDocId === d.id ? 'active' : ''}" onclick="openDocument(${d.id})">
      <div class="doc-list-title">${d.title || '제목 없음'}</div>
      <div class="doc-list-meta">${d.category} · ${fmtDocDate(d.updated_at)}</div>
    </div>`).join('') || '<p style="padding:12px;color:#999;font-size:0.82rem">문서가 없습니다</p>';
}

function fmtDocDate(iso) {
  if (!iso) return '';
  return iso.slice(0, 10).replace(/-/g, '.');
}

async function openDocument(id) {
  if (docDirty && !confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?')) return;
  const doc = await api.get(`/api/v1/documents/${id}`);
  currentDocId = id;
  docDirty = false;
  document.getElementById('doc-placeholder').style.display = 'none';
  document.getElementById('doc-editor-wrap').style.display = 'flex';
  document.getElementById('doc-title-input').value = doc.title || '';
  document.getElementById('doc-category-select').value = doc.category || '일반';
  document.getElementById('doc-body').innerHTML = doc.content || '';
  document.getElementById('doc-saved-at').textContent = '저장됨 ' + fmtDocDate(doc.updated_at);
  document.getElementById('doc-save-btn').textContent = '저장';
  loadDocuments(document.getElementById('doc-search').value);
}

async function newDocument() {
  if (docDirty && !confirm('저장하지 않은 변경사항이 있습니다. 계속하시겠습니까?')) return;
  const doc = await api.post('/api/v1/documents/', { title: '새 문서', content: '', category: '일반' });
  currentDocId = doc.id;
  docDirty = false;
  document.getElementById('doc-placeholder').style.display = 'none';
  document.getElementById('doc-editor-wrap').style.display = 'flex';
  document.getElementById('doc-title-input').value = '새 문서';
  document.getElementById('doc-category-select').value = '일반';
  document.getElementById('doc-body').innerHTML = '';
  document.getElementById('doc-saved-at').textContent = '';
  loadDocuments();
}

async function saveDocument() {
  if (!currentDocId) return;
  await api.put(`/api/v1/documents/${currentDocId}`, {
    title: document.getElementById('doc-title-input').value,
    content: document.getElementById('doc-body').innerHTML,
    category: document.getElementById('doc-category-select').value,
  });
  docDirty = false;
  document.getElementById('doc-save-btn').textContent = '저장됨 ✓';
  document.getElementById('doc-saved-at').textContent = '저장됨 ' + new Date().toLocaleDateString('ko-KR');
  loadDocuments(document.getElementById('doc-search').value);
}

async function deleteDocument() {
  if (!currentDocId || !confirm('문서를 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/documents/${currentDocId}`);
  currentDocId = null;
  docDirty = false;
  document.getElementById('doc-placeholder').style.display = 'flex';
  document.getElementById('doc-editor-wrap').style.display = 'none';
  loadDocuments();
}

function markDocDirty() {
  docDirty = true;
  document.getElementById('doc-save-btn').textContent = '저장 *';
}

function filterDocs(cat, btn) {
  document.querySelectorAll('.doc-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadDocuments(document.getElementById('doc-search').value, cat);
}

// 에디터 포맷 명령
function execFmt(cmd) { document.execCommand(cmd, false, null); document.getElementById('doc-body').focus(); }
function execFmtBlock(tag) { document.execCommand('formatBlock', false, tag); document.getElementById('doc-body').focus(); }

function insertTable() {
  const html = `<table style="border-collapse:collapse;width:100%;margin:10px 0">
    <tr><th style="border:1px solid #ccc;padding:6px;background:#f4f6f8">항목</th><th style="border:1px solid #ccc;padding:6px;background:#f4f6f8">내용</th></tr>
    <tr><td style="border:1px solid #ccc;padding:6px">　</td><td style="border:1px solid #ccc;padding:6px">　</td></tr>
  </table><p></p>`;
  document.execCommand('insertHTML', false, html);
}

function insertDivider() { document.execCommand('insertHTML', false, '<hr/><p></p>'); }

function insertDate() {
  const d = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  document.execCommand('insertHTML', false, `<p><strong>${d}</strong></p>`);
}

// Ctrl+S 저장
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    if (currentDocId) { e.preventDefault(); saveDocument(); }
  }
});

// ===== 팀 피드 =====
async function loadFeed() {
  const cat = document.getElementById('feed-cat-filter').value;
  let url = '/api/v1/feed?';
  if (cat) url += `category=${encodeURIComponent(cat)}`;
  const posts = await api.get(url);
  document.getElementById('feed-list').innerHTML = posts.map(p => `
    <div class="feed-card" id="feed-card-${p.id}">
      <div class="feed-card-header">
        <div>
          <span class="feed-category-badge">${p.category}</span>
          <strong class="feed-title">${p.title || '제목 없음'}</strong>
        </div>
        <div class="feed-meta">
          <span>${p.author}</span>
          <span>${p.created_at ? p.created_at.slice(0, 10).replace(/-/g, '.') : ''}</span>
          <button class="btn-danger" onclick="deletePost(${p.id})">삭제</button>
        </div>
      </div>
      <div class="feed-card-body">${p.content || ''}</div>
      <div class="feed-comments" id="comments-${p.id}"></div>
      <div class="feed-comment-input">
        <input placeholder="댓글 달기..." id="comment-input-${p.id}" onkeydown="if(event.key==='Enter')submitComment(${p.id})"/>
        <button class="btn-icon" onclick="submitComment(${p.id})">등록</button>
      </div>
    </div>`).join('') || '<p class="empty-state">게시글이 없습니다.</p>';

  // 댓글 로드
  for (const p of posts) loadComments(p.id);
}

async function loadComments(postId) {
  const comments = await api.get(`/api/v1/feed/${postId}/comments`);
  const el = document.getElementById(`comments-${postId}`);
  if (!el) return;
  el.innerHTML = comments.map(c => `
    <div class="feed-comment">
      <span class="comment-author">${c.author}</span>
      <span class="comment-content">${c.content}</span>
      <span class="comment-time">${c.created_at ? c.created_at.slice(0, 10) : ''}</span>
      <button class="btn-danger" style="padding:2px 6px;font-size:11px" onclick="deleteComment(${postId},${c.id})">✕</button>
    </div>`).join('');
}

async function submitComment(postId) {
  const el = document.getElementById(`comment-input-${postId}`);
  const content = el.value.trim();
  if (!content) return;
  await api.post(`/api/v1/feed/${postId}/comments`, { content, author: '관리자' });
  el.value = '';
  loadComments(postId);
}

async function deleteComment(postId, commentId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/feed/${postId}/comments/${commentId}`);
  loadComments(postId);
}

function newPost() {
  const compose = document.getElementById('feed-compose');
  compose.style.display = compose.style.display === 'none' ? 'block' : 'none';
  document.getElementById('post-title').focus();
}

function cancelPost() {
  document.getElementById('feed-compose').style.display = 'none';
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').innerHTML = '';
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-body').innerHTML;
  const category = document.getElementById('post-category').value;
  if (!title) { alert('제목을 입력하세요'); return; }
  await api.post('/api/v1/feed/', { title, content, category, author: '관리자' });
  cancelPost();
  loadFeed();
}

async function deletePost(id) {
  if (!confirm('게시글을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/feed/${id}`);
  loadFeed();
}

// ===== 시간대별 물량 =====
let chartHourly = null;

async function loadHourly() {
  const dateEl = document.getElementById('hourly-date');
  if (!dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);

  const all = await api.get('/api/v1/hourly');

  // populate site filter
  const siteEl = document.getElementById('hourly-site');
  const sites = [...new Set(all.map(r => r.site).filter(Boolean))];
  const curSite = siteEl.value;
  siteEl.innerHTML = '<option value="">전체 현장</option>' +
    sites.map(s => `<option ${curSite === s ? 'selected' : ''}>${s}</option>`).join('');
  siteEl.value = curSite;

  const filtered = all.filter(r => {
    if (dateEl.value && r.date !== dateEl.value) return false;
    if (curSite && r.site !== curSite) return false;
    return true;
  });

  // hour summary cards (aggregate all sites for the selected date)
  const dateRows = all.filter(r => r.date === dateEl.value);
  const hours = [9, 12, 15, 18];
  document.getElementById('hourly-cards').innerHTML = hours.map(h => {
    const hRows = dateRows.filter(r => r.hour === h);
    const target = hRows.reduce((s, r) => s + (r.target || 0), 0);
    const actual = hRows.reduce((s, r) => s + (r.actual || 0), 0);
    const rate = target ? (actual / target * 100).toFixed(1) : null;
    const isOver = rate && parseFloat(rate) >= 100;
    return `<div class="hour-card ${rate ? (isOver ? 'over' : 'under') : ''}">
      <div class="hour-label">${h}:00 시간대</div>
      <div class="hour-stat-row">
        <span class="hour-actual">${actual.toLocaleString()}</span>
        <span class="hour-rate ${isOver ? 'over' : 'under'}">${rate ? rate + '%' : '-'}</span>
      </div>
      <div class="hour-target">목표 ${target.toLocaleString()}건</div>
    </div>`;
  }).join('');

  // bar chart
  const labels = filtered.map(r => `${r.hour}시 ${r.site || ''}`);
  const targets = filtered.map(r => r.target || 0);
  const actuals = filtered.map(r => r.actual || 0);
  if (chartHourly) chartHourly.destroy();
  chartHourly = new Chart(document.getElementById('chart-hourly'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '목표', data: targets, backgroundColor: 'rgba(107,138,171,.4)', borderColor: 'rgba(107,138,171,.7)', borderWidth: 1 },
        { label: '실적', data: actuals, backgroundColor: 'rgba(56,189,248,.7)', borderColor: '#38bdf8', borderWidth: 1 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { color: '#6b8aab' } } },
      scales: {
        x: { ticks: { color: '#6b8aab' }, grid: { color: '#1a3555' } },
        y: { ticks: { color: '#6b8aab' }, grid: { color: '#1a3555' } },
      },
    },
  });

  // table
  document.getElementById('hourly-tbody').innerHTML = filtered.map(r => {
    const rate = r.target ? (r.actual / r.target * 100).toFixed(1) : '-';
    const rateColor = r.target && r.actual / r.target >= 1 ? 'var(--emerald)' : 'var(--danger)';
    return `<tr>
      <td>${r.date || '-'}</td>
      <td>${r.hour}:00</td>
      <td>${r.site || '-'}</td>
      <td>${(r.target || 0).toLocaleString()}</td>
      <td>${(r.actual || 0).toLocaleString()}</td>
      <td style="font-weight:700;color:${rateColor}">${rate !== '-' ? rate + '%' : '-'}</td>
      <td>${r.worker_count || 0}명</td>
      <td>${r.notes || '-'}</td>
      <td>
        <button class="btn-icon" onclick="editHourly(${r.id})">수정</button>
        <button class="btn-danger" onclick="deleteHourly(${r.id})">삭제</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" class="empty-state">데이터가 없습니다</td></tr>';
}

function hourlyForm(r = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input name="date" type="date" value="${r.date || today}"></div>
      <div class="form-group"><label>시간대</label>
        <select name="hour">
          ${[9,12,15,18].map(h => `<option value="${h}" ${r.hour === h ? 'selected' : ''}>${h}:00</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group"><label>현장명</label><input name="site" value="${r.site || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>목표량</label><input name="target" type="number" value="${r.target || 0}"></div>
      <div class="form-group"><label>실적량</label><input name="actual" type="number" value="${r.actual || 0}"></div>
      <div class="form-group"><label>투입인원</label><input name="worker_count" type="number" value="${r.worker_count || 0}"></div>
    </div>
    <div class="form-group"><label>비고</label><textarea name="notes">${r.notes || ''}</textarea></div>`;
}

function addHourly() {
  showModal('시간대 물량 입력', hourlyForm(), async (overlay) => {
    const d = getFormData(overlay, ['date', 'hour', 'site', 'target', 'actual', 'worker_count', 'notes']);
    d.hour = parseInt(d.hour);
    d.target = parseInt(d.target) || 0;
    d.actual = parseInt(d.actual) || 0;
    d.worker_count = parseInt(d.worker_count) || 0;
    await api.post('/api/v1/hourly/', d);
    loadHourly();
  });
}

async function editHourly(id) {
  const r = await api.get(`/api/v1/hourly/${id}`);
  showModal('시간대 물량 수정', hourlyForm(r), async (overlay) => {
    const d = getFormData(overlay, ['date', 'hour', 'site', 'target', 'actual', 'worker_count', 'notes']);
    d.hour = parseInt(d.hour);
    d.target = parseInt(d.target) || 0;
    d.actual = parseInt(d.actual) || 0;
    d.worker_count = parseInt(d.worker_count) || 0;
    await api.put(`/api/v1/hourly/${id}`, d);
    loadHourly();
  });
}

async function deleteHourly(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  await api.del(`/api/v1/hourly/${id}`);
  loadHourly();
}

// ===== TBM 기록 =====
async function loadTBM() {
  const fromEl = document.getElementById('tbm-date-from');
  const toEl = document.getElementById('tbm-date-to');
  const siteEl = document.getElementById('tbm-site-filter');

  if (!fromEl.value) {
    const d = new Date(); d.setDate(d.getDate() - 14);
    fromEl.value = d.toISOString().slice(0, 10);
  }
  if (!toEl.value) toEl.value = new Date().toISOString().slice(0, 10);

  const all = await api.get('/api/v1/tbm');

  // populate site filter
  const sites = [...new Set(all.map(r => r.site).filter(Boolean))];
  const curSite = siteEl.value;
  siteEl.innerHTML = '<option value="">전체 현장</option>' +
    sites.map(s => `<option ${curSite === s ? 'selected' : ''}>${s}</option>`).join('');
  siteEl.value = curSite;

  const filtered = all.filter(r => {
    if (fromEl.value && r.date < fromEl.value) return false;
    if (toEl.value && r.date > toEl.value) return false;
    if (curSite && r.site !== curSite) return false;
    return true;
  });

  // KPI
  const totalAttendees = filtered.reduce((s, r) => s + (r.attendee_count || 0), 0);
  const completed = filtered.filter(r => r.status === '완료').length;
  const completeRate = filtered.length ? Math.round(completed / filtered.length * 100) : 0;

  // 무재해 일수: 오늘 기준 days since last issue (simplified: days since first TBM in set)
  let safeDays = '-';
  if (filtered.length) {
    const first = filtered.map(r => r.date).sort()[0];
    const diff = Math.floor((new Date() - new Date(first)) / 86400000);
    safeDays = diff + '일';
  }

  document.getElementById('tbm-count').textContent = filtered.length;
  document.getElementById('tbm-attendees').textContent = totalAttendees + '명';
  document.getElementById('tbm-safe-days').textContent = safeDays;
  document.getElementById('tbm-complete-rate').textContent = completeRate + '%';

  // 날짜별 그룹핑 accordion
  const sorted = filtered.sort((a, b) => b.date > a.date ? 1 : -1);
  const groups = {};
  sorted.forEach(r => {
    const key = r.date || '날짜 미상';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  document.getElementById('tbm-grid').innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([date, records], gi) => {
    const isToday = date === todayStr;
    const isOpen = gi === 0; // 가장 최신 날짜만 기본 펼침
    const groupId = `tbm-group-${gi}`;
    const completedCount = records.filter(r => r.status === '완료').length;
    const totalAttend = records.reduce((s, r) => s + (r.attendee_count || 0), 0);
    const dateLabel = (() => {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    })();

    const cards = records.map(r => {
      const attendees = (() => { try { return JSON.parse(r.attendees || '[]'); } catch { return []; } })();
      const statusClass = r.status === '완료' ? 'badge-safety' : 'badge-warning';
      return `<div class="tbm-card">
        <div class="tbm-card-header">
          <div>
            <div class="tbm-card-title">${r.site || '-'} · ${r.team || '-'}</div>
            <div class="tbm-card-meta">리더: ${r.leader || '-'}</div>
          </div>
          <span class="badge ${statusClass}">${r.status || '완료'}</span>
        </div>
        <div class="tbm-detail-row">
          <div class="tbm-detail-item">
            <span class="tbm-detail-label">안전주제</span>
            <span class="tbm-detail-value">${r.safety_topic || '-'}</span>
          </div>
          <div class="tbm-detail-item">
            <span class="tbm-detail-label">작업계획</span>
            <span class="tbm-detail-value">${r.work_plan || '-'}</span>
          </div>
          <div class="tbm-detail-item">
            <span class="tbm-detail-label">참석인원</span>
            <span class="tbm-detail-value">${r.attendee_count || 0}명${attendees.length ? ' · ' + attendees.slice(0, 3).join(', ') + (attendees.length > 3 ? ' 외' : '') : ''}</span>
          </div>
        </div>
        <div class="tbm-actions">
          <button class="btn-icon" onclick="editTBM(${r.id})">수정</button>
          <button class="btn-danger" onclick="deleteTBM(${r.id})">삭제</button>
        </div>
      </div>`;
    }).join('');

    return `
      <div class="tbm-accordion">
        <div class="tbm-acc-header ${isOpen ? 'open' : ''}" onclick="toggleTbmGroup('${groupId}')">
          <div class="tbm-acc-date">
            ${isToday ? '<span class="tbm-today-badge">오늘</span>' : ''}
            <span class="tbm-acc-datetext">${dateLabel}</span>
            <span class="tbm-acc-sub">${records.length}건 · 참석 ${totalAttend}명 · 완료 ${completedCount}/${records.length}</span>
          </div>
          <span class="tbm-acc-chevron">${isOpen ? '▲' : '▼'}</span>
        </div>
        <div class="tbm-acc-body ${isOpen ? 'open' : ''}" id="${groupId}">
          <div class="tbm-grid">${cards}</div>
        </div>
      </div>`;
  }).join('') : '<p style="color:var(--muted);padding:20px">TBM 기록이 없습니다.</p>';
}

function tbmForm(r = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const attendeesVal = (() => {
    try { return JSON.parse(r.attendees || '[]').join(', '); } catch { return ''; }
  })();
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input name="date" type="date" value="${r.date || today}"></div>
      <div class="form-group"><label>상태</label>
        <select name="status">
          <option ${r.status === '완료' ? 'selected' : ''}>완료</option>
          <option ${r.status === '진행중' ? 'selected' : ''}>진행중</option>
          <option ${r.status === '취소' ? 'selected' : ''}>취소</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>현장</label><input name="site" value="${r.site || ''}"></div>
      <div class="form-group"><label>팀</label><input name="team" value="${r.team || ''}"></div>
      <div class="form-group"><label>리더</label><input name="leader" value="${r.leader || ''}"></div>
    </div>
    <div class="form-group"><label>안전 주제</label><textarea name="safety_topic">${r.safety_topic || ''}</textarea></div>
    <div class="form-group"><label>작업 계획</label><textarea name="work_plan">${r.work_plan || ''}</textarea></div>
    <div class="form-group"><label>참석자 (쉼표 구분)</label><input name="attendees_raw" value="${attendeesVal}"></div>
    <div class="form-group"><label>참석인원 수</label><input name="attendee_count" type="number" value="${r.attendee_count || 0}"></div>`;
}

function addTBM() {
  showModal('TBM 등록', tbmForm(), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'team', 'leader', 'safety_topic', 'work_plan', 'attendees_raw', 'attendee_count', 'status']);
    const names = d.attendees_raw.split(',').map(s => s.trim()).filter(Boolean);
    d.attendees = JSON.stringify(names);
    d.attendee_count = parseInt(d.attendee_count) || names.length;
    delete d.attendees_raw;
    await api.post('/api/v1/tbm/', d);
    loadTBM();
  });
}

async function editTBM(id) {
  const r = await api.get(`/api/v1/tbm/${id}`);
  showModal('TBM 수정', tbmForm(r), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'team', 'leader', 'safety_topic', 'work_plan', 'attendees_raw', 'attendee_count', 'status']);
    const names = d.attendees_raw.split(',').map(s => s.trim()).filter(Boolean);
    d.attendees = JSON.stringify(names);
    d.attendee_count = parseInt(d.attendee_count) || names.length;
    delete d.attendees_raw;
    await api.put(`/api/v1/tbm/${id}`, d);
    loadTBM();
  });
}

async function deleteTBM(id) {
  if (!confirm('TBM 기록을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/tbm/${id}`);
  loadTBM();
}

function toggleTbmGroup(groupId) {
  const body = document.getElementById(groupId);
  const header = body?.previousElementSibling;
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (header) header.classList.toggle('open', !isOpen);
  if (header) header.querySelector('.tbm-acc-chevron').textContent = isOpen ? '▼' : '▲';
}

// ===== 안전교육 관리 (Safety Education) =====
async function loadSafetyEdu() {
  const siteEl = document.getElementById('edu-site-filter');
  const fromEl = document.getElementById('edu-date-from');
  const toEl   = document.getElementById('edu-date-to');
  let url = '/api/v1/safety_edu?';
  if (siteEl?.value) url += `site=${encodeURIComponent(siteEl.value)}&`;
  if (fromEl?.value) url += `date_from=${fromEl.value}&`;
  if (toEl?.value)   url += `date_to=${toEl.value}&`;

  let rows = [];
  try { rows = await api.get(url); } catch(e) { rows = []; }

  // Populate site filter options
  if (siteEl && siteEl.options.length <= 1) {
    const sites = [...new Set(rows.map(r => r.site).filter(Boolean))];
    sites.forEach(s => { const o = document.createElement('option'); o.value = o.textContent = s; siteEl.appendChild(o); });
  }

  const thisMonth = new Date().toISOString().slice(0,7);
  const thisMonthRows = rows.filter(r => r.date?.startsWith(thisMonth));
  const totalParticipants = rows.reduce((s, r) => s + (r.participant_count || 0), 0);
  const completedRows = rows.filter(r => r.completed);
  const rate = rows.length ? Math.round(completedRows.length / rows.length * 100) : 0;

  document.getElementById('edu-count').textContent = rows.length;
  document.getElementById('edu-participants').textContent = totalParticipants.toLocaleString();
  document.getElementById('edu-this-month').textContent = thisMonthRows.length;
  document.getElementById('edu-completion').textContent = rate + '%';

  document.getElementById('edu-grid').innerHTML = rows.length ? rows.map(r => `
    <div class="tbm-card">
      <div class="tbm-card-header">
        <span class="badge-safety">${r.site || '-'}</span>
        <span style="font-size:.75rem;color:var(--muted)">${r.date || ''}</span>
      </div>
      <div class="tbm-card-title">${r.title || '안전교육'}</div>
      <div style="margin:.5rem 0;font-size:.82rem;color:var(--muted)">${r.instructor ? '강사: ' + r.instructor : ''}</div>
      <div class="tbm-card-footer">
        <span>참석 ${r.participant_count || 0}명</span>
        <span class="${r.completed ? 'badge-safety' : 'badge-warning'}">${r.completed ? '완료' : '진행중'}</span>
        <button class="btn-icon" onclick="editSafetyEdu(${r.id})">수정</button>
        <button class="btn-danger" onclick="deleteSafetyEdu(${r.id})">삭제</button>
      </div>
    </div>`).join('') : '<p style="color:var(--muted);padding:20px">등록된 교육 기록이 없습니다.</p>';
}

function safetyEduForm(r = {}) {
  return `
    <div class="form-row">
      <div class="form-group"><label>교육일</label><input name="date" type="date" value="${r.date || new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label>현장</label><input name="site" value="${r.site || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>교육 제목</label><input name="title" value="${r.title || ''}"></div>
      <div class="form-group"><label>강사</label><input name="instructor" value="${r.instructor || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>참석인원</label><input name="participant_count" type="number" value="${r.participant_count || 0}"></div>
      <div class="form-group"><label>완료 여부</label>
        <select name="completed">
          <option value="false" ${!r.completed ? 'selected':''}>진행중</option>
          <option value="true" ${r.completed ? 'selected':''}>완료</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>내용 / 비고</label><textarea name="notes" rows="3">${r.notes || ''}</textarea></div>`;
}

function addSafetyEdu() {
  showModal('안전교육 등록', safetyEduForm(), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'title', 'instructor', 'participant_count', 'completed', 'notes']);
    d.participant_count = parseInt(d.participant_count) || 0;
    d.completed = d.completed === 'true';
    await api.post('/api/v1/safety_edu', d);
    loadSafetyEdu();
  });
}

async function editSafetyEdu(id) {
  const r = await api.get(`/api/v1/safety_edu/${id}`);
  showModal('안전교육 수정', safetyEduForm(r), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'title', 'instructor', 'participant_count', 'completed', 'notes']);
    d.participant_count = parseInt(d.participant_count) || 0;
    d.completed = d.completed === 'true';
    await api.put(`/api/v1/safety_edu/${id}`, d);
    loadSafetyEdu();
  });
}

async function deleteSafetyEdu(id) {
  if (!confirm('교육 기록을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/safety_edu/${id}`);
  loadSafetyEdu();
}

// ===== 인원 배치 (Staffing) =====
async function loadStaffing() {
  const dateEl = document.getElementById('staffing-date');
  const siteEl = document.getElementById('staffing-site-filter');
  let url = '/api/v1/staffing?';
  if (dateEl?.value) url += `date=${dateEl.value}&`;
  if (siteEl?.value) url += `site=${encodeURIComponent(siteEl.value)}&`;

  let rows = [];
  try { rows = await api.get(url); } catch(e) { rows = []; }

  if (siteEl && siteEl.options.length <= 1) {
    const sites = [...new Set(rows.map(r => r.site).filter(Boolean))];
    sites.forEach(s => { const o = document.createElement('option'); o.value = o.textContent = s; siteEl.appendChild(o); });
  }

  const totalAll  = rows.reduce((s, r) => s + (r.regular||0) + (r.contract||0) + (r.dispatch||0), 0);
  const totalReg  = rows.reduce((s, r) => s + (r.regular||0), 0);
  const totalCon  = rows.reduce((s, r) => s + (r.contract||0) + (r.dispatch||0), 0);
  const siteCount = new Set(rows.map(r => r.site).filter(Boolean)).size;

  document.getElementById('staffing-total').textContent = totalAll.toLocaleString();
  document.getElementById('staffing-regular').textContent = totalReg.toLocaleString();
  document.getElementById('staffing-contract').textContent = totalCon.toLocaleString();
  document.getElementById('staffing-sites').textContent = siteCount;

  document.getElementById('staffing-tbody').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${r.site || '-'}</td>
      <td>${r.date || '-'}</td>
      <td>${r.regular || 0}</td>
      <td>${r.contract || 0}</td>
      <td>${r.dispatch || 0}</td>
      <td><strong>${(r.regular||0)+(r.contract||0)+(r.dispatch||0)}</strong></td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes || '-'}</td>
      <td>
        <button class="btn-icon" onclick="editStaffing(${r.id})">수정</button>
        <button class="btn-danger" onclick="deleteStaffing(${r.id})">삭제</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty-state">데이터 없음</td></tr>';
}

function staffingForm(r = {}) {
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input name="date" type="date" value="${r.date || new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label>현장</label><input name="site" value="${r.site || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>정규직</label><input name="regular" type="number" value="${r.regular || 0}"></div>
      <div class="form-group"><label>계약직</label><input name="contract" type="number" value="${r.contract || 0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>파견</label><input name="dispatch" type="number" value="${r.dispatch || 0}"></div>
      <div class="form-group"><label>비고</label><input name="notes" value="${r.notes || ''}"></div>
    </div>`;
}

function addStaffing() {
  showModal('인원 배치 등록', staffingForm(), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'regular', 'contract', 'dispatch', 'notes']);
    d.regular = parseInt(d.regular) || 0;
    d.contract = parseInt(d.contract) || 0;
    d.dispatch = parseInt(d.dispatch) || 0;
    await api.post('/api/v1/staffing', d);
    loadStaffing();
  });
}

async function editStaffing(id) {
  const r = await api.get(`/api/v1/staffing/${id}`);
  showModal('인원 배치 수정', staffingForm(r), async (overlay) => {
    const d = getFormData(overlay, ['date', 'site', 'regular', 'contract', 'dispatch', 'notes']);
    d.regular = parseInt(d.regular) || 0;
    d.contract = parseInt(d.contract) || 0;
    d.dispatch = parseInt(d.dispatch) || 0;
    await api.put(`/api/v1/staffing/${id}`, d);
    loadStaffing();
  });
}

async function deleteStaffing(id) {
  if (!confirm('배치 기록을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/staffing/${id}`);
  loadStaffing();
}

// ===== 안전보건 관리 =====

// 유형별 체크리스트 항목 정의 (산업안전보건법 기준)
const CHECKLIST_TEMPLATES = {
  일일: [
    { section: '작업장 환경', items: [
      '작업장 통로 및 비상구 확보 여부',
      '작업장 조명 정상 여부',
      '바닥 미끄럼 방지 조치 여부',
      '전기 배선 및 콘센트 정상 여부',
      '소화기 위치 확인 및 접근 가능 여부',
    ]},
    { section: '개인보호구', items: [
      '안전모 착용 여부',
      '안전화 착용 여부',
      '작업에 적합한 PPE 착용 여부',
      '보호구 손상·불량 여부 확인',
    ]},
    { section: '장비·설비', items: [
      '지게차·하역장비 외관 이상 여부',
      '컨베이어벨트 정상 작동 여부',
      '안전 덮개·방호장치 설치 여부',
      '비상정지 스위치 작동 여부',
    ]},
    { section: '작업 전 안전 확인', items: [
      'TBM(위험예지훈련) 실시 여부',
      '작업 지시·절차 숙지 여부',
      '유해·위험 작업 사전 허가 여부',
    ]},
  ],
  주간: [
    { section: '안전 설비 점검', items: [
      '소화기 압력·유효기간 확인',
      '비상조명등 점등 여부',
      '경보설비 (화재경보기) 작동 확인',
      '방화문 자동 닫힘 기능 확인',
      '안전표지판 부착 상태',
      '위험물 보관창고 시건 및 표시 여부',
    ]},
    { section: '작업환경 점검', items: [
      '소음 측정 및 기준 초과 여부 확인',
      '분진 발생 작업장 환기 상태',
      '화학물질 MSDS 게시 여부',
      '폐기물 분리수거 및 처리 현황',
    ]},
    { section: '장비 정기 점검', items: [
      '지게차 일상점검표 기록 확인',
      '고소작업대 안전장치 점검',
      '전기설비 절연 상태 확인',
      '압력용기 압력계 정상 여부',
    ]},
    { section: '안전 관리 행정', items: [
      '안전교육 일지 작성 여부',
      '아차사고 보고 현황 확인',
      '작업허가서 발행 및 관리 현황',
      '협력업체 안전 관리 현황 확인',
    ]},
  ],
  월간: [
    { section: '법정 점검 사항', items: [
      '안전보건관리책임자 업무 수행 확인',
      '산업안전보건위원회 회의록 작성',
      '근로자 안전보건교육 실시 여부 (월 1회 이상)',
      '안전점검 결과 및 개선 조치 이행 여부',
      '중대재해처벌법 이행 점검',
    ]},
    { section: '건강 관리', items: [
      '근로자 건강검진 대상자 관리',
      '야간 작업자 특수건강검진 관리',
      '뇌심혈관질환 예방 프로그램 운영',
      '직업병 유소견자 사후 관리',
    ]},
    { section: '비상 대응', items: [
      '비상연락망 최신 여부 확인',
      '소방훈련 실시 여부 (반기 1회 이상)',
      '구급약품 유효기간 및 구비 상태',
      '비상대피로 지도 게시 여부',
    ]},
    { section: '협력업체 관리', items: [
      '협력업체 안전보건관리 계획서 확인',
      '협력업체 근로자 안전교육 이수 확인',
      '혼재 작업 위험성평가 실시 여부',
      '협력업체 재해 발생 현황 확인',
    ]},
    { section: '위험성 평가', items: [
      '위험성평가 실시 및 기록 관리',
      '신규 작업·설비 위험성평가 여부',
      '개선 조치 이행 현황 점검',
    ]},
  ],
};

function switchSmTab(tab) {
  document.querySelectorAll('.sm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('sm-tab-checklist').style.display = tab === 'checklist' ? '' : 'none';
  document.getElementById('sm-tab-guide').style.display = tab === 'guide' ? '' : 'none';
  if (tab === 'guide') loadSafetyGuides();
}

async function loadSafetyMgmt() {
  const type = document.getElementById('cl-type').value;
  const site = document.getElementById('cl-site').value;
  const from = document.getElementById('cl-date-from').value;
  const to   = document.getElementById('cl-date-to').value;

  let url = `/api/v1/safety_checklists?check_type=${encodeURIComponent(type)}`;
  if (site) url += `&site=${encodeURIComponent(site)}`;
  if (from) url += `&date_from=${from}`;
  if (to)   url += `&date_to=${to}`;

  let rows = [];
  try { rows = await api.get(url); } catch(e) { rows = []; }

  const okCount = rows.filter(r => r.overall_ok).length;
  const ngCount = rows.length - okCount;
  const rate = rows.length ? Math.round(okCount / rows.length * 100) : 0;

  document.getElementById('cl-total').textContent = rows.length;
  document.getElementById('cl-ok').textContent = okCount;
  document.getElementById('cl-ng').textContent = ngCount;
  document.getElementById('cl-rate').textContent = rate + '%';

  const sorted = rows.sort((a, b) => b.date > a.date ? 1 : -1);

  // 날짜별 accordion
  const groups = {};
  sorted.forEach(r => {
    const key = r.date || '날짜 미상';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  document.getElementById('cl-list').innerHTML = Object.keys(groups).length
    ? Object.entries(groups).map(([date, recs], gi) => {
        const isToday = date === todayStr;
        const gId = `cl-group-${gi}`;
        const isOpen = gi === 0;
        const okN = recs.filter(r => r.overall_ok).length;
        const dateLabel = (() => {
          const d = new Date(date + 'T00:00:00');
          return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        })();
        const cards = recs.map(r => {
          let responses = [];
          try { responses = JSON.parse(r.responses || '[]'); } catch {}
          const total = responses.length;
          const ok = responses.filter(x => x.ok).length;
          const ng = responses.filter(x => !x.ok);
          return `<div class="cl-card ${r.overall_ok ? 'cl-ok' : 'cl-ng'}">
            <div class="cl-card-header">
              <div>
                <div class="cl-card-title">${r.site || '-'} · ${r.check_type} 점검</div>
                <div class="cl-card-sub">점검자: ${r.completed_by || '-'} | 항목 ${ok}/${total} 적합</div>
              </div>
              <span class="badge ${r.overall_ok ? 'badge-safety' : 'badge-danger'}">${r.overall_ok ? '적합' : '부적합'}</span>
            </div>
            ${ng.length ? `<div class="cl-ng-items">⚠️ 부적합 항목: ${ng.map(x => x.item).join(' / ')}</div>` : ''}
            ${r.notes ? `<div class="cl-notes">📝 ${r.notes}</div>` : ''}
            <div class="tbm-actions">
              <button class="btn-icon" onclick="viewChecklist(${r.id})">상세보기</button>
              <button class="btn-danger" onclick="deleteChecklist(${r.id})">삭제</button>
            </div>
          </div>`;
        }).join('');
        return `<div class="tbm-accordion">
          <div class="tbm-acc-header ${isOpen ? 'open' : ''}" onclick="toggleClGroup('${gId}')">
            <div class="tbm-acc-date">
              ${isToday ? '<span class="tbm-today-badge">오늘</span>' : ''}
              <span class="tbm-acc-datetext">${dateLabel}</span>
              <span class="tbm-acc-sub">${recs.length}건 · 적합 ${okN}/${recs.length}</span>
            </div>
            <span class="tbm-acc-chevron">${isOpen ? '▲' : '▼'}</span>
          </div>
          <div class="tbm-acc-body ${isOpen ? 'open' : ''}" id="${gId}">
            <div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">${cards}</div>
          </div>
        </div>`;
      }).join('')
    : '<p style="color:var(--muted);padding:24px">점검 기록이 없습니다. [점검 실시] 버튼으로 체크리스트를 작성하세요.</p>';
}

function startChecklist() {
  const type = document.getElementById('cl-type').value;
  const template = CHECKLIST_TEMPLATES[type];
  const today = new Date().toISOString().slice(0, 10);

  const itemsHtml = template.map((sec, si) => `
    <div class="cl-section">
      <div class="cl-section-title">${sec.section}</div>
      ${sec.items.map((item, ii) => `
        <div class="cl-item" id="cli-${si}-${ii}">
          <div class="cl-item-text">${item}</div>
          <div class="cl-item-controls">
            <label class="cl-radio ok"><input type="radio" name="cl-${si}-${ii}" value="ok" checked> ✔ 적합</label>
            <label class="cl-radio ng"><input type="radio" name="cl-${si}-${ii}" value="ng"> ✘ 부적합</label>
            <input class="cl-item-note" name="note-${si}-${ii}" placeholder="특이사항" style="display:none"/>
          </div>
        </div>`).join('')}
    </div>`).join('');

  const formHtml = `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input name="date" type="date" value="${today}"></div>
      <div class="form-group"><label>현장</label><input name="site" value=""></div>
    </div>
    <div class="form-group"><label>점검자</label><input name="completed_by" value=""></div>
    <div class="cl-checklist-wrap">${itemsHtml}</div>
    <div class="form-group" style="margin-top:12px"><label>종합 의견</label><textarea name="notes" rows="2"></textarea></div>`;

  showModal(`${type} 안전점검 체크리스트`, formHtml, async (overlay) => {
    // 부적합 항목에 note input 보이기 로직
    const responses = [];
    template.forEach((sec, si) => {
      sec.items.forEach((item, ii) => {
        const val = overlay.querySelector(`input[name="cl-${si}-${ii}"]:checked`)?.value;
        const note = overlay.querySelector(`input[name="note-${si}-${ii}"]`)?.value || '';
        responses.push({ item, ok: val !== 'ng', note });
      });
    });
    const overallOk = responses.every(r => r.ok) ? 1 : 0;
    const d = {
      date: overlay.querySelector('[name="date"]').value,
      site: overlay.querySelector('[name="site"]').value,
      check_type: type,
      responses: JSON.stringify(responses),
      completed_by: overlay.querySelector('[name="completed_by"]').value,
      overall_ok: overallOk,
      notes: overlay.querySelector('[name="notes"]').value,
    };
    await api.post('/api/v1/safety_checklists', d);
    loadSafetyMgmt();
  });

  // NG 선택 시 note 입력창 표시
  setTimeout(() => {
    document.querySelectorAll('.cl-item input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', e => {
        const noteEl = e.target.closest('.cl-item').querySelector('.cl-item-note');
        if (noteEl) noteEl.style.display = e.target.value === 'ng' ? 'block' : 'none';
      });
    });
  }, 50);
}

async function viewChecklist(id) {
  const r = await api.get(`/api/v1/safety_checklists/${id}`);
  let responses = [];
  try { responses = JSON.parse(r.responses || '[]'); } catch {}
  const rows = responses.map(x => `
    <tr>
      <td>${x.item}</td>
      <td><span class="badge ${x.ok ? 'badge-safety' : 'badge-danger'}">${x.ok ? '적합' : '부적합'}</span></td>
      <td style="color:var(--muted);font-size:.8rem">${x.note || '-'}</td>
    </tr>`).join('');
  const html = `
    <div style="margin-bottom:12px;font-size:.85rem;color:var(--muted)">
      ${r.date} | ${r.site || '-'} | 점검자: ${r.completed_by || '-'}
    </div>
    <div style="overflow-x:auto">
      <table class="data-table" style="font-size:.82rem">
        <thead><tr><th>점검 항목</th><th>결과</th><th>특이사항</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${r.notes ? `<div style="margin-top:12px;padding:10px;background:var(--card2);border-radius:8px;font-size:.85rem">📝 ${r.notes}</div>` : ''}`;
  showModal(`${r.check_type} 점검 상세`, html, async () => {});
}

async function deleteChecklist(id) {
  if (!confirm('점검 기록을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/safety_checklists/${id}`);
  loadSafetyMgmt();
}

function toggleClGroup(gId) {
  const body = document.getElementById(gId);
  const header = body?.previousElementSibling;
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (header) header.classList.toggle('open', !isOpen);
  if (header) header.querySelector('.tbm-acc-chevron').textContent = isOpen ? '▼' : '▲';
}

// ===== 매뉴얼·지침 =====
async function loadSafetyGuides() {
  const cat = document.getElementById('guide-cat-filter').value;
  let url = '/api/v1/safety_guides';
  if (cat) url += `?category=${encodeURIComponent(cat)}`;
  let rows = [];
  try { rows = await api.get(url); } catch {}

  const catColors = { '법령': 'var(--danger)', '사내지침': 'var(--amber)', '매뉴얼': 'var(--sky)', '기타': 'var(--muted)' };

  document.getElementById('guide-grid').innerHTML = rows.length ? rows.map(r => `
    <div class="guide-card">
      <div class="guide-card-top">
        <span class="guide-cat-badge" style="color:${catColors[r.category]||'var(--muted)'}">${r.category || '기타'}</span>
        ${r.revision ? `<span class="guide-rev">${r.revision}</span>` : ''}
      </div>
      <div class="guide-title">${r.title || '(제목없음)'}</div>
      <div class="guide-meta">시행일: ${r.effective_date || '-'}</div>
      ${r.content ? `<div class="guide-content">${r.content.slice(0, 120)}${r.content.length > 120 ? '...' : ''}</div>` : ''}
      ${r.file_url ? `<a href="${r.file_url}" target="_blank" class="guide-link">📎 파일 열기</a>` : ''}
      <div class="tbm-actions" style="margin-top:10px">
        <button class="btn-icon" onclick="editSafetyGuide(${r.id})">수정</button>
        <button class="btn-danger" onclick="deleteSafetyGuide(${r.id})">삭제</button>
      </div>
    </div>`).join('') : `
    <div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">
      <div style="font-size:2rem;margin-bottom:12px">📚</div>
      <p>등록된 매뉴얼·지침이 없습니다.</p>
      <p style="font-size:.8rem;margin-top:8px">산업안전보건법, 사내 안전지침, 작업 매뉴얼 등을 등록해 담당자들이 언제든 확인할 수 있게 하세요.</p>
    </div>`;
}

function guideForm(r = {}) {
  const cats = ['법령', '사내지침', '매뉴얼', '기타'];
  return `
    <div class="form-row">
      <div class="form-group"><label>카테고리</label>
        <select name="category">${cats.map(c => `<option ${r.category===c?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>개정번호</label><input name="revision" placeholder="예: Rev.3" value="${r.revision||''}"></div>
    </div>
    <div class="form-group"><label>제목</label><input name="title" value="${r.title||''}"></div>
    <div class="form-row">
      <div class="form-group"><label>시행일</label><input name="effective_date" type="date" value="${r.effective_date||''}"></div>
      <div class="form-group"><label>파일 URL (선택)</label><input name="file_url" placeholder="https://..." value="${r.file_url||''}"></div>
    </div>
    <div class="form-group"><label>내용 요약</label><textarea name="content" rows="5">${r.content||''}</textarea></div>`;
}

function addSafetyGuide() {
  showModal('문서 등록', guideForm(), async (overlay) => {
    const d = getFormData(overlay, ['category', 'revision', 'title', 'effective_date', 'file_url', 'content']);
    await api.post('/api/v1/safety_guides', d);
    loadSafetyGuides();
  });
}

async function editSafetyGuide(id) {
  const r = await api.get(`/api/v1/safety_guides/${id}`);
  showModal('문서 수정', guideForm(r), async (overlay) => {
    const d = getFormData(overlay, ['category', 'revision', 'title', 'effective_date', 'file_url', 'content']);
    await api.put(`/api/v1/safety_guides/${id}`, d);
    loadSafetyGuides();
  });
}

async function deleteSafetyGuide(id) {
  if (!confirm('문서를 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/safety_guides/${id}`);
  loadSafetyGuides();
}
