const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

// Экспортируем функцию для получения полей
module.exports = (app) => {

app.get('/select_fields', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM FIELDS');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных о полях.');
    }
});

app.get('/search_fields', async (req, res) => {
    const query = req.query.query;
    
    try {
        const result = await pool.query(
            'SELECT * FROM FIELDS WHERE name_field ILIKE $1',
            [`%${query}%`]
        );
        res.json(result.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при поиске полей.');
    }
});

app.delete('/delete_field/:id', async (req, res) => {
    const fieldId = req.params.id;
    
    try {
        await pool.query('DELETE FROM FIELDS WHERE field_id = $1', [fieldId]);
        res.sendStatus(204); // Успешное удаление
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при удалении поля.');
    }
});
};