const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.user_status === 'admin') { // Проверяем наличие пользователя и его статус
        next();
    } else {
        res.redirect('/404');
    }
};

// Экспортируем функцию для получения полей
module.exports = (app) => {

    app.get('/select_fields', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM FIELDS ORDER BY name_field ASC;');
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении данных о полях.');
        }
    });

    app.get('/search_fields', async (req, res) => {
        const query = req.query.query;
        
        try {
            const result = await pool.query('SELECT * FROM FIELDS WHERE name_field ILIKE $1',[`%${query}%`]);
            res.json(result.rows); 
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при поиске полей.');
        }
    });

    app.get('/image/:fieldId', async (req, res) => {
        const fieldId = req.params.fieldId; 
        try {
            const result = await pool.query('SELECT photo FROM fields WHERE field_id = $1', [fieldId]);
            if (result.rows.length === 0) {
                return res.status(404).send('Изображение не найдено.');
            }
            const imageBuffer = result.rows[0].photo;
            if (!imageBuffer) {
                return res.status(404).send('Изображение не найдено.'); 
            }
            res.set('Content-Type', 'image/jpeg');
            res.send(imageBuffer); 
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении изображения.');
        }
    });
    app.get('/field/:fieldId', async (req, res) => {
        const fieldId = req.params.fieldId; // Получаем field_id из параметров URL
    
        try {
            const result = await pool.query('SELECT * FROM fields WHERE field_id = $1', [fieldId]);
    
            if (result.rows.length === 0) {
                return res.status(404).send('Поле не найдено.');
            }
    
            const field = result.rows[0];
            const formattedPrice = field.price; // Предполагается, что цена уже отформатирована в нужном виде
    
            // Рендерим HTML-страницу с данными о поле
            res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${field.name_field} - Поля</title>
        <link rel="icon" href="/icons/favicon.ico" type="image/x-icon">
        <link rel="stylesheet" href="/css/main.css">
        <link rel="stylesheet" href="/css/fields.css">
        <script rel="stylesheet" src="/js/scripts/authorization.js"></script> 
    </head>
    <body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="/">
                    <img style="width: 100px;" src="../img/logo.png" alt="Логотип">
                </a>
                <nav class="header-nav">
                    <a class="button-link" href="/fields">Аренда полей</a>
                    <a class="button-link" href="#contacts">Контакты</a>
                    <a class="button-link" href="#reviews">О нас</a>
                </nav>
            </div>
        </div>
    </header>
    <main>
        <div class="container"> 
            <div style="display:flex;">
                <div style="padding:20px;">
                    <div style="margin: 0px 0px 20px 0px">
                        <a class="back-button-color" href="javascript:void(0);" onclick="window.history.back();">Назад</a>
                    </div>
                    <div>
                        <img style="width:600px;" src="/image/${fieldId}" alt="${field.name_field}">
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; color:black; padding:60px 20px; width: 100%;">
                    <h2>${field.name_field}</h2>
                    <p>Цена: ${formattedPrice} ₽ / час</p>
                    <table class="table-shop" style="width: 100%; border-collapse: collapse;">
                        <tr><th>Адрес</th><td>${field.address}</td></tr>
                        <tr><th>Размер поля</th><td>${field.size_field}</td></tr>
                        <tr><th>Количество игроков</th><td>${field.number_of_players}</td></tr>
                        <tr><th>Тип покрытия</th><td>${field.type_of_coating}</td></tr>
                        <tr><th>Освещение</th><td>${field.is_lighting ? 'Есть' : 'Нет'}</td></tr>
                        <tr><th>Скамейки</th><td>${field.is_stands ? 'Есть' : 'Нет'}</td></tr>
                        <tr><th>Раздевалки</th><td>${field.is_changings_rooms ? 'Есть' : 'Нет'}</td></tr>
                        <tr><th>Парковка</th><td>${field.is_parking ? 'Есть' : 'Нет'}</td></tr>
                    </table>
    
                    <!-- Форма для создания сделки -->
                    <h2 style="margin-top: 50px;">Создание сделки</h2>
                    <form action="/createDeal" method="POST" enctype="application/x-www-form-urlencoded">
                        <!-- Поля формы -->
                        <!-- ... аналогично вашему коду ... -->
                        
                        <!-- Скрытое поле для ID поля -->
                        <input type="hidden" id="field_id" name="field_id" value="${fieldId}"> 
    
                        <!-- Кнопка отправки -->
                        <button type="submit">Создать сделку</button>
                    </form>
    
                </div>
            </div>  
        </div> 
        <!-- Контакты и отзывы -->
        <!-- ... аналогично вашему коду ... -->
    </main>
    </body>
    </html>
            `);
        } catch (error) {
            console.error(error);
            res.redirect("/404");
        }
    });
    
};