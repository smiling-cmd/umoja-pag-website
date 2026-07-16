let token = localStorage.getItem('umoja_admin_token');
  let currentPage = 1;
  let currentMembers = []; // holds the most recently loaded registration rows, so the edit modal can look up a row's data without a second API call
  let selectedIds = new Set(); // tracks which registration ids are checked for bulk actions
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
    if (!data.success) {
      const msg = Array.isArray(data.errors) && data.errors.length
        ? data.errors.join(' ')
        : (data.message || 'Request failed');
      throw new Error(msg);
    }
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
    tbody.innerHTML = '<tr><td colspan="10" class="loading">Loading...</td></tr>';
    selectedIds.clear();
    updateBulkBar();

    try {
      const data = await api('/api/admin/registrations?' + params);
      currentMembers = data.registrations;
      if (!data.registrations.length) {
        tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state"><div class="icon">🔍</div><div>No registrations found</div></div></td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = data.registrations.map(r => `
        <tr>
          <td><input type="checkbox" class="row-check" data-id="${r.id}" onchange="toggleSelect(${r.id}, this)" ${selectedIds.has(r.id) ? 'checked' : ''}></td>
          <td style="color:var(--muted)">#${r.id}</td>
          <td><strong>${r.first_name} ${r.last_name}</strong>${r.email ? `<br><span style="font-size:11px;color:var(--muted)">${r.email}</span>` : ''}</td>
          <td>${r.phone}</td>
          <td>${r.area || '—'}</td>
          <td>${r.reg_for}</td>
          <td>${r.age_group}</td>
          <td>
            <select class="status-select" onchange="updateStatus(${r.id}, this.value)">
              <option value="pending"   ${r.status==='pending'   ?'selected':''}>⏳ Pending</option>
              <option value="contacted" ${r.status==='contacted' ?'selected':''}>📞 Contacted</option>
              <option value="active"    ${r.status==='active'    ?'selected':''}>✅ Active</option>
              <option value="inactive"  ${r.status==='inactive'  ?'selected':''}>⛔ Inactive</option>
            </select>
          </td>
          <td style="font-size:12px;color:var(--muted)">${r.created_at.split(' ')[0]}</td>
          <td>
            <button class="edit-btn" onclick="openEditModal(${r.id})" title="Edit">✎</button>
            <button class="delete-btn" onclick="deleteReg(${r.id},'${r.first_name} ${r.last_name}')" title="Delete">🗑</button>
          </td>
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
      tbody.innerHTML = `<tr><td colspan="10" style="color:var(--red);padding:20px">${e.message}</td></tr>`;
    }
  }

  function changePage(p) { currentPage = p; loadMembers(); }
  function debounceLoad() { clearTimeout(searchTimer); searchTimer = setTimeout(() => { currentPage = 1; loadMembers(); }, 400); }

  async function updateStatus(id, status) {
    try {
      await api(`/api/admin/registrations/${id}/status`, 'PATCH', { status });
      loadStats();
    } catch(e) { alert('Failed to update status: ' + e.message); }
  }

  async function deleteReg(id, name) {
    if (!confirm(`Delete registration for ${name}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/registrations/${id}`, 'DELETE');
      loadMembers();
      loadStats();
    } catch(e) { alert('Failed to delete: ' + e.message); }
  }
  // ── Bulk Selection ───────────────────────────────────────
  function toggleSelect(id, checkbox) {
    if (checkbox.checked) selectedIds.add(id);
    else selectedIds.delete(id);
    updateBulkBar();
  }

  function toggleSelectAll(checkbox) {
    const boxes = document.querySelectorAll('.row-check');
    boxes.forEach(box => {
      box.checked = checkbox.checked;
      const id = parseInt(box.dataset.id, 10);
      if (checkbox.checked) selectedIds.add(id);
      else selectedIds.delete(id);
    });
    updateBulkBar();
  }

  function clearSelection() {
    selectedIds.clear();
    document.querySelectorAll('.row-check').forEach(box => box.checked = false);
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
    updateBulkBar();
  }

  function updateBulkBar() {
    const bar = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    if (selectedIds.size > 0) {
      bar.classList.add('active');
      count.textContent = `${selectedIds.size} selected`;
    } else {
      bar.classList.remove('active');
    }
  }

  async function applyBulkStatus() {
    if (selectedIds.size === 0) return;
    const status = document.getElementById('bulkStatusSelect').value;
    try {
      await api('/api/admin/bulk-status', 'POST', { ids: Array.from(selectedIds), status });
      loadMembers();
      loadStats();
    } catch (e) {
      alert('Failed to update statuses: ' + e.message);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected registration(s)? This cannot be undone.`)) return;
    try {
      await api('/api/admin/bulk-delete', 'POST', { ids: Array.from(selectedIds) });
      loadMembers();
      loadStats();
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    }
  }
  // ── Edit Modal ───────────────────────────────────────────
  function openEditModal(id) {
    const reg = currentMembers.find(r => r.id === id);
    if (!reg) { alert('Could not find that registration — try refreshing.'); return; }

    document.getElementById('editId').value        = reg.id;
    document.getElementById('editFirstName').value = reg.first_name || '';
    document.getElementById('editLastName').value  = reg.last_name  || '';
    document.getElementById('editEmail').value     = reg.email      || '';
    document.getElementById('editPhone').value     = reg.phone      || '';
    document.getElementById('editArea').value      = reg.area       || '';
    document.getElementById('editRegFor').value    = reg.reg_for    || '';
    document.getElementById('editAgeGroup').value  = reg.age_group  || '';
    document.getElementById('editNotes').value     = reg.notes      || '';

    document.getElementById('editError').style.display = 'none';
    document.getElementById('editModalOverlay').style.display = 'flex';
  }

  function closeEditModal() {
    document.getElementById('editModalOverlay').style.display = 'none';
  }

  async function saveEditModal() {
    const id = document.getElementById('editId').value;
    const errEl = document.getElementById('editError');
    errEl.style.display = 'none';

    const payload = {
      first_name: document.getElementById('editFirstName').value.trim(),
      last_name:  document.getElementById('editLastName').value.trim(),
      email:      document.getElementById('editEmail').value.trim(),
      phone:      document.getElementById('editPhone').value.trim(),
      area:       document.getElementById('editArea').value.trim(),
      reg_for:    document.getElementById('editRegFor').value,
      age_group:  document.getElementById('editAgeGroup').value.trim(),
      notes:      document.getElementById('editNotes').value.trim(),
    };

    if (!payload.first_name || !payload.last_name || !payload.phone) {
      errEl.textContent = 'First name, last name, and phone are required.';
      errEl.style.display = 'block';
      return;
    }

    try {
      await api(`/api/admin/registrations/${id}`, 'PUT', payload);
      closeEditModal();
      loadMembers();
      loadStats();
    } catch (e) {
      errEl.textContent = e.message || 'Failed to save changes.';
      errEl.style.display = 'block';
    }
  }
  // ── Manage Admins ────────────────────────────────────────
  function getCurrentAdminId() {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).sub;
    } catch (e) {
      return null;
    }
  }

  async function openAdminsModal() {
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('adminsError').style.display = 'none';
    document.getElementById('adminsModalOverlay').style.display = 'flex';
    await loadAdminsList();
  }

  function closeAdminsModal() {
    document.getElementById('adminsModalOverlay').style.display = 'none';
  }

  async function loadAdminsList() {
    const wrap = document.getElementById('adminsListWrap');
    wrap.innerHTML = '<div class="loading">Loading...</div>';
    try {
      const data = await api('/api/admin/admins-list');
      const currentId = getCurrentAdminId();

      if (!data.admins.length) {
        wrap.innerHTML = '<div class="empty-state">No admins found</div>';
        return;
      }

      wrap.innerHTML = data.admins.map(a => `
        <div class="admin-row">
          <div>
            <div class="admin-row-name">${a.username}${String(a.id) === String(currentId) ? '<span class="admin-row-you">You</span>' : ''}</div>
            <div class="admin-row-date">Added ${a.created_at ? a.created_at.split(' ')[0] : '—'}</div>
          </div>
          ${String(a.id) === String(currentId)
            ? ''
            : `<button class="delete-btn" onclick="deleteAdmin(${a.id}, '${a.username}')" title="Remove">🗑</button>`
          }
        </div>
      `).join('');
    } catch (e) {
      wrap.innerHTML = `<div style="color:var(--red);padding:10px">${e.message}</div>`;
    }
  }

  async function createAdmin() {
    const errEl = document.getElementById('adminsError');
    errEl.style.display = 'none';

    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;

    if (!username || !password) {
      errEl.textContent = 'Username and password are required.';
      errEl.style.display = 'block';
      return;
    }
    if (password.length < 8) {
      errEl.textContent = 'Password must be at least 8 characters.';
      errEl.style.display = 'block';
      return;
    }

    try {
      await api('/api/admin/admins-create', 'POST', { username, password });
      document.getElementById('newAdminUsername').value = '';
      document.getElementById('newAdminPassword').value = '';
      await loadAdminsList();
    } catch (e) {
      errEl.textContent = e.message || 'Failed to create admin.';
      errEl.style.display = 'block';
    }
  }

  async function deleteAdmin(id, username) {
    if (!confirm(`Remove admin "${username}"? They will no longer be able to sign in.`)) return;
    try {
      await api(`/api/admin/admins/${id}`, 'DELETE');
      await loadAdminsList();
    } catch (e) {
      alert('Failed to remove admin: ' + e.message);
    }
  }

  async function exportCSV() {
    if (!token) {
      alert('Please sign in before exporting data.');
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
      alert(e.message || 'Export failed. Please try again.');
    }
  }

  // ── Analytics ────────────────────────────────────────────
  async function loadAnalytics() {
    try {
      const data = await api('/api/admin/stats');

      const monthRows = data.byMonth.map(r => ({ ...r, label: r.month }));
      renderBars('monthChart', monthRows, 'label');

      const statusLabels = { pending: '⏳ Pending', contacted: '📞 Contacted', active: '✅ Active', inactive: '⛔ Inactive' };
      const statusRows = data.byStatus.map(r => ({ ...r, label: statusLabels[r.status] || r.status }));
      renderBars('statusChart', statusRows, 'label');

      const ageRows = data.byAgeGroup.map(r => ({ ...r, label: r.age_group }));
      renderBars('ageChart', ageRows, 'label');
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