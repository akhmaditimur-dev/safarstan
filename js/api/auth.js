// ============ API: АВТОРИЗАЦИЯ ============

// Регистрация по email
async function signUp(email, password, metadata = {}) {
    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: metadata,
        },
    });
    if (error) return { error: error.message };
    return { user: data.user, session: data.session };
}

// Вход по email
async function signIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) return { error: error.message };
    return { user: data.user, session: data.session };
}

// Выход
async function signOut() {
    await _supabase.auth.signOut();
    localStorage.removeItem('safarstan_player');
    location.reload();
}

// Получить текущего пользователя
async function getCurrentUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    return user;
}

// Получить текущую сессию
async function getCurrentSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
}

// ============================================
// СМЕНА EMAIL
// ============================================
async function changeEmail(newEmail) {
    const { data, error } = await _supabase.auth.updateUser({
        email: newEmail,
    });

    if (error) {
        console.warn('Ошибка смены email:', error);
        return { error: error.message };
    }

    return { ok: true, user: data.user };
}

// ============================================
// СМЕНА ПАРОЛЯ
// ============================================
async function changePassword(newPassword) {
    const { data, error } = await _supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        console.warn('Ошибка смены пароля:', error);
        return { error: error.message };
    }

    return { ok: true, user: data.user };
}

// ============================================
// ПОЛУЧИТЬ EMAIL ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
// ============================================
async function getCurrentUserEmail() {
    const { data, error } = await _supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.email;
}