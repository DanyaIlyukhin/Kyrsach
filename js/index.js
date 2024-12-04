const express = require('express');
const session = require('express-session'); 
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const cors = require('cors');


const pool = new Pool({
    user: 'postgres',         
    host: 'localhost',       
    database: 'coursework',   
    password: '141104',       
    port: 5432,               
});

// Создание приложения Express
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(('/js',express.static(path.join(__dirname))))


app.use(cors({
    origin: "http://localhost:3000", // ваш клиентский адрес
    methods: ["GET", "POST"],
    credentials: true // Позволяет отправлять куки
}));

// Настройка сессий
app.use(session({
    secret: '141104', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


const isAuthenticated = (req, res, next) => {
    if (req.session.user) { 
        next(); 
    } else {
        res.status(403).send('Доступ запрещен'); 
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.user_status === 'admin') { // Проверяем наличие пользователя и его статус
        next();
    } else {
        res.redirect('/404');
    }
};

// Эндпоинт для проверки аутентификации
app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        if (req.session.user.user_status === 'admin'){
            return res.json({ isAuthenticated: true, isAdmin: true });
        }
        else{
            return res.json({ isAuthenticated: true, isAdmin: false });
        }
    }
    res.json({ isAuthenticated: false });
});

// Статические файлы (если есть)
app.use(express.static('static'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/index.html'));
});
app.get('/panel', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/panel.html'));
});
app.get('/upload', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/upload.html'));
});
app.get('/fields', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/fields.html'));
});
app.get('/select_fields', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FIELDS');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных о полях.');
    }
});
app.get('/redact', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/redact.html'));
});
app.get('/users', isAdmin, async (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/users.html'));
});

app.get('/contracts', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/html/contracts.html'));
});



// Настройка multer для загрузки файлов в память
const storage = multer.memoryStorage();
const upload = multer({ storage });


// Подключение маршрутов
require('./upload.js')(app, upload);
require('./registration.js')(app);
require('./scripts/users.js')(app, upload);
// require('./scripts/redact.js')(app, upload);
require('./fields.js')(app);


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});