// ============ UI: ТОСТЫ ============

function showXPToast(xp, reason) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.innerHTML = `+${xp} XP · <small>${reason}</small>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('fade-out'), 2200);
    setTimeout(() => toast.remove(), 2600);
}

function showWarningToast(message) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.style.background = 'linear-gradient(135deg, #f59e0b, #ea580c)';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('fade-out'), 2200);
    setTimeout(() => toast.remove(), 2600);
}

function showLevelUp(level) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';
    toast.innerHTML = `🎉 Новый уровень: ${level}!`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('fade-out'), 2500);
    setTimeout(() => toast.remove(), 2900);
}

function showBadgeToast(badge) {
    if (!badge) return;
    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML = `
        <span class="badge-toast-icon">${badge.icon}</span>
        🎖 Новый бейдж:<br><strong>${badge.name}</strong>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('fade-out'), 3000);
    setTimeout(() => toast.remove(), 3400);
}

// ============================================
// КАСТОМНЫЙ CONFIRM (замена window.confirm)
// ============================================
let _confirmResolve = null;

function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (!modal || !msgEl) {
            resolve(window.confirm(message));
            return;
        }

        if (titleEl) titleEl.textContent = options.title || 'Подтверждение';
        msgEl.textContent = message;
        if (okBtn) okBtn.textContent = options.okText || 'Да';
        if (cancelBtn) cancelBtn.textContent = options.cancelText || 'Отмена';

        modal.style.display = 'flex';

        _confirmResolve = (result) => {
            modal.style.display = 'none';
            _confirmResolve = null;
            resolve(result);
        };

        okBtn.onclick = () => { if (_confirmResolve) _confirmResolve(true); };
        cancelBtn.onclick = () => { if (_confirmResolve) _confirmResolve(false); };

        modal.onclick = (e) => {
            if (e.target.id === 'confirmModal' && _confirmResolve) {
                _confirmResolve(false);
            }
        };
    });
}