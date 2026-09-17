// ============ UI: ГЛАВНЫЙ РЕНДЕР ============

async function renderAll() {
    renderCitySelector();
    renderCityInfo();
    await renderTransport();
    await renderHotels();
    await renderServices();
    renderTabs();
    renderIcons();
}