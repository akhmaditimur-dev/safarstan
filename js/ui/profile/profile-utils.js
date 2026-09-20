// ============ UI: PROFILE — ОБЩИЕ ХЕЛПЕРЫ ============

// Универсальный рендер аватара: URL → <img>, эмодзи → текст
function renderAvatar(el, avatar) {
    if (!el) return;
    if (!avatar) {
        el.innerHTML = '🧑‍💼';
        return;
    }
    if (avatar.startsWith('http')) {
        el.innerHTML = `<img src="${avatar}" alt="avatar">`;
    } else {
        el.textContent = avatar;
    }
}

// Версия-строка (для вставки в HTML)
function renderAvatarHtml(avatar) {
    if (!avatar) return '🧑‍💼';
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
        return `<img src="${avatar}" alt="" loading="lazy">`;
    }
    return avatar;
}