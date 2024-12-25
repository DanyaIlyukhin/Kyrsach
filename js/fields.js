const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.user_status === 'admin') {
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
        const fieldId = req.params.fieldId; 
    
        try {
            const result = await pool.query('SELECT * FROM fields WHERE field_id = $1', [fieldId]);
    
            if (result.rows.length === 0) {
                return res.status(404).send('Поле не найдено.');
            }
    
            const field = result.rows[0];
            const formattedPrice = field.price; 
            
            const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const currentDate = new Date();
            const days = [];
            
            for (let i = 0; i < 7; i++) {
                const nextDay = new Date(currentDate);
                nextDay.setDate(currentDate.getDate() + i);
                days.push(nextDay);
            }

            // Получаем занятые временные слоты для этого поля и текущей даты
            const busySlots = await getBusySlots(fieldId, days);

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
    <script rel="stylesheet" src="/help.js"></script>
    <script rel="stylesheet" src="/scripts/authorization.js"></script>
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
                    <a class="button-link" href="#reviews">Отзывы</a>
                </nav>

                <div id="admin-panel" style="display: none;">
                    <a class="button-link" href="/panel">Панель управления</a>
                    <a class="button-link"   href="/profile">Профиль</a>
                    <button id="logout-button-1" class="back-button-link" style="color:  #5687fc;">Выход</button>
                </div>
                
                <div id="auth-buttons">
                    <a id="loginButton" class="button-link" href="#" onclick="openModal()">Вход</a> 
                </div>
                <div id="user-cabinet" style="display: none;">
                    <a class="button-link" href="/profile">Профиль</a>
                    <button id="logout-button-2" class="back-button-link" style="color:  #5687fc;">Выход</button>
                </div>
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

                <!-- Доступные дни и время аренды -->
                <h2 style="margin-top: 50px;">Доступные дни и время аренды</h2>
                <div style="display: flex; align-items: center;">
                    <button id="prev-week" style="margin-right: 10px;">&#9664; Предыдущая неделя</button>
                    <div id="week-title" style="flex-grow: 1; text-align: center;"></div>
                    <button id="next-week" style="margin-left: 10px;">Следующая неделя &#9654;</button>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            ${days.map(day => `
                                <th>${daysOfWeek[day.getDay()]}<br>${day.toLocaleDateString()}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            ${days.map((day) => `
                                <td data-date="${day.toISOString().split('T')[0]}">
                                    <!-- Множественный выбор времени -->
                                    ${Array.from({ length: 14 }, (_, i) => {
                                        const hour = i + 9; // Например, с 9 до 22 часов
                                        const dateStr = day.toISOString().split('T')[0];
                                        // Проверяем заняты ли слот
                                        const isDisabled = busySlots[dateStr] && busySlots[dateStr].includes(i + 1); // Проверяем занятость слота
                                        return `
                                            <label>
                                                <input type="checkbox" name="time_slot[]" value="${hour}:00" ${isDisabled ? 'disabled' : ''}> 
                                                ${hour}:00
                                            </label><br>`;
                                    }).join('')}
                                </td>
                            `).join('')}
                        </tr>
                    </tbody>
                </table>
                <!-- Итоговая сумма -->
                <h3 style="margin-top: 20px; display: inline-block;">Итоговая сумма: <span id="total-amount">0</span> ₽</h3>
                <button type="submit" style="margin-left: 20px; padding: 5px 10px; font-size: 14px;">Забронировать</button>
                

                <!-- Форма для создания контракта -->
                <h2 style="margin-top: 50px;">Создание контракта с организацией</h2>
                <form action="/createContract" method="POST" enctype="application/x-www-form-urlencoded">
                    <div style="margin-bottom: 20px;">
                        <label for="organization_name">Название организации:</label>
                        <input type="text" id="organization_name" name="organization_name" required>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="contract_start_date">Дата начала контракта:</label>
                        <input type="date" id="contract_start_date" name="contract_start_date" required>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="contract_end_date">Дата окончания контракта:</label>
                        <input type="date" id="contract_end_date" name="contract_end_date" required>
                    </div>

                    <!-- Кнопка отправки -->
                    <button type="submit">Создать контракт</button>
                </form>

                <!-- Форма для создания мероприятия -->
                <h2 style="margin-top: 50px;">Создание мероприятия</h2>
                <form action="/createEvent" method="POST" enctype="application/x-www-form-urlencoded">
                    <div style="margin-bottom: 20px;">
                        <label for="event_type">Тип мероприятия:</label>
                        <select id="event_type" name="event_type" required>
                            <option value="">Выберите тип мероприятия</option>
                            <option value="ремонт">Ремонт</option>
                            <option value="уборка">Уборка</option>
                        </select>
                    </div>
                    

                    <!-- Кнопка отправки -->
                    <button type="submit">Создать мероприятие</button>
                </form>
                
<script>
// Функция для обновления итоговой суммы
function updateTotal() {
    const pricePerHour = ${formattedPrice}; // Получаем стоимость аренды
    const checkboxes = document.querySelectorAll('input[name="time_slot[]"]:checked'); // Получаем все отмеченные чекбоксы
    const totalAmount = checkboxes.length * pricePerHour; // Подсчитываем общую сумму
    document.getElementById('total-amount').textContent = totalAmount; // Обновляем текст в элементе с итоговой суммой
}
document.querySelectorAll('input[name="time_slot[]"]').forEach(checkbox => {
   checkbox.addEventListener('change', updateTotal); // Обновляем сумму при изменении состояния чекбокса
});


</script>

            </div>
        </div>  
    </div> 
</main>

`);
        } catch (error) {
            console.error(error);
        }
    });
};

// Функция для получения занятых слотов
async function getBusySlots(fieldId, days) {
    const busySlots = {}; // Объект для хранения занятых слотов по датам

    for (const day of days) {
        const dateStr = day.toISOString().split('T')[0]; // Форматируем дату
        try {
            const result = await pool.query(
                `SELECT number_slot FROM TIMESLOTS WHERE field_id = $1 AND date_start = $2`,
                [fieldId, dateStr]
            );
            busySlots[dateStr] = result.rows.map(row => row.number_slot); // Сохраняем занятые номера слотов для этой даты
        } catch (error) {
            console.error(error);
        }
    }
    return busySlots; // Возвращаем объект с занятыми слотами
}