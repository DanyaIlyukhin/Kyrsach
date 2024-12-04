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
module.exports = (app) => {
    app.get('/select_users', isAdmin, async (req, res) => {
        try {
            const result = await pool.query('SELECT user_id, first_name, surname, middlename, login, telephone_number, account_status, user_status FROM users'); 
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении списка пользователей');
        }
    });
}