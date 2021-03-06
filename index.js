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
        list: document.getElementById('noteList'),
        doneList: document.getElementById('doneJob')
    },
    navigation: {
        login: document.getElementById('navLogin'),
        register: document.getElementById('navRegister'),
        exit: document.getElementById('navExit'),
        currentUser: document.getElementById('currentUser')
    }
};

// При загрузке страницы
let pageLoaded = false;
let notes = [];
let doneList = [];
let userData = {
    userName: window.sessionStorage.getItem('logedInAs')
};
moveTo();
isLogedIn();
window.addEventListener("hashchange", moveTo);

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
    registerData.doneList = [];
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
            loadLists(control.todo.list);
            moveTo(null, 'todo');
            pageLoaded = true;
            hideElement(control.navigation.login, control.navigation.register);
            showElement(control.navigation.exit)
            control.navigation.currentUser.textContent = `Текущий пользователь: ${userData.userName}`
            showElement(control.navigation.currentUser)
        }
    } else {
        showElement(control.navigation.login, control.navigation.register);
        hideElement(control.navigation.exit)
        control.navigation.currentUser.textContent = ``
        hideElement(control.navigation.currentUser)
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
            isLogedIn();
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
    obj.doneList = doneList;
    obj.notes = notes;
    window.localStorage.setItem(userData.userName, JSON.stringify(obj))
}

function getNotesFromLocalStorage() {
    let obj = getUserInfo(userData.userName);
    notes = obj ? obj.notes : [];
    doneList = obj ? obj.doneList : [];
}

function loadLists(parrentElement) {
    function createAndAppendElement(text, parrentElement) {
        let elWrapper = document.createElement('li') //создаем обёртку, в неё кладём текст заметки и кнопку "удалить"
        elWrapper.classList.add('note-wrapper')
        let el = document.createElement('div');
        el.classList.add('user-note');
        el.textContent = text;

        function createBtn() {
            let btn = document.createElement('button')
            btn.textContent = "Удалить"
            btn.classList.add('delete-note-btn')
            btn.addEventListener('click', () => {
                doneList.push(...notes.splice(notes.indexOf(btn.previousSibling.textContent), 1));
                sendNotesToLocalStorage();
                btn.closest('li').remove();
                createAndAppendElement(doneList[doneList.length - 1], control.todo.doneList)
            })
            return btn;
        }

        elWrapper.append(el);
        parrentElement.prepend(elWrapper);
        if (parrentElement !== control.todo.doneList) {
            let btn = createBtn();
            elWrapper.append(btn);
        }
    }
    if (pageLoaded) {
        createAndAppendElement(notes[notes.length - 1], parrentElement)
    } else {
        notes.forEach(value => {
            createAndAppendElement(value, parrentElement)
        })
        doneList.forEach(value=>{
            createAndAppendElement(value, control.todo.doneList)
        })
    }
}

function createNote(text) {
    notes.push(text);
    sendNotesToLocalStorage();
    loadLists(control.todo.list);
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
    while (control.todo.doneList.firstChild) {
        control.todo.doneList.firstChild.remove();
    }
    window.sessionStorage.removeItem('logedInAs')
    notes = [];
    doneList = [];
    pageLoaded = false;
    isLogedIn()
})