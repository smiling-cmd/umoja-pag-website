let token = localStorage.getItem('umoja_admin_token');
  let currentPage = 1;
  let searchTimer;
  const loginPass = document.getElementById('loginPass');
  const loginWatcher = document.getElementById('loginWatcher');
  const watcherPupils = Array.from(document.querySelectorAll('.watcher-pupil'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let watcherBlinkTimeout = null;

  function setWatcherClosed(closed) {
    if (!loginWatcher) return;
    loginWatcher.classList.toggle('eyes-closed', closed);
  }

  function updateWatcherEyes(event) {
    if (!loginWatcher || prefersReducedMotion.matches) return;
    const offsetX = ((event.clientX / window.innerWidth) - 0.5) * 14;
    const offsetY = ((event.clientY / window.innerHeight) - 0.5) * 7;

    watcherPupils.forEach((pupil) => {
      pupil.style.transform = `translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px)`;
    });
  }

  function blinkWatcher() {
    if (!loginWatcher || document.activeElement === loginPass) return;
    setWatcherClosed(true);
    clearTimeout(watcherBlinkTimeout);
    watcherBlinkTimeout = setTimeout(() => setWatcherClosed(false), 180);
  }

  if (loginWatcher && loginPass) {
    document.addEventListener('mousemove', updateWatcherEyes, { passive: true });
    loginPass.addEventListener('focus', () => setWatcherClosed(true));
    loginPass.addEventListener('blur', () => setWatcherClosed(false));

    if (!prefersReducedMotion.matches) {
      window.setInterval(blinkWatcher, 3200);
    }
  }

  // ── Auth ─────────────────────────────────────────────────
  async function doLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const errEl    = document.getElementById('loginError');
    errEl.style.display = 'none';

    if (!username || !password) {
      errEl.textContent = 'Please enter your username and password.';
      errEl.style.display = 'block';
      return;
    }

    try {
      const res  = await api('/api/auth/login', 'POST', { username, password }, false);
      token      = res.token;
      localStorage.setItem('umoja_admin_token', token);
      document.getElementById('adminName').textContent = res.username;
      document.getElementById('adminUser').textContent  = res.username;
      showApp();
    } catch (e) {
      errEl.textContent = e.message || 'Login failed.';
      errEl.style.display = 'block';
    }
  }

  function logout() {
    localStorage.removeItem('umoja_admin_token');
    token = null;
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginWrap').style.display = 'flex';
  }

  function showApp() {
    document.getElementById('loginWrap').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    loadStats();
    loadMembers();
  }

  // ── API Helper ───────────────────────────────────────────
  async function api(url, method = 'GET', body = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  }

  // ── Tabs ─────────────────────────────────────────────────
  function showTab(name) {
    document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    document.querySelectorAll('.sidebar-nav a')[['dashboard','members','analytics'].indexOf(name)].classList.add('active');
    const titles = { dashboard: 'Dashboard', members: 'Members', analytics: 'Analytics' };
    document.getElementById('pageTitle').textContent = titles[name];
    if (name === 'analytics') loadAnalytics();
    if (name === 'members')   loadMembers();
  }

  // ── Stats ────────────────────────────────────────────────
  async function loadStats() {
    try {
      const data = await api('/api/admin/stats');
      document.getElementById('statTotal').textContent   = data.stats.total;
      document.getElementById('statMonth').textContent   = data.stats.thisMonth;
      document.getElementById('statWeek').textContent    = data.stats.thisWeek;
      document.getElementById('statPending').textContent = data.stats.pending;

      renderBars('ministryChart', data.byMinistry, 'reg_for');
      renderBars('areaChart',     data.byArea,     'area');
    } catch(e) { console.error(e); }
  }

  function renderBars(elId, rows, labelKey) {
    const el  = document.getElementById(elId);
    const max = rows.length ? Math.max(...rows.map(r => r.count)) : 1;
    if (!rows.length) { el.innerHTML = '<div class="empty-state"><div>No data yet</div></div>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="bar-row">
        <div class="bar-label" title="${r[labelKey]}">${r[labelKey] || 'Unknown'}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.count/max*100).toFixed(1)}%"></div></div>
        <div class="bar-count">${r.count}</div>
      </div>
    `).join('');
  }

  // ── Toast notifications (replaces native browser alerts) ──
  function showToast(message, type = 'error', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      alert(message);
      return;
    }
    const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message"></span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;
    toast.querySelector('.toast-message').textContent = message;

    const remove = () => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 180);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    if (duration > 0) setTimeout(remove, duration);

    container.appendChild(toast);
  }

  // ── Status progression (pending → contacted → active; inactive is terminal) ──
  const STATUS_FLOW = ['pending', 'contacted', 'active', 'inactive'];
  const STATUS_LABELS = {
    pending:   '⏳ Pending',
    contacted: '📞 Contacted',
    active:    '✅ Active',
    inactive:  '⛔ Inactive',
  };

  function statusOptionsHtml(current) {
    const idx = STATUS_FLOW.indexOf(current);
    const allowed = idx === -1 ? STATUS_FLOW : STATUS_FLOW.slice(idx);
    return allowed
      .map((s) => `<option value="${s}" ${s === current ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`)
      .join('');
  }

  // ── Members ──────────────────────────────────────────────
  async function loadMembers() {
    const search  = document.getElementById('searchInput').value;
    const reg_for = document.getElementById('regForFilter').value;
    const status  = document.getElementById('statusFilter').value;
    const params  = new URLSearchParams({ page: currentPage, limit: 20 });
    if (search)  params.set('search',  search);
    if (reg_for) params.set('reg_for', reg_for);
    if (status)  params.set('status',  status);

    const tbody = document.getElementById('membersTable');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading...</td></tr>';

    try {
      const data = await api('/api/admin/registrations?' + params);
      if (!data.registrations.length) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="icon">🔍</div><div>No registrations found</div></div></td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = data.registrations.map((r, i) => `
        <tr>
          <td style="color:var(--muted)">#${(currentPage - 1) * 20 + i + 1}</td>
          <td><strong>${r.first_name} ${r.last_name}</strong>${r.email ? `<br><span style="font-size:11px;color:var(--muted)">${r.email}</span>` : ''}</td>
          <td>${r.phone}</td>
          <td>${r.area || '—'}</td>
          <td>${r.reg_for}</td>
          <td>${r.age_group}</td>
          <td>
            <select class="status-select" onchange="updateStatus(${r.id}, this.value)">
              ${statusOptionsHtml(r.status)}
            </select>
          </td>
          <td style="font-size:12px;color:var(--muted)">${r.created_at.split(' ')[0]}</td>
          <td><button class="delete-btn" onclick="deleteReg(${r.id},'${r.first_name} ${r.last_name}')" title="Delete">🗑</button></td>
        </tr>
      `).join('');

      // Pagination
      const pag = document.getElementById('pagination');
      pag.innerHTML = '';
      if (data.pages > 1) {
        pag.innerHTML = `<span class="page-info">Page ${data.page} of ${data.pages} (${data.total} total)</span>`;
        if (data.page > 1) pag.innerHTML += `<button class="page-btn" onclick="changePage(${data.page-1})">← Prev</button>`;
        if (data.page < data.pages) pag.innerHTML += `<button class="page-btn" onclick="changePage(${data.page+1})">Next →</button>`;
      }
    } catch(e) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--red);paddingps
      :20px">${e.message}</td></tr>`;
    }
  }

  function changePage(p) { currentPage = p; loadMembers(); }
  function debounceLoad() { clearTimeout(searchTimer); searchTimer = setTimeout(() => { currentPage = 1; loadMembers(); }, 400); }

  async function updateStatus(id, status) {
    try {
      await api(`/api/admin/registrations/${id}/status`, 'PATCH', { status });
      loadStats();
      loadMembers();
    } catch(e) {
      showToast('Failed to update status: ' + e.message, 'error');
      loadMembers(); // re-sync the dropdown with the real (unchanged) status
    }
  }

  async function deleteReg(id, name) {
    if (!confirm(`Delete registration for ${name}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/registrations/${id}`, 'DELETE');
      loadMembers();
      loadStats();
    } catch(e) { showToast('Failed to delete: ' + e.message, 'error'); }
  }

  async function exportCSV() {
    if (!token) {
      showToast('Please sign in before exporting data.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/export', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Export failed.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `umoja-registrations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e.message || 'Export failed. Please try again.', 'error');
    }
  }

  // ── Analytics ────────────────────────────────────────────
  async function loadAnalytics() {
    try {
      const data = await api('/api/admin/stats');
      const rows = data.byMonth.map(r => ({ ...r, label: r.month }));
      renderBars('monthChart', rows, 'label');
    } catch(e) { console.error(e); }
  }

  // ── Init ─────────────────────────────────────────────────
  window.addEventListener('load', () => {
    if (token) {
      // Try to use existing token
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            document.getElementById('adminName').textContent = payload.username;
            document.getElementById('adminUser').textContent  = payload.username;
            showApp();
          } else { logout(); }
        })
        .catch(() => logout());
    }
  });