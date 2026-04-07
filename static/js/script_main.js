import { Storage } from "./storage.js";

const storage = new Storage();

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (!text) return 'Описание отсутствует';
    if (text.length <= maxLength) return text;
    let truncated = text.substring(0, maxLength);
    let lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
        truncated = truncated.substring(0, lastSpace);
    }
    return truncated + '...';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded – инициализация страницы');
    const container = document.getElementById('recipesContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const arrow = document.getElementById('arrow');
    const menu = document.getElementById('categoryMenu');

    if (!container) {
        console.error('Контейнер не найден');
        return;
    }

    let allRecipes = [];

    function loadAndDisplayRecipes(recipesToShow) {
        container.innerHTML = '';
        const currentUser = storage.getCurrentUser();

        for (let recipe of recipesToShow) {
            const shortDescription = truncateText(recipe.description, 190);
            const isFav = currentUser && currentUser.favorites && currentUser.favorites.includes(recipe.id);
            const heartSrc = isFav ? './static/media/click_favorite.svg' : './static/media/favorite.svg';

            const favButtonHtml = currentUser ? `
                <button class="favorite-btn" data-id="${recipe.id}">
                    <img src="${heartSrc}" alt="favorite" class="favorite-icon" style="width:30px; cursor:pointer;">
                </button>
            ` : '';

            const cardHtml = `
                <a href="recipe.html?id=${recipe.id}" class="recipe-card-link">
                    <div class="card" data-recipe-id="${recipe.id}" style="height">
                        <div class="favorite-action">
                            ${favButtonHtml}
                        </div>
                        <div class="for_recipe" style="background-image: url('${recipe.img}'); width: 447px; height: 320px; background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 15px; display: flex; align-items: flex-end; justify-content: flex-end;  padding: 0px 20px 10px 10px;">
                            <div class="for_time">
                                <img src="./static/media/clock.svg" alt="clock" class="clock">
                                <p class="time">${recipe.cookingTime} мин</p>
                            </div>
                        </div>
                        <div class="text_block">
                            <p class="name_recipe">${escapeHtml(recipe.title)}</p>
                            <p class="description_recipe">${escapeHtml(shortDescription)}</p>
                        </div>
                    </div>
                </a>
            `;
            container.innerHTML += cardHtml;
        }
        attachFavoriteHandlers();
    }

    function attachFavoriteHandlers() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.removeEventListener('click', favoriteClickHandler);
            btn.addEventListener('click', favoriteClickHandler);
        });
    }

    async function favoriteClickHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.currentTarget;
        const recipeId = parseInt(btn.dataset.id);
        const currentUser = storage.getCurrentUser();
        if (!currentUser) {
            alert('Войдите, чтобы добавить в избранное');
            return;
        }
        const updatedUser = storage.toggleFavorite(currentUser.id, recipeId);
        if (updatedUser) {
            const isFav = updatedUser.favorites.includes(recipeId);
            const img = btn.querySelector('img');
            img.src = isFav ? './static/media/click_favorite.svg' : './static/media/favorite.svg';
            window.dispatchEvent(new CustomEvent('favoritesUpdated', {
                detail: { userId: currentUser.id, recipeId, isFav }
            }));
        }
    }

    window.addEventListener('favoritesUpdated', (e) => {
        const { recipeId, isFav } = e.detail;
        const allFavBtns = document.querySelectorAll(`.favorite-btn[data-id="${recipeId}"]`);
        allFavBtns.forEach(btn => {
            const img = btn.querySelector('img');
            img.src = isFav ? './static/media/click_favorite.svg' : './static/media/favorite.svg';
        });
    });

    fetch('/static/data/recipe.json')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
            return response.json();
        })
        .then(recipes => {
            allRecipes = recipes;
            console.log(`Загружено ${recipes.length} рецептов`);
            loadAndDisplayRecipes(allRecipes);

            const categoryLinks = document.querySelectorAll('.name_category');
            categoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const category = link.textContent.trim();
                    const filtered = allRecipes.filter(recipe => {
                        if (recipe.categories && recipe.categories.includes(category)) return true;
                        if (recipe.tags && recipe.tags.includes(category)) return true;
                        return false;
                    });
                    loadAndDisplayRecipes(filtered);
                    if (menu) menu.classList.add('hidden');
                    if (arrow) arrow.classList.remove('rotated');
                    if (searchInput) searchInput.value = '';
                });
            });

            function searchRecipes() {
                const query = searchInput.value.trim().toLowerCase();
                const results = storage.searchRecipes(query);
                if (results.length === 0) {
                    container.innerHTML = '<div style="text-align:center;padding:60px;">Рецепты не найдены</div>';
                } else {
                    loadAndDisplayRecipes(results);
                }
            }

            if (searchButton) {
                searchButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    searchRecipes();
                });
            }
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        searchRecipes();
                    }
                });
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки рецептов:', error);
            container.innerHTML = `<div style="text-align:center;padding:60px;">Не удалось загрузить рецепты</div>`;
        });

    if (arrow && menu) {
        arrow.addEventListener('click', (event) => {
            event.preventDefault();
            menu.classList.toggle('hidden');
            arrow.classList.toggle('rotated');
        });
    }
});