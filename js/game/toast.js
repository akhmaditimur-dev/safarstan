// ============ UI: ТОСТЫ ============

function showXPToast(xp, reason) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.innerHTML = `+${xp} XP · <small>${reason}</small>`;
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