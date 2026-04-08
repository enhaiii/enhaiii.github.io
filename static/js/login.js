import { Storage } from "./storage.js";

const storage = new Storage();

function hashPassword(password) {
    try {
        return btoa(encodeURIComponent(password));
    } catch (e) {
        console.warn('Ошибка хеширования, используется открытый пароль');
        return password;
    }
}

function checkPassword(inputPassword, storedPassword) {
    const inputHash = hashPassword(inputPassword);
    if (inputHash === storedPassword) return true;
    if (inputPassword === storedPassword) return true;
    return false;
}

const nameInput = document.getElementById('loginName');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

const nameFail = document.getElementById('nameFail');
const emailFail = document.getElementById('emailFail');
const passwordFail = document.getElementById('passwordFail');

[nameFail, emailFail, passwordFail].forEach(el => {
    if (el) el.style.display = 'none';
});

function showError(element, message = null) {
    if (element) {
        if (message) element.textContent = message;
        element.style.display = 'block';
    }
}
function hideError(element) {
    if (element) element.style.display = 'none';
}

function isValidEmail(email) {
    const allowedDomains = ['@gmail.com', '@mail.ru', '@yandex.ru', '@bk.ru'];
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
}

function validateNewUser(name, email, password) {
    let isValid = true;
    if (!name) {
        showError(nameFail, 'Имя не может быть пустым');
        isValid = false;
    } else hideError(nameFail);
    
    if (!email) {
        showError(emailFail, 'Email не может быть пустым');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(emailFail, 'Неверная почта');
        isValid = false;
    } else hideError(emailFail);
    
    if (!password) {
        showError(passwordFail, 'Пароль не может быть пустым');
        isValid = false;
    } else if (password.length < 6) {
        showError(passwordFail, 'Пароль должен быть не менее 6 символов');
        isValid = false;
    } else hideError(passwordFail);
    
    return isValid;
}

function findUserByEmail(users, email) {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

function createNewUser(name, email, password) {
    const users = storage.getUsers();
    const newId = users.length > 0 ? Math.max(...users.map(u => Number(u.id))) + 1 : 1;
    const newUser = {
        id: newId,
        name: name,
        email: email,
        password: hashPassword(password),
        favorites: [],
        reviews: [],
        grades: {},
        comments: []
    };
    users.push(newUser);
    storage.saveUsers(users);
    return newUser;
}

loginBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    hideError(nameFail);
    hideError(emailFail);
    hideError(passwordFail);

    if (!name || !email || !password) {
        if (!name) showError(nameFail, 'Имя не может быть пустым');
        if (!email) showError(emailFail, 'Email не может быть пустым');
        if (!password) showError(passwordFail, 'Пароль не может быть пустым');
        return;
    }

    const users = storage.getUsers();
    const existingUser = findUserByEmail(users, email);

    if (existingUser) {
        const passwordValid = checkPassword(password, existingUser.password);
        const nameMatches = existingUser.name === name;

        if (!nameMatches && !passwordValid) {
            showError(nameFail, 'Неверное имя');
            showError(passwordFail, 'Неверный пароль');
        } else if (!nameMatches) {
            showError(nameFail, 'Неверное имя');
        } else if (!passwordValid) {
            showError(passwordFail, 'Неверный пароль');
        } else {
            
            if (existingUser.password !== hashPassword(password)) {
                existingUser.password = hashPassword(password);
                storage.saveUsers(users);
            }
            storage.setCurrentUser(existingUser);
            window.location.href = 'profile.html';
        }
    } else {
        if (validateNewUser(name, email, password)) {
            const newUser = createNewUser(name, email, password);
            storage.setCurrentUser(newUser);
            window.location.href = 'profile.html';
        }
    }
});

const inputs = [nameInput, emailInput, passwordInput];
inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });
});