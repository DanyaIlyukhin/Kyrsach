const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework', 
    password: '141104', 
    port: 5432,
});

module.exports = (app) => {

    app.use(session({
        secret: '141104',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));

    app.get('/profile_deals', async (req, res) => {
        const userId = req.session.user.user_id;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован.' });
        }

        try {
            const dealsResult = await pool.query('SELECT * FROM RESERVATIONS WHERE user_id = $1 ORDER BY record_id DESC', [userId]);
            const deals = dealsResult.rows;

            res.json({
                deals: deals
            });
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    });

    app.get('/profile', async (req, res) => {
    const userId = req.session.user.user_id;
    if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    try {
        // Получаем информацию о пользователе
        const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).render('404', { message: 'Пользователь не найден.' });
        }

        const user = userResult.rows[0];

        // Получаем заказы из таблицы RESERVATIONS
        const dealsResult = await pool.query('SELECT * FROM RESERVATIONS WHERE user_id = $1 ORDER BY record_id DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
        const deals = dealsResult.rows;

        // Получаем общее количество заказов
        const totalDealsResult = await pool.query('SELECT COUNT(*) FROM RESERVATIONS WHERE user_id = $1', [userId]);
        const totalDealsCount = parseInt(totalDealsResult.rows[0].count, 10);

        res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${user.first_name} ${user.surname}</title>
            <link rel="icon" href="/icons/favicon.ico" type="image/x-icon">
            <link rel="stylesheet" href="/css/main.css">
            <link rel="stylesheet" href="/css/profile.css">
            <script src="/js/scripts/auth.js"></script>
            <script src="/js/scripts/cancel_deal.js"></script>
        </head>
        <body>
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="/">
                            <img style="width: 100px;" src="/img/logo.png">
                        </a>
                        <nav class="header-nav">
                            <a class="button-link" href="/fields">Аренда Полей</a>
                            <a class="button-link" href="#contacts">Контакты</a>
                            <a class="button-link" href="#reviews">О нас</a>
                        </nav>
                    </div>  
                </div>
            </header>

            <div class="container"> 
                <div style="display:flex; padding:40px;">
                    <div style="color:black; padding:20px; width: 40%;">
                        <h2>Информация о пользователе</h2>
                        <table class="table-shop" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <th>Имя</th>
                                <td>${user.first_name}</td>
                            </tr>
                            <tr>
                                <th>Фамилия</th>
                                <td>${user.surname}</td>
                            </tr>
                            <tr>
                                <th>Отчество</th>
                                <td>${user.middlename || 'Не указано'}</td>
                            </tr>
                            <tr>
                                <th>Телефон</th>
                                <td>${user.telephone_number}</td>
                            </tr>
                        </table>

                    </div><!-- Deals Table -->
                    <div style="color:black; padding:20px; width: 60%;">
                        <h2>История заказов</h2>

                        ${deals.length > 0 ? `
                        <table class="table-shop" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th>ID Записи</th> <!-- ID записи -->
                                    <th>Статус</th> <!-- Статус бронирования -->
                                    <th>Итоговая сумма</th> <!-- Итоговая сумма -->
                                    <!-- Добавьте другие поля по необходимости -->
                                </tr>
                            </thead>
                            <tbody id="deal-table-body">
                                ${deals.map(deal => `
                                    <tr>
                                        <td style="${deal.status === 'Отменено' ? 'color:red;' : deal.status === 'Подтверждено' ? 'color:orange;' : deal.status === 'Завершено' ? 'color:green;' : ''}">
                                            ${deal.status}
                                        </td> 
                                        <!-- Итоговая сумма -->
                                        <td>${deal.total_price} ₽</td> 
                                        <!-- Действия, если необходимо -->
                                    </tr>`).join('')}
                            </tbody>
                        </table>` : `
                        <p>У вас нет активных заказов.</p>`}
                    </div>

                </div>  
            </div>

        </body>
        </html>`);
    } catch (error) {
        console.error(error);
        res.redirect("/404");
    }
});
};