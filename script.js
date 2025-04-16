// script.js - Реализация поиска по имени

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Fully Loaded');

    // --- Обновление года в футере ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Элементы управления ---
    const grid = document.querySelector('.monuments-grid');
    const showMoreBtn = document.getElementById('show-more-btn');
    const searchInput = document.getElementById('hero-search'); // Наше поле поиска
    const itemsPerLoad = 6;

    let allCards = []; // Все карточки изначально
    let observer;

    // --- Инициализация ---
    function initializeSite() {
        // Логика, специфичная для главной страницы (с сеткой и поиском)
        if (grid && searchInput) { // Проверяем наличие сетки И поля поиска
            allCards = Array.from(grid.querySelectorAll('.monument-card'));
            console.log(`Total cards found: ${allCards.length}`);

            if (allCards.length === 0) {
                console.warn('No cards found in the grid.');
                if (showMoreBtn) showMoreBtn.classList.add('hidden');
                 searchInput.disabled = true; // Отключаем поиск если нет карточек
            } else {
                 setupSearchListener(); // Настраиваем поиск
                 applySearchAndPagination(); // Применяем начальное состояние (пустой поиск + пагинация)
                 setupShowMoreListener(); // Настраиваем кнопку "Показать еще"
            }
        } else {
             console.log('Grid or Search Input not found on this page. Assuming detail page.');
             // Скрываем кнопку "Показать еще", если ее нет или нет сетки
             if (showMoreBtn) showMoreBtn.style.display = 'none';
        }

        // Логика, общая для всех страниц
        initializeObserver(); // Запускаем observer для анимаций на ЛЮБОЙ странице
        setupSmoothScroll(); // Настраиваем плавный скролл (если ссылка есть)
    }

    // --- Логика Поиска ---
    function setupSearchListener() {
         // Используем 'input' для "живого" поиска
        searchInput.addEventListener('input', () => {
            // Можно добавить debounce здесь для производительности, если карточек > ~100
            applySearchAndPagination();
        });
    }

    function applySearchAndPagination() {
        // Эта функция вызывается только если grid и searchInput существуют
        const searchTerm = searchInput.value.trim().toLowerCase();
        console.log(`Applying search "${searchTerm}" and resetting pagination.`);

        // 1. Применить поисковый фильтр
        let visibleCardsAfterSearch = []; // Карточки, прошедшие поиск
        allCards.forEach(card => {
            const cardTitleElement = card.querySelector('.card-title');
            const cardTitle = cardTitleElement ? cardTitleElement.textContent.trim().toLowerCase() : '';
            const matchesSearch = searchTerm === '' || cardTitle.includes(searchTerm);

            // Сбрасываем все состояния перед применением новых
            card.classList.remove('card-searched-out', 'hidden-card', 'is-visible');

            if (matchesSearch) {
                // card.classList.remove('card-searched-out'); // Уже сделали выше
                visibleCardsAfterSearch.push(card);
            } else {
                card.classList.add('card-searched-out'); // Скрываем несовпавшие по поиску
            }
        });
        console.log(`Cards matching search "${searchTerm}": ${visibleCardsAfterSearch.length}`);

        // 2. Применить пагинацию к результатам поиска
        visibleCardsAfterSearch.forEach((card, index) => {
            if (index >= itemsPerLoad) {
                card.classList.add('hidden-card'); // Скрываем лишние из найденных
            }
            // is-visible сбрасывается для всех выше, observer сработает
        });

        updateShowMoreButtonState(); // Обновить кнопку "Показать еще" на основе результатов
        setTimeout(initializeObserver, 50); // Перезапуск Observer
    }

    // --- Логика "Показать еще" (адаптированная под поиск) ---
     function setupShowMoreListener() {
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                console.log('--- "Show More" button clicked ---');
                // Находим скрытые пагинацией карточки, которые НЕ скрыты поиском
                const hiddenMatchingCards = grid.querySelectorAll('.monument-card:not(.card-searched-out).hidden-card');
                console.log(`Found ${hiddenMatchingCards.length} hidden matching cards.`);
                let itemsShownThisClick = 0;
                hiddenMatchingCards.forEach((card) => {
                    if (itemsShownThisClick < itemsPerLoad) {
                        card.classList.remove('hidden-card'); // Показываем
                        card.classList.remove('is-visible'); // Для observer'а
                        itemsShownThisClick++;
                    }
                });
                console.log(`Items shown this click: ${itemsShownThisClick}`);
                updateShowMoreButtonState(); // Обновляем состояние кнопки
                setTimeout(initializeObserver, 50); // Перезапускаем Observer
            });
        }
    }

    function updateShowMoreButtonState() {
        if (!showMoreBtn || !grid) return;
        // Ищем скрытые пагинацией карточки, которые НЕ скрыты поиском
        const hiddenMatchingCards = grid.querySelectorAll('.monument-card:not(.card-searched-out).hidden-card');
        if (hiddenMatchingCards.length > 0) {
            showMoreBtn.classList.remove('hidden');
            showMoreBtn.style.display = ''; // Убедимся, что видима
        } else {
            showMoreBtn.classList.add('hidden');
        }
        console.log(`Hidden cards matching search results: ${hiddenMatchingCards.length}. Show More button visible: ${!showMoreBtn.classList.contains('hidden')}`);
    }


    // --- Анимация при прокрутке (адаптированная под поиск) ---
    function initializeObserver() {
        console.log('Observer: Initializing...');
        if (observer) {
            observer.disconnect();
            console.log('Observer: Disconnected previous instance.');
        }
        // Наблюдаем за элементами, которые должны анимироваться,
        // И которые НЕ скрыты пагинацией И НЕ скрыты поиском
        const elementsToObserve = document.querySelectorAll('.animate-on-scroll:not(.is-visible):not(.hidden-card):not(.card-searched-out)');
        console.log(`Observer: Found ${elementsToObserve.length} elements to observe.`);
        if (elementsToObserve.length > 0) {
            observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                     // Доп проверка на случай изменения классов между созданием и срабатыванием
                     if (entry.isIntersecting &&
                         !entry.target.classList.contains('hidden-card') &&
                         !entry.target.classList.contains('card-searched-out'))
                     {
                        console.log('Observer: Element intersecting, adding .is-visible:', entry.target);
                        entry.target.classList.add('is-visible');
                        const isCard = entry.target.classList.contains('monument-card');
                        const hasStagger = entry.target.classList.contains('stagger');

                        // Логика stagger применяется только если это карточка на главной И поиск пуст
                        if (isCard && grid && hasStagger) {
                            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : ''; // Проверка searchInput
                            const cardIndex = allCards.indexOf(entry.target);

                            if (cardIndex !== -1) {
                                // Stagger только для первых N И если поиск пуст
                                if (cardIndex < itemsPerLoad && searchTerm === '') {
                                    const staggerIndexValue = cardIndex;
                                    entry.target.style.setProperty('--stagger-index', staggerIndexValue);
                                    entry.target.style.transitionDelay = '';
                                    console.log(`Observer: Applied stagger index ${staggerIndexValue} to INITIAL card (no search).`, entry.target);
                                } else { // Для последующих или при активном поиске - без задержки
                                    entry.target.style.setProperty('--stagger-index', '0');
                                    entry.target.style.transitionDelay = '0s';
                                    console.log('Observer: Setting delay 0s for LATER card or ACTIVE search.', entry.target);
                                }
                            } else {
                                 entry.target.style.transitionDelay = '0s';
                                 console.log('Observer: Card not found in array, setting delay 0s', entry.target);
                            }
                        } else if (hasStagger) { // Для других элементов со stagger (не карточек)
                            entry.target.style.transitionDelay = '';
                            console.log('Observer: Non-card element with stagger', entry.target);
                        } else { // Элемент без stagger
                            entry.target.style.transitionDelay = '0s';
                            console.log('Observer: No stagger class, setting delay 0s', entry.target);
                        }
                        obs.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            elementsToObserve.forEach(element => {
                observer.observe(element);
            });
        } else {
            console.log('Observer: No new elements to observe.');
        }
    }

    // --- Плавная прокрутка к якорю (без изменений) ---
    function setupSmoothScroll() {
        const scrollLink = document.querySelector('.scroll-down-link');
        if (scrollLink) {
            scrollLink.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = scrollLink.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    // --- Запуск ---
    initializeSite();

}); // Конец DOMContentLoaded