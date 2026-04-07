import { Storage } from "./storage.js";

const storage = new Storage();

function getRecipeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.includes('.')) return date;
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

// Отображение комментариев
function displayComments(comments, recipeId) {
    const container = document.querySelector('.all_comments');
    if (!container) return;

    const recipeComments = comments.filter(c => c.recipeId == recipeId);
    if (recipeComments.length === 0) {
        container.innerHTML = '<div class="no-comments">Пока нет комментариев. Будьте первым!</div>';
        return;
    }

    let html = '';
    recipeComments.forEach(comment => {
        const avatarUrl = comment.userAvatar || './static/media/default-avatar.svg';
        html += `
            <div class="just_comment">
                <div class="icon">
                    <img src="${avatarUrl}" alt="avatar" class="avatar-img">
                </div>
                <div class="info_comment">
                    <p class="name">${escapeHtml(comment.userName || 'Пользователь')}</p>
                    <p class="comment">${escapeHtml(comment.comm)}</p>
                    <p class="date">${escapeHtml(formatDate(comment.date))}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateAverageRatingUI(rating) {
    const avgElem = document.querySelector('.avg_reviews');
    if (avgElem) avgElem.textContent = rating.average.toFixed(1);
}

function updateCommentCount(comments, recipeId) {
    const countElem = document.querySelector('.count_comm');
    if (!countElem) return;
    const count = comments.filter(c => c.recipeId == recipeId).length;
    countElem.textContent = `(${count})`;
}

document.addEventListener('DOMContentLoaded', () => {
    const recipeId = getRecipeIdFromUrl();
    if (!recipeId) {
        document.body.innerHTML = '<h1>Ошибка: рецепт не найден</h1>';
        return;
    }

    fetch('/static/data/recipe.json')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
            return response.json();
        })
        .then(recipes => {
            const recipe = recipes.find(r => r.id == recipeId);
            if (!recipe) throw new Error('Рецепт не найден');

            document.getElementById('recipeTitle').textContent = recipe.title;
            document.getElementById('recipeDescription').textContent = recipe.description;

            const titleImage = document.querySelector('.title_image');
            if (titleImage && recipe.img) titleImage.src = recipe.img;

            const ingredientsContainer = document.getElementById('ingredientsList');
            if (ingredientsContainer && recipe.ingredients) {
                ingredientsContainer.innerHTML = '';
                recipe.ingredients.forEach(ing => {
                    const div = document.createElement('div');
                    div.className = 'parametrs';
                    div.innerHTML = `
                        <p class="name_parametr">${escapeHtml(ing.name)}</p>
                        <p class="weight_parametr">${escapeHtml(ing.count)}</p>
                    `;
                    ingredientsContainer.appendChild(div);
                });
            }

            const stepsContainer = document.getElementById('stepsContainer');
            if (stepsContainer && recipe.steps) {
                stepsContainer.innerHTML = '';
                recipe.steps.forEach(step => {
                    const stepDiv = document.createElement('div');
                    stepDiv.className = 'step';
                    stepDiv.innerHTML = `
                        <p class="name_step">${escapeHtml(step.name)}</p>
                        <p class="description_step">${escapeHtml(step.description)}</p>
                        ${step.img ? `<img src="${step.img}" alt="step" class="image_step">` : ''}
                    `;
                    stepsContainer.appendChild(stepDiv);
                });
            }

            const favImg = document.querySelector('.button_favorite');
            const currentUser = storage.getCurrentUser();
            if (favImg) {
                const updateFavButton = () => {
                    const user = storage.getCurrentUser();
                    const isFav = user && user.favorites && user.favorites.includes(Number(recipeId));
                    favImg.src = isFav ? './static/media/click_favorite.svg' : './static/media/favorite.svg';
                };
                updateFavButton();
                favImg.parentElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!storage.getCurrentUser()) {
                        alert('Пожалуйста, войдите в аккаунт');
                        return;
                    }
                    storage.toggleFavorite(currentUser.id, recipeId);
                    updateFavButton();
                });
            }

            const ratingStars = document.querySelectorAll('.greyStar');
            let selectedRating = 0;
            if (ratingStars.length) {
                const updateRatingStarsUI = (rating) => {
                    ratingStars.forEach((star, idx) => {
                        star.src = idx < rating
                            ? './static/media/goldenStar.svg'
                            : './static/media/no_comment.svg';
                    });
                };
                ratingStars.forEach((star, idx) => {
                    star.style.cursor = 'pointer';
                    star.addEventListener('click', () => {
                        selectedRating = idx + 1;
                        updateRatingStarsUI(selectedRating);
                    });
                });
            }

            let comments = storage.getComments();
            displayComments(comments, recipeId);
            updateCommentCount(comments, recipeId);

            storage.updateRecipeAverageRating(recipeId);

            const updatedRecipes = storage.getRecipe();
            const updatedRecipe = updatedRecipes.find(r => r.id == recipeId);
            if (updatedRecipe && updatedRecipe.rating) {
                updateAverageRatingUI(updatedRecipe.rating);
            } else {
                updateAverageRatingUI({ average: 0, count: 0 });
            }

            const sendButton = document.querySelector('.send');
            const commentInput = document.querySelector('.input_comment');

            if (sendButton && commentInput) {
                sendButton.addEventListener('click', () => {
                    const currentUser = storage.getCurrentUser();
                    if (!currentUser) {
                        alert('Пожалуйста, войдите в аккаунт, чтобы оставить комментарий');
                        return;
                    }

                    const commentText = commentInput.value.trim();
                    if (!commentText) {
                        alert('Введите текст комментария');
                        return;
                    }

                    storage.saveComment(
                        currentUser.id,
                        Number(recipeId),
                        commentText,
                        new Date().toLocaleDateString('ru-RU'),
                        selectedRating > 0 ? selectedRating : null
                    );

                    const allComments = storage.getComments();
                    displayComments(allComments, recipeId);
                    updateCommentCount(allComments, recipeId);

                    storage.updateRecipeAverageRating(recipeId);
                    const latestRecipes = storage.getRecipe();
                    const latestRecipe = latestRecipes.find(r => r.id == recipeId);
                    if (latestRecipe && latestRecipe.rating) {
                        updateAverageRatingUI(latestRecipe.rating);
                    }

                    commentInput.value = '';
                    selectedRating = 0;
                    if (ratingStars.length) {
                        ratingStars.forEach(star => star.src = './static/media/no_comment.svg');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки рецепта:', error);
            document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px;">😕 Рецепт не найден</h1>';
        });
});