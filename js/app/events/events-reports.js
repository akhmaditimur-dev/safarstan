// ============ APP: СОБЫТИЯ — ЖАЛОБЫ И МОДЕРАЦИЯ ============

let _reportTarget = null; // { type, id, label }
let _reportReason = null;

// === Открытие модалки жалобы ===
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-report]');
    if (!btn) return;

    if (!PLAYER) {
        if (typeof showWarningToast === 'function') showWarningToast('Войди в аккаунт');
        return;
    }

    _reportTarget = {
        type: btn.dataset.reportType,
        id: btn.dataset.report,
        label: btn.dataset.reportLabel || 'Объект',
    };
    _reportReason = null;

    // Сброс
    const modal = document.getElementById('reportModal');
    const label = document.getElementById('reportTargetLabel');
    const comment = document.getElementById('reportComment');
    const errorEl = document.getElementById('reportError');
    const submitBtn = document.getElementById('reportSubmit');

    if (label) label.textContent = _reportTarget.label;
    if (comment) comment.value = '';
    if (errorEl) errorEl.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;

    document.querySelectorAll('.report-reason').forEach(b => b.classList.remove('active'));

    if (modal) modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// === Выбор причины ===
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.report-reason');
    if (!btn) return;

    document.querySelectorAll('.report-reason').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _reportReason = btn.dataset.reason;

    const submitBtn = document.getElementById('reportSubmit');
    if (submitBtn) submitBtn.disabled = false;
});

// === Отправка жалобы ===
document.addEventListener('click', async (e) => {
    if (!e.target.closest('#reportSubmit')) return;
    if (!_reportTarget || !_reportReason) return;
    if (!PLAYER) return;

    const btn = document.getElementById('reportSubmit');
    const errorEl = document.getElementById('reportError');
    const comment = document.getElementById('reportComment')?.value.trim() || null;

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i> Отправка...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Проверяем — не жаловался ли уже
    const already = await hasReported(PLAYER.playerId, _reportTarget.type, _reportTarget.id);
    if (already) {
        errorEl.textContent = 'Ты уже жаловался на это';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Отправить жалобу';
        return;
    }

    const result = await createReport(
        PLAYER.playerId,
        _reportTarget.type,
        _reportTarget.id,
        _reportReason,
        comment
    );

    btn.disabled = false;
    btn.innerHTML = 'Отправить жалобу';

    if (result.error) {
        errorEl.textContent = 'Не удалось отправить';
        errorEl.style.display = 'block';
        return;
    }

    document.getElementById('reportModal').style.display = 'none';
    if (typeof showWarningToast === 'function') showWarningToast('✅ Жалоба отправлена');
});

// === Закрытие модалки жалобы ===
document.addEventListener('click', (e) => {
    if (e.target.closest('#reportClose')) {
        document.getElementById('reportModal').style.display = 'none';
    }
    if (e.target.id === 'reportModal') {
        e.target.style.display = 'none';
    }
});

// === Модалка жалоб (для админа) ===
document.addEventListener('click', async (e) => {
    if (e.target.closest('#adminReportsClose')) {
        document.getElementById('adminReportsModal').style.display = 'none';
        return;
    }
    if (e.target.id === 'adminReportsModal') {
        e.target.style.display = 'none';
        return;
    }
});

async function openAdminReportsModal() {
    if (!PLAYER) return;
    const modal = document.getElementById('adminReportsModal');
    const list = document.getElementById('adminReportsList');
    if (!modal || !list) return;

    list.innerHTML = '<div class="dashboard-empty">⏳ Загрузка...</div>';
    modal.style.display = 'flex';

    const reports = await loadAllReports('pending');

    if (!reports || reports.length === 0) {
        list.innerHTML = '<div class="dashboard-empty">Жалоб пока нет</div>';
        return;
    }

    const reasonLabels = {
        spam: 'Спам / реклама',
        abuse: 'Оскорбления',
        fake: 'Фейк',
        other: 'Другое',
    };

    list.innerHTML = reports.map(r => {
        const reporter = r.reporter || {};
        const reasonText = reasonLabels[r.reason] || r.reason;

        return `
            <div class="friend-item">
                <div class="friend-item__avatar">${reporter.avatar || '🧑‍💼'}</div>
                <div class="friend-item__info">
                    <div class="friend-item__name">${escapeHtml(reporter.name || 'Игрок')}</div>
                    <div class="friend-item__sub">
                        ${escapeHtml(reasonText)} · ${escapeHtml(r.target_type)} · ${escapeHtml(String(r.target_id).slice(0, 30))}
                    </div>
                    ${r.comment ? `<div class="friend-item__sub" style="opacity:0.7;margin-top:4px;">"${escapeHtml(r.comment)}"</div>` : ''}
                </div>
                <div class="friend-item__actions">
                    <button class="btn btn-primary btn-sm" data-resolve-report="${r.id}">Принять</button>
                    <button class="btn btn-secondary btn-sm" data-reject-report="${r.id}">Отклонить</button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === Действия админа ===
document.addEventListener('click', async (e) => {
    const resolveBtn = e.target.closest('[data-resolve-report]');
    if (resolveBtn) {
        await resolveReport(resolveBtn.dataset.resolveReport, PLAYER.playerId, 'resolved');
        openAdminReportsModal();
        return;
    }

    const rejectBtn = e.target.closest('[data-reject-report]');
    if (rejectBtn) {
        await resolveReport(rejectBtn.dataset.rejectReport, PLAYER.playerId, 'rejected');
        openAdminReportsModal();
        return;
    }
});