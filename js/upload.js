const { Pool } = require('pg');
const path = require('path');


module.exports = (app, upload) => {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'coursework', 
        password: '141104', 
        port: 5432,
    });

    app.post('/upload_field', upload.single('photo'), async (req, res) => {
        const file = req.file;

        if (!file) {
            return res.status(400).send('Нет файла для загрузки.');
        }

        try {
            const { originalname, buffer } = file;
            const query = `
                INSERT INTO fields (name_field, address, size_field,
                                    number_of_players, type_of_coating,
                                    is_lighting, is_stands,
                                    is_changings_rooms, is_parking,
                                    photo, price, information)
                VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9,$10, $11, $12)`;

            const values = [
                req.body.name_field,
                req.body.address,
                req.body.size_field,
                req.body.number_of_players,
                req.body.type_of_coating,
                req.body.is_lighting === 'true', // Преобразование строки в булевое значение
                req.body.is_stands === 'true',
                req.body.is_changings_rooms === 'true',
                req.body.is_parking === 'true',
                buffer,
                req.body.price,
                req.body.information
            ];

            await pool.query(query, values);
            res.send(`Поле ${req.body.name_field} успешно загружено в базу данных!`);
        } catch (error) {
            console.error(error);
            res.status(500).send(`Ошибка при сохранении поля в базу данных: ${error.message}`);
        }
    });

    app.get('/image/:field_id', async (req, res) => {
        const field_id = req.params.field_id;

        try {
            const result = await pool.query('SELECT photo FROM fields WHERE field_id = $1', [field_id]);

            if (result.rows.length === 0) {
                return res.status(404).send('Изображение не найдено.');
            }

            const imageBuffer = result.rows[0].photo;
            res.set('Content-Type', 'image/jpeg');
            res.send(imageBuffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении изображения.');
        }
    });
};