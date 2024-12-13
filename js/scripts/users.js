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
            const result = await pool.query('SELECT user_id, first_name, surname, middlename, login, telephone_number, account_status, user_status FROM users ORDER BY user_status ASC, user_id ASC;'); 
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении списка пользователей');
        }
    });

    app.post('/update_user_status/:id', async (req, res) => {
        const userId = req.params.id; 
        const { user_status } = req.body; 
    
        try {
            // Обновляем статус пользователя в базе данных
            await pool.query('UPDATE users SET user_status = $1 WHERE user_id = $2', [user_status, userId]);
    
            // Отправляем успешный ответ
            res.sendStatus(200); 
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при обновлении статуса аккаунта.');
        }

        app.post('/update_account_status/:id', async (req, res) => {
            const userId = req.params.id; 
            const { account_status } = req.body; 

            try {
                await pool.query('UPDATE users SET account_status = $1 WHERE user_id = $2',[true, userId] );
                res.sendStatus(200); 
            } catch (error) {
                console.error(error);
                res.status(500).send('Ошибка при обновлении статуса аккаунта.');
            }
        });
    });
}
