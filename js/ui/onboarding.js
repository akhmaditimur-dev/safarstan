// ============ UI: ОНБОРДИНГ ============

let _onboardingSlide = 0;
const ONBOARDING_TOTAL = 4;

// Показать, если ещё не проходил
function maybeShowOnboarding() {
    if (!PLAYER) return;
    if (PLAYER.onboardingCompleted === true) return;

    // Небольшая задержка — чтобы дашборд успел отрисоваться
    setTimeout(() => {
        openOnboarding();
    }, 600);
}

function openOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;

    _onboardingSlide = 0;
    updateOnboardingSlide();

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateOnboardingSlide() {
    document.querySelectorAll('.onboarding-slide').forEach(el => {
        const idx = parseInt(el.dataset.slide);
        el.style.display = idx === _onboardingSlide ? 'block' : 'none';
    });

    document.querySelectorAll('.onboarding-dot').forEach(el => {
        const idx = parseInt(el.dataset.dot);
        el.classList.toggle('active', idx === _onboardingSlide);
    });

    const nextBtn = document.getElementById('onboardingNextBtn');
    if (nextBtn) {
        if (_onboardingSlide === ONBOARDING_TOTAL - 1) {
            nextBtn.textContent = 'Начать путешествие';
        } else {
            nextBtn.textContent = 'Далее';
        }
    }
}

function nextOnboardingSlide() {
    if (_onboardingSlide < ONBOARDING_TOTAL - 1) {
        _onboardingSlide++;
        updateOnboardingSlide();
    } else {
        finishOnboarding();
    }
}

async function finishOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.style.display = 'none';

    if (!PLAYER || !PLAYER.playerId) return;

    // Сохраняем флаг в БД
    try {
        const { error } = await _supabase
            .from('players')
            .update({ onboarding_completed: true })
            .eq('id', PLAYER.playerId);

        if (error) {
            console.warn('Не удалось сохранить онбординг:', error);
        }
        PLAYER.onboardingCompleted = true;
    } catch (e) {
        console.warn('Ошибка сохранения онбординга:', e);
    }
}

// === Обработчики ===
document.addEventListener('click', (e) => {
    if (e.target.closest('#onboardingNextBtn')) {
        nextOnboardingSlide();
        return;
    }
    if (e.target.closest('#onboardingSkipBtn')) {
        finishOnboarding();
        return;
    }
});