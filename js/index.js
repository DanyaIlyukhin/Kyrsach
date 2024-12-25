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
app.use(('/js', express.static(path.join(__dirname))));

app.use(cors({
    origin: "http://localhost:3000", 
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
    if (req.session.user && req.session.user.user_status === 'admin') { 
        next();
    } else {
        res.redirect('/404');
    }
};

const isConfirm = (req, res, next) => {
    if (req.session.user && req.session.user.account_status === true) { 
        next();
    } else {
        res.redirect('/404');
    }
};

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        return res.json({ isAuthenticated: true, isAdmin: req.session.user.user_status === 'admin' });
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
require('./users.js')(app, upload);
require('./fields.js')(app);
require('./profile.js')(app);

// Функция для создания таблиц и добавления пользователя
const createTables = async () => {
    const client = await pool.connect();
    try {
        // Создание таблиц
        await client.query(`
            CREATE TABLE IF NOT EXISTS USERS(
                user_id SERIAL PRIMARY KEY,
                first_name VARCHAR(40) NOT NULL,
                surname VARCHAR(40) NOT NULL,
                middlename VARCHAR(40) NOT NULL,
                login VARCHAR(40) NOT NULL UNIQUE,
                password_user VARCHAR(255) NOT NULL,
                telephone_number DECIMAL(11, 0) NOT NULL UNIQUE,
                account_status BOOL NOT NULL,
                user_status VARCHAR(40) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS FIELDS(
                field_id SERIAL PRIMARY KEY,
                name_field VARCHAR(50) NOT NULL,
                address VARCHAR(100) NOT NULL,
                size_field VARCHAR(50) NOT NULL,
                number_of_players VARCHAR(30) NOT NULL,
                type_of_coating VARCHAR(30) NOT NULL,
                is_lighting BOOL NOT NULL,
                is_stands BOOL NOT NULL,
                is_changings_rooms BOOL NOT NULL,
                is_parking BOOL NOT NULL,
                photo BYTEA NULL,
                price VARCHAR(30) NOT NULL,
                information VARCHAR(40) NULL
            );

            CREATE TABLE IF NOT EXISTS RESERVATIONS(
                record_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                status VARCHAR(40) NOT NULL,
                total_price INT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS RECORDS(
                record_id SERIAL PRIMARY KEY,
                recording_datetime DATE
            );

            CREATE TABLE IF NOT EXISTS TIMESLOTS(
                slot_id SERIAL PRIMARY KEY,
                field_id INT NOT NULL,
                record_id INT NULL,
                date_start DATE,
                number_slot INT NOT NULL,
                FOREIGN KEY(field_id) REFERENCES FIELDS(field_id) ON DELETE CASCADE,
                FOREIGN KEY(record_id) REFERENCES RECORDS(record_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS CONTRACTS(
                record_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                organization_name VARCHAR(50) NOT NULL,
                FOREIGN KEY(user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS EVENTS(
                record_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                event_name VARCHAR(50) NOT NULL,
                FOREIGN KEY(user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
            );
        `);

        // Вставка пользователя по умолчанию если не существует
        const insertUserQuery = `
            INSERT INTO USERS (first_name, surname, middlename, login, password_user, telephone_number, account_status, user_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (login) DO NOTHING;  -- Предотвращает дублирование по логину
        `;
        
        const values = ['Алексей', 'Петров', 'Сергеевич', 'AlexPet', '123', '89201234567', true, 'admin'];
        
        await client.query(insertUserQuery, values);
        
        console.log("Tables created and default admin user added successfully!");
    } catch (err) {
        console.error("Error creating tables or inserting data:", err);
    } finally {
        client.release();
    }
};

// Запуск сервера после создания таблиц и вставки данных
createTables().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to create tables or start server:", err);
});
