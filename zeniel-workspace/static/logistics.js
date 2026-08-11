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

  // cards grid
  document.getElementById('tbm-grid').innerHTML = filtered.sort((a, b) => b.date > a.date ? 1 : -1).map(r => {
    const attendees = (() => {
      try { return JSON.parse(r.attendees || '[]'); } catch { return []; }
    })();
    const statusClass = r.status === '완료' ? 'badge-safety' : 'badge-warning';
    return `<div class="tbm-card">
      <div class="tbm-card-header">
        <div>
          <div class="tbm-card-title">${r.site || '-'} · ${r.team || '-'}</div>
          <div class="tbm-card-meta">${r.date || ''} | 리더: ${r.leader || '-'}</div>
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
  }).join('') || '<p style="color:var(--muted);padding:20px">TBM 기록이 없습니다.</p>';
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
  openModal('안전교육 등록', safetyEduForm(), async (fd) => {
    const d = { date: fd.get('date'), site: fd.get('site'), title: fd.get('title'),
      instructor: fd.get('instructor'), participant_count: parseInt(fd.get('participant_count')) || 0,
      completed: fd.get('completed') === 'true', notes: fd.get('notes') };
    await api.post('/api/v1/safety_edu', d);
    loadSafetyEdu();
  });
}

async function editSafetyEdu(id) {
  const r = await api.get(`/api/v1/safety_edu/${id}`);
  openModal('안전교육 수정', safetyEduForm(r), async (fd) => {
    const d = { date: fd.get('date'), site: fd.get('site'), title: fd.get('title'),
      instructor: fd.get('instructor'), participant_count: parseInt(fd.get('participant_count')) || 0,
      completed: fd.get('completed') === 'true', notes: fd.get('notes') };
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
  openModal('인원 배치 등록', staffingForm(), async (fd) => {
    const d = { date: fd.get('date'), site: fd.get('site'),
      regular: parseInt(fd.get('regular')) || 0, contract: parseInt(fd.get('contract')) || 0,
      dispatch: parseInt(fd.get('dispatch')) || 0, notes: fd.get('notes') };
    await api.post('/api/v1/staffing', d);
    loadStaffing();
  });
}

async function editStaffing(id) {
  const r = await api.get(`/api/v1/staffing/${id}`);
  openModal('인원 배치 수정', staffingForm(r), async (fd) => {
    const d = { date: fd.get('date'), site: fd.get('site'),
      regular: parseInt(fd.get('regular')) || 0, contract: parseInt(fd.get('contract')) || 0,
      dispatch: parseInt(fd.get('dispatch')) || 0, notes: fd.get('notes') };
    await api.put(`/api/v1/staffing/${id}`, d);
    loadStaffing();
  });
}

async function deleteStaffing(id) {
  if (!confirm('배치 기록을 삭제하시겠습니까?')) return;
  await api.del(`/api/v1/staffing/${id}`);
  loadStaffing();
}
