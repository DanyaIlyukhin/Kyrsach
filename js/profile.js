const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

module.exports = (app) => {
    // Получение данных пользователя по ID
    app.get('/profile/:userId', async (req, res) => {
        const userId = req.params.userId;
        try {
            const result = await pool.query('SELECT user_id, first_name, surname, middlename, login, telephone_number, account_status, user_status FROM users WHERE user_id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).send('Пользователь не найден');
            }
            res.json(result.rows[0]); // Возвращаем данные пользователя
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении данных пользователя');
        }
    });

    // Получение заказов пользователя
    app.get('/orders/:userId', async (req, res) => {
        const userId = req.params.userId;
        try {
            const result = await pool.query('SELECT order_id, order_date, order_status FROM orders WHERE user_id = $1', [userId]);
            res.json(result.rows); // Возвращаем данные заказов
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении заказов');
        }
    });
}