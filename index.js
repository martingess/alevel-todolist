import {
    sha256
} from './sha256.js';

let pages = {
    loginArea: document.getElementById('login'),
    todoArea: document.getElementById('todo'),
    registerArea: document.getElementById('register')
}

function PageControl(btnId, userNameId, passwordId) {
    this.btn = document.getElementById(btnId);
    this.username = document.getElementById(userNameId);
    this.password = document.getElementById(passwordId);
}

let control = {
    login: new PageControl('loginBtn', 'loginUsername', 'loginPassword'),
    register: new PageControl('registerBtn', 'registerUsername', 'registerPassword'),
    todo: {
        add: document.getElementById('noteAddBtn'),
        addInfo: document.getElementById('noteAddData'),
        list: document.getElementById('noteList')
    },
    navigation: {
        login: document.getElementById('navLogin'),
        register: document.getElementById('navRegister'),
        exit: document.getElementById('navExit')

    }
};

// Перемещение по приложению
function moveTo(event, toAdress) {
    let currentAdress = toAdress ? toAdress : window.location.hash.slice(1);
    Object.values(pages).forEach((page) => {
        if (currentAdress !== page.id) {
            page.style.display = 'none'
        } else {
            page.style.display = 'block'
        }
    })
    //изменение в адресной строке
    if (toAdress) {
        if (history.pushState) {
            history.pushState(null, '', `#${toAdress}`);
        } else { //для старых браузеров
            location.hash = `#${toAdress}`;
        }
    }
}

window.addEventListener("hashchange", moveTo);

// При загрузке страницы
let pageLoaded = false;
window.notes = [];
let userData = {
    userName: window.sessionStorage.getItem('logedInAs')
};
moveTo();
isLogedIn();
// Регистрация

function getUserInfo(userName) {
    let obj = JSON.parse(window.localStorage.getItem(userName))
    return obj;
}

function register() {
    let registerData = {};
    registerData.login = control.register.username.value;
    registerData.password = control.register.password.value ? sha256(control.register.password.value) : '';
    registerData.notes = [];
    if (registerData.login && registerData.password) {
        if (!getUserInfo(registerData.login)) {
            let registerDataJSON = JSON.stringify(registerData);
            window.localStorage.setItem(registerData.login, registerDataJSON);
            moveTo(null, 'login')
        } else {
            alert('Пользователь с таким именем существует')
        }
    } else {
        alert('Оба поля обязательны для зполнения')
    }
}

// Логин

function hideElement(element) {
    for (let elem of arguments) {
        elem.style.display = 'none'
    }
}
function showElement(element) {
    for (let elem of arguments) {
        elem.style.display = 'block'
    }
}

function isLogedIn() {
    if (userData.userName) {
        if (pageLoaded === false) {
            getNotesFromLocalStorage();
            loadList();
            moveTo(null, 'todo');
        }
    }
}

function login() {
    let login = control.login.username.value;
    let password = sha256(control.login.password.value);
    if (getUserInfo(login)) {
        let userInfo = getUserInfo(login);
        if (userInfo.password === password) {
            alert('Успех!');
            window.sessionStorage.setItem('logedInAs', login)
            userData.userName = login;
            moveTo(null, 'todo');
            getNotesFromLocalStorage();
            loadList()
            hideElement(control.navigation.login, control.navigation.register)
        } else {
            alert('Имя пользователя или пароль не верны')
        }
    } else {
        alert('Пользователя с таким именем не существует')
    }
}

// Заметки

// Добавление заметок

function sendNotesToLocalStorage() {
    let obj = getUserInfo(userData.userName);
    obj.notes = notes;
    window.localStorage.setItem(userData.userName, JSON.stringify(obj))
}

function getNotesFromLocalStorage() {
    let obj = getUserInfo(userData.userName);
    notes = obj ? obj.notes : [];
}

function loadList() {
    function createAndAppendElement(text) {
        let elWrapper = document.createElement('li')
        elWrapper.classList.add('note-wrapper')
        let el = document.createElement('div');
        el.classList.add('user-note');
        el.textContent = text;
        let btn = document.createElement('button')
        btn.textContent = "Удалить"
        btn.classList.add('delete-note-btn')
        elWrapper.append(el);
        elWrapper.append(btn);
        control.todo.list.prepend(elWrapper);
        btn.addEventListener('click', () => {
            notes.splice(notes.indexOf(btn.previousSibling.textContent), 1)
            sendNotesToLocalStorage();
            btn.closest('li').remove();
        })
        pageLoaded = true;
    }
    if (pageLoaded) {
        createAndAppendElement(notes[notes.length - 1])

    } else {
        notes.forEach(value => {
            createAndAppendElement(value)
        })
    }
}

function createNote(text) {
    notes.push(text);
    sendNotesToLocalStorage()
    loadList();
}

// События
control.login.btn.addEventListener('click', (event) => {
    event.preventDefault()
    login()
})

control.register.btn.addEventListener('click', (event) => {
    event.preventDefault();
    register();
});

control.todo.add.addEventListener('click', () => {
    createNote(control.todo.addInfo.value)
})

control.navigation.exit.addEventListener('click', () => {
    userData.userName = null;
    while (control.todo.list.firstChild) {
        control.todo.list.firstChild.remove();
    }
    window.sessionStorage.removeItem('logedInAs')
    notes = [];
    pageLoaded = false;
    showElement(control.navigation.login, control.navigation.register)
})