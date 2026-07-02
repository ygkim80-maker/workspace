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
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  const loaders = {
    dashboard: loadDashboard, leads: loadLeads, customers: loadCustomers,
    pipeline: loadPipeline, projects: loadProjects, contracts: loadContracts,
    sites: loadSites, issues: loadIssues, meetings: loadMeetings,
    emails: loadEmails, tasks: loadTasks, schedules: loadSchedules,
    insights: loadInsights, settings: loadSettings,
    worklog: loadWorklog, kpi: loadKpi, documents: loadDocuments, feed: loadFeed,
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
