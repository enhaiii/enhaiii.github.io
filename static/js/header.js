import { Storage } from "./storage.js";

const storage = new Storage();

function updateHeader() {
    const isLoggedIn = !!storage.getCurrentUser();
    const pagesContainer = document.querySelector('.pages');
    const signInBtn = document.querySelector('.sign_in');

    if (!pagesContainer) return;

    let favLink = pagesContainer.querySelector('.favorite-link');
    let profileLink = pagesContainer.querySelector('.profile-link');

    if (isLoggedIn) {
        if (signInBtn) signInBtn.style.display = 'none';

        if (!favLink) {
            favLink = document.createElement('a');
            favLink.href = 'favorite.html';
            favLink.className = 'favorite-link';
            favLink.innerHTML = '<img src="./static/media/favorite.svg" alt="favorite" class="favorite">';
            pagesContainer.appendChild(favLink);
        }
        if (!profileLink) {
            profileLink = document.createElement('a');
            profileLink.href = 'profile.html';
            profileLink.className = 'profile-link';
            profileLink.innerHTML = '<img src="./static/media/profile.svg" alt="profile" class="profile">';
            pagesContainer.appendChild(profileLink);
        }
    } else {
        if (signInBtn) signInBtn.style.display = 'block';

        if (favLink) favLink.remove();
        if (profileLink) profileLink.remove();
    }
}

document.addEventListener('click', (e) => {
    const signInBtn = document.querySelector('.sign_in');
    if (e.target === signInBtn || signInBtn?.contains(e.target)) {
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', updateHeader);