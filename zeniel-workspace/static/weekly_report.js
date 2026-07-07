/* ============================================================
   주간보고 (Weekly Report) 기능
   ============================================================ */

let _wrCurrentId = null;
let _wrReports = [];

// navigate() override — logistics.js의 것을 확장
(function () {
  const _prevNavigate = window.navigate;
  window.navigate = function (page) {
    if (page === 'weekly-report') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const sec = document.getElementById('page-weekly-report');
      if (sec) sec.classList.add('active');
      const nav = document.querySelector('[data-page="weekly-report"]');
      if (nav) nav.classList.add('active');
      document.getElementById('page-title').textContent = '주간보고';
      loadWeeklyReportList();
    } else {
      _prevNavigate(page);
    }
  };
})();

// ── 목록 로드 ────────────────────────────────────────────────
async function loadWeeklyReportList() {
  const res = await fetch('/api/v1/weekly-reports');
  _wrReports = await res.json();
  const el = document.getElementById('wr-list');
  if (!el) return;
  el.innerHTML = '';
  _wrReports.forEach(r => {
    const d = document.createElement('div');
    d.className = 'wr-list-item' + (_wrCurrentId === r.id ? ' active' : '');
    d.innerHTML = `<div style="font-weight:600">${r.title || '(제목 없음)'}</div>
      <div class="wr-item-week">${r.team || ''} · ${r.week_label || ''}</div>`;
    d.onclick = () => openWeeklyReport(r.id);
    el.appendChild(d);
  });
}

// ── 보고서 열기 ───────────────────────────────────────────────
async function openWeeklyReport(id) {
  _wrCurrentId = id;
  const res = await fetch(`/api/v1/weekly-reports/${id}`);
  const report = await res.json();
  renderWrEditor(report);
  document.querySelectorAll('.wr-list-item').forEach((el, i) => {
    el.classList.toggle('active', _wrReports[i]?.id === id);
  });
}

// ── 새 보고서 생성 ────────────────────────────────────────────
async function newWeeklyReport() {
  const today = new Date();
  const year = today.getFullYear();
  const week = getISOWeek(today);
  const weekLabel = `${year}-W${String(week).padStart(2, '0')}`;
  const payload = {
    title: `전략사업팀 주간보고`,
    team: '전략사업팀',
    week_label: weekLabel,
  };
  const res = await fetch('/api/v1/weekly-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const report = await res.json();
  _wrCurrentId = report.id;
  await loadWeeklyReportList();
  renderWrEditor(report);
}

// ── 에디터 렌더링 ─────────────────────────────────────────────
function renderWrEditor(report) {
  document.getElementById('wr-placeholder').style.display = 'none';
  document.getElementById('wr-editor-wrap').style.display = 'block';
  document.getElementById('wr-title-input').value = report.title || '';
  document.getElementById('wr-team-input').value = report.team || '';
  // week input value: "YYYY-Www"
  if (report.week_label) {
    document.getElementById('wr-week-input').value = report.week_label;
  }
  renderWrTable(report.items || []);
}

function renderWrTable(items) {
  const tbody = document.getElementById('wr-tbody');
  tbody.innerHTML = '';
  items.forEach(item => {
    const done = safeJsonParse(item.done_items, []);
    const plan = safeJsonParse(item.plan_items, []);
    if (done.length === 0) done.push('');
    if (plan.length === 0) plan.push('');

    const tr = document.createElement('tr');
    tr.dataset.itemId = item.id;
    tr.setAttribute('data-item-id', item.id);

    // 카테고리 셀
    tr.innerHTML = `
      <td class="wr-cat-cell">
        <div>${escHtml(item.category || '')}</div>
        <div class="wr-cat-actions">
          <button class="wr-del-cat-btn" onclick="deleteWrCategory(${item.id})">삭제</button>
        </div>
      </td>
      <td class="wr-items-cell" id="done-cell-${item.id}"></td>
      <td class="wr-items-cell" id="plan-cell-${item.id}"></td>
    `;
    tbody.appendChild(tr);

    renderItemList(`done-cell-${item.id}`, done, item.id, 'done');
    renderItemList(`plan-cell-${item.id}`, plan, item.id, 'plan');
  });
}

function renderItemList(cellId, items, itemId, type) {
  const cell = document.getElementById(cellId);
  cell.innerHTML = '';
  items.forEach((text, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:2px;margin-bottom:2px';
    row.innerHTML = `<input class="wr-item-input" data-item="${itemId}" data-type="${type}" data-idx="${idx}"
        value="${escAttr(text)}" placeholder="항목 입력..." oninput="onWrItemInput(this)"/>
      <button class="wr-del-item-btn" onclick="removeWrLine(${itemId},'${type}',${idx})" title="삭제">✕</button>`;
    cell.appendChild(row);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'wr-add-item-btn';
  addBtn.textContent = '+ 항목 추가';
  addBtn.onclick = () => addWrLine(itemId, type);
  cell.appendChild(addBtn);
}

// ── 항목 조작 ─────────────────────────────────────────────────
function getWrItemValues(itemId, type) {
  const inputs = document.querySelectorAll(`input[data-item="${itemId}"][data-type="${type}"]`);
  return Array.from(inputs).map(i => i.value);
}

function onWrItemInput(_input) {
  // 자동저장 없이 수동저장 방식 — 입력만 추적
}

async function addWrLine(itemId, type) {
  const done = getWrItemValues(itemId, 'done');
  const plan = getWrItemValues(itemId, 'plan');
  if (type === 'done') done.push('');
  else plan.push('');
  await patchWrItem(itemId, done, plan);
  await openWeeklyReport(_wrCurrentId);
}

async function removeWrLine(itemId, type, idx) {
  const done = getWrItemValues(itemId, 'done');
  const plan = getWrItemValues(itemId, 'plan');
  if (type === 'done') done.splice(idx, 1);
  else plan.splice(idx, 1);
  await patchWrItem(itemId, done, plan);
  await openWeeklyReport(_wrCurrentId);
}

async function patchWrItem(itemId, done, plan) {
  await fetch(`/api/v1/weekly-reports/${_wrCurrentId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      done_items: JSON.stringify(done.filter(v => v !== undefined)),
      plan_items: JSON.stringify(plan.filter(v => v !== undefined)),
    }),
  });
}

// ── 카테고리 추가/삭제 ────────────────────────────────────────
async function addWrCategory() {
  const name = prompt('카테고리 이름을 입력하세요 (예: 시장동향)');
  if (!name) return;
  await fetch(`/api/v1/weekly-reports/${_wrCurrentId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: name, sort_order: 99, done_items: '[]', plan_items: '[]' }),
  });
  await openWeeklyReport(_wrCurrentId);
}

async function deleteWrCategory(itemId) {
  if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
  await fetch(`/api/v1/weekly-reports/${_wrCurrentId}/items/${itemId}`, { method: 'DELETE' });
  await openWeeklyReport(_wrCurrentId);
}

// ── 보고서 저장 ───────────────────────────────────────────────
async function saveWeeklyReport() {
  if (!_wrCurrentId) return;
  // 1) 메타 저장
  await fetch(`/api/v1/weekly-reports/${_wrCurrentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: document.getElementById('wr-title-input').value,
      team: document.getElementById('wr-team-input').value,
      week_label: document.getElementById('wr-week-input').value,
    }),
  });
  // 2) 각 항목 내용 저장
  const rows = document.querySelectorAll('#wr-tbody tr[data-item-id]');
  for (const row of rows) {
    const itemId = parseInt(row.dataset.itemId);
    const done = getWrItemValues(itemId, 'done');
    const plan = getWrItemValues(itemId, 'plan');
    await patchWrItem(itemId, done, plan);
  }
  await loadWeeklyReportList();
  alert('저장되었습니다.');
}

// ── 보고서 삭제 ───────────────────────────────────────────────
async function deleteWeeklyReport() {
  if (!_wrCurrentId || !confirm('이 보고서를 삭제하시겠습니까?')) return;
  await fetch(`/api/v1/weekly-reports/${_wrCurrentId}`, { method: 'DELETE' });
  _wrCurrentId = null;
  document.getElementById('wr-placeholder').style.display = '';
  document.getElementById('wr-editor-wrap').style.display = 'none';
  await loadWeeklyReportList();
}

// ── 이미지 내보내기 (PPT 붙여넣기용) ─────────────────────────
async function exportWrImage() {
  const el = document.getElementById('wr-table-wrap');
  if (!el) return;

  // 먼저 현재 입력값 저장
  const rows = document.querySelectorAll('#wr-tbody tr[data-item-id]');
  for (const row of rows) {
    const itemId = parseInt(row.dataset.itemId);
    const done = getWrItemValues(itemId, 'done');
    const plan = getWrItemValues(itemId, 'plan');
    await patchWrItem(itemId, done, plan);
  }

  // input → 텍스트로 변환한 클론 생성 (캡처용)
  const clone = el.cloneNode(true);
  clone.querySelectorAll('input.wr-item-input').forEach(inp => {
    const span = document.createElement('span');
    span.textContent = inp.value;
    span.style.cssText = 'display:block;font-size:0.83rem;line-height:1.6;padding:2px 0';
    inp.replaceWith(span);
  });
  clone.querySelectorAll('button').forEach(b => b.remove());
  clone.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;padding:0';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    const title = document.getElementById('wr-title-input').value || '주간보고';
    const week = document.getElementById('wr-week-input').value || '';
    link.download = `${title}_${week}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    document.body.removeChild(clone);
  }
}

// ── 유틸 ─────────────────────────────────────────────────────
function safeJsonParse(str, fallback) {
  try { return JSON.parse(str) || fallback; } catch { return fallback; }
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
