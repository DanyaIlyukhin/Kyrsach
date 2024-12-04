const express = require('express');
const session = require('express-session'); 
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');


// Настройка express и сессий
const app = express();
app.use(express.json()); // Для парсинга JSON-данных
app.use(express.urlencoded({ extended: true })); // Для парсинга URL-кодированных данных


// Экспорт функции регистрации
module.exports = (app) => {

    const pool = new Pool({
        user: 'postgres',         
        host: 'localhost',       
        database: 'coursework',   
        password: '141104',       
        port: 5432,               
    });

    // Настройка сессий
    app.use(session({
        secret: '141104', // Замените на ваш секретный ключ
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Установите true, если используете HTTPS
    }));

    app.post('/login', async (req, res) => {
        const { login, password } = req.body;

        // Проверка наличия обязательных полей
        if (!login || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны для заполнения.' });
        }

        try {
            // Получаем пользователя по логину
            const result = await pool.query(
                'SELECT * FROM users WHERE login = $1',
                [login]
            );
            if (result.rows.length > 0) {
                const user = result.rows[0];

                // Сравниваем введенный пароль с хешированным паролем из базы данных
                const isMatch = await bcrypt.compare(password, user.password_user);
                if (isMatch) {
                    // Успешный вход, возвращаем логин и пароль в ответе
                    req.session.user = {
                        user_id: user.user_id,
                        first_name: user.first_name,
                        surname: user.surname,
                        middlename: user.middlename,
                        login: user.login,
                        telephone_number: user.telephone_number,
                        account_status: user.account_status,
                        user_status: user.user_status
                    };
            
                    // Перенаправление на главную страницу или отправка JSON-ответа
                    res.redirect('/');
                }
            }
            else { 
                return res.status(401).json({ error: 'Неверный логин или пароль.' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка при обработке запроса.' });
        }
    });

    app.get('/protected', (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Необходима аутентификация.' }); // Возвращаем JSON с сообщением об ошибке
        }
        
        // Предполагаем, что req.session.user содержит информацию о пользователе
        const userData = {
            user_id: req.session.user.user_id,
            first_name: req.session.user.first_name,
            surname: req.session.user.surname,
            middlename:req.session. user.middlename,
            login: req.session.user.login,
            telephone_number: req.session.user.telephone_number,
            account_status: req.session.user.account_status,
            user_status: req.session.user.user_status
        };
        res.json({ message: `Добро пожаловать ${req.session.user.login_user}!`, user: userData }); // Возвращаем JSON с данными пользователя
    });


    app.post('/register',  async (req, res) => {
        const { 
            first_name, 
            surname, 
            middlename, 
            login, 
            password_user, 
            telephone_number, 
            account_status = false, // Значение по умолчанию
            user_status = 'user'     // Значение по умолчанию
        } = req.body;

        // Проверка наличия обязательных полей
        if (!first_name || !surname || !middlename || !login || !password_user || !telephone_number) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения.' });
        }

        try {
            // Хеширование пароля с использованием 10 раундов соли
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password_user, saltRounds);

            const result = await pool.query( 
                `INSERT INTO USERS (first_name, surname, middlename, login, password_user, telephone_number, account_status, user_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [first_name, surname, middlename, login, hashedPassword, telephone_number, account_status, user_status]
            );

            const result2 = await pool.query(
                'SELECT * FROM users WHERE login = $1',
                [login]
            );
            if (result2.rows.length > 0) {
                const user = result2.rows[0];

                req.session.user = {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    surname: user.surname,
                    middlename: user.middlename,
                    login: user.login,
                    telephone_number: user.telephone_number,
                    account_status: user.account_status,
                    user_status: user.user_status
                };
                // Перенаправление на главную страницу или отправка JSON-ответа
                res.redirect('/');
            }
            else { 
                return res.status(401).json({ error: 'Ты ботик' });
            }

            // return res.status(201).json(result.rows[0]); // Возвращаем созданного пользователя
        } catch (error) {
            console.error(error);
            if (error.code === '23505') { // Код ошибки для уникального ограничения (например, дублирующий логин или телефон)
                return res.status(400).json({ error: 'Этот логин или номер телефона уже зарегистрирован.' });
            }
            return res.status(500).json({ error: 'Ошибка при добавлении пользователя' });
        }
    });

    app.post('/logout', (req, res) => {
        req.session.destroy(err => { // Удаление сессии
            if (err) {
                console.error('Ошибка при уничтожении сессии:', err);
                return res.status(500).send('Ошибка при выходе.');
            }
            res.clearCookie('connect.sid'); // Очистка куки сессии (если используется)
            res.sendStatus(200); // Успешный выход
        });
    });

    // Проверка состояния входа пользователя
    app.get('/status', (req, res) => {
        if (req.session.userId) {
            res.json({ loggedIn: true, userId: req.session.userId });
        } else {
            res.json({ loggedIn: false });
        }
    });
};
