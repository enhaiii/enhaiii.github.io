import { Storage } from "./storage.js";

const storage = new Storage();

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createRecipeCard(recipe, isFavorite = true) {
    const shortDescription = truncateText(recipe.description, 190);
    const heartSrc = isFavorite ? './static/media/click_favorite.svg' : './static/media/favorite.svg';
    return `
        <a href="recipe.html?id=${recipe.id}">
            <div class="card" data-recipe-id="${recipe.id}">
                <div class="favorite-action">
                    <button class="favorite-btn" data-id="${recipe.id}">
                        <img src="${heartSrc}" alt="favorite" class="favorite-icon">
                    </button>
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
}

function displayRecipes(recipes, container) {
    if (!recipes || recipes.length === 0) {
        container.innerHTML = '<p class="message">У вас пока нет избранных рецептов. Добавьте их на странице рецепта!</p>';
        return;
    }
    container.innerHTML = recipes.map(recipe => createRecipeCard(recipe, true)).join('');
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const recipeId = parseInt(btn.dataset.id);
            const currentUser = storage.getCurrentUser();
            if (!currentUser) {
                alert('Пожалуйста, войдите в аккаунт');
                return;
            }
            const updatedUser = storage.toggleFavorite(currentUser.id, recipeId);
            if (updatedUser) {
                const card = btn.closest('.card');
                if (card) card.remove();

                if (container.children.length === 0) {
                    container.innerHTML = '<p class="message">У вас пока нет избранных рецептов.</p>';
                }
            } else {
                alert('Ошибка при удалении из избранного');
            }
        });
    });
}

function searchFavorites(allFavorites, query) {
    if (!query) return allFavorites;
    const lowerQuery = query.toLowerCase().trim();
    return allFavorites.filter(recipe => {
        const titleMatch = recipe.title.toLowerCase().includes(lowerQuery);
        const ingredientsMatch = recipe.ingredients && recipe.ingredients.some(ing =>
            ing.name.toLowerCase().includes(lowerQuery)
        );
        return titleMatch || ingredientsMatch;
    });
}

async function loadFavorites() {
    const container = document.getElementById('favoritesContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (!container) return;

    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
        container.innerHTML = '<p class="message">Пожалуйста, войдите в аккаунт, чтобы увидеть избранное.</p>';
        return;
    }

    const favoriteIds = currentUser.favorites || [];
    if (favoriteIds.length === 0) {
        container.innerHTML = '<p class="message">У вас пока нет избранных рецептов. Добавьте их на странице рецепта!</p>';
        return;
    }

    try {
        const response = await fetch('/static/data/recipe.json');
        const allRecipes = await response.json();
        const favoriteRecipes = allRecipes.filter(recipe => favoriteIds.includes(recipe.id));

        if (favoriteRecipes.length === 0) {
            container.innerHTML = '<p class="message">Избранные рецепты не найдены.</p>';
            return;
        }

        let currentFavorites = [...favoriteRecipes];

        const updateDisplay = (query) => {
            const filtered = searchFavorites(currentFavorites, query);
            displayRecipes(filtered, container);
        };

        updateDisplay('');

        const handleSearch = () => {
            const query = searchInput ? searchInput.value.trim() : '';
            updateDisplay(query);
        };

        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                handleSearch();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки рецептов:', error);
        container.innerHTML = '<p class="message">Не удалось загрузить рецепты.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
});