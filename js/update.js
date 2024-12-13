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

module.exports = (app, upload) => {
    // Получение данных поля по ID
app.get('/fields/:fieldId', async (req, res) => {
    const fieldId = req.params.fieldId;
    try {
        const result = await pool.query('SELECT * FROM fields WHERE field_id = $1', [fieldId]);
        if (result.rows.length === 0) {
            return res.status(404).send('Поле не найдено');
        }
        res.json(result.rows[0]); // Возвращаем данные поля
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении данных поля');
    }
});

// Маршрут для редактирования поля
app.post('/fields/update/:fieldId', upload.single('photo'), async (req, res) => {
    const fieldId = req.params.fieldId;
    
    const { 
        name_field, 
        address, 
        size_field, 
        number_of_players, 
        type_of_coating, 
        is_lighting, 
        is_stands, 
        is_changings_rooms, 
        is_parking, 
        price, 
        information 
    } = req.body;

    let photo = req.file ? req.file.buffer : null; // Получаем загруженный файл, если он есть

    try {
        const query = `
            UPDATE fields SET 
                name_field = $1,
                address = $2,
                size_field = $3,
                number_of_players = $4,
                type_of_coating = $5,
                is_lighting = $6,
                is_stands = $7,
                is_changings_rooms = $8,
                is_parking = $9,
                photo = COALESCE($10, photo), -- Сохраняем существующее фото, если новое не загружено
                price = $11,
                information = $12
            WHERE field_id = $13
        `;

        const values = [
            name_field,
            address,
            size_field,
            number_of_players,
            type_of_coating,
            is_lighting === 'true',
            is_stands === 'true',
            is_changings_rooms === 'true',
            is_parking === 'true',
            photo,
            price,
            information,
            fieldId
        ];

        await pool.query(query, values);
        res.redirect('/fields'); // Перенаправление на страницу со списком полей или другую страницу по вашему выбору
    } catch (error) {
        console.error(error);
        res.status(500).send(`Ошибка при обновлении данных поля: ${error.message}`);
    }
});
}