// ============ UI: ГЛАВНЫЙ РЕНДЕР ============

async function renderAll() {
    renderCityInfo();
    await renderTransport();
    await renderHotels();
    await renderServices();
    renderTabs();

    // Иконки — после всех рендеров
    if (typeof lucide !== 'undefined') lucide.createIcons();
}