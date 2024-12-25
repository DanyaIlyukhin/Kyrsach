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
    app.get('/fields/:fieldId', async (req, res) => {
        const fieldId = req.params.fieldId;
        try {
            const result = await pool.query('SELECT * FROM fields WHERE field_id = $1', [fieldId]);
            if (result.rows.length === 0) {
                return res.status(404).send('Поле не найдено');
            }
            res.json(result.rows[0]); 
        } catch (error) {
            console.error(error);
            res.status(500).send('Ошибка при получении данных поля');
        }
    });

    app.get('/edit-field/:fieldId', async (req, res) => {
        const fieldId = req.params.fieldId;

        try {
            const result = await pool.query('SELECT * FROM fields WHERE field_id = $1', [fieldId]);
            if (result.rows.length === 0) {
                return res.status(404).send('Поле не найдено');
            }

            const field = result.rows[0];
            
            res.send(`
            <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Редактирование Поля</title>
        <link rel="stylesheet" href="/css/main.css">
    </head>

    <body>
        <header class="header">
            <div class="container">
                <h1>Редактирование Поля</h1>
            </div>
        </header>

        <main>
            <div class="container">
                <h2>Изменить данные</h2>
                <form id="update-form" enctype="multipart/form-data" action="/fields/update/${field.field_id}" method="POST">
                    <label for="name_field">Название поля:</label>
                    <input type="text" id="name_field" name="name_field" value="${field.name_field}" required />

                    <label for="address">Адрес:</label>
                    <input type="text" id="address" name="address" value="${field.address}" required />

                    <label for="size_field">Размер поля:</label>
                    <input type="text" id="size_field" name="size_field" value="${field.size_field}" required />

                    <label for="number_of_players">Количество игроков:</label>
                    <input type="text" id="number_of_players" name="number_of_players" value="${field.number_of_players}" required />

                    <label for="type_of_coating">Тип покрытия:</label>
                    <input type="text" id="type_of_coating" name="type_of_coating" value="${field.type_of_coating}" required />

                    <label for='is_lighting'>Освещение:</label>
                    <select id='is_lighting' name='is_lighting' required>
                        <option value='true' ${field.is_lighting ? 'selected' : ''}>Да</option>
                        <option value='false' ${!field.is_lighting ? 'selected' : ''}>Нет</option>
                    </select>

                    <!-- Остальные поля аналогично... -->

                    <!-- Кнопка отправки -->
                    <button type='submit'>Сохранить изменения</button >
                </form >
            </div >
            
    </body >
    </html >
            `);
        } catch (error) {
            console.error(error);
            res.status(500).send(`Ошибка при получении данных о поле: ${error.message}`);
        }
    });

}