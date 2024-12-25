const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

module.exports = (app, upload) => {
    // Функция для загрузки данных о полях
    async function fetchFields() {
        try {
            const response = await fetch('/select_fields'); // Убедитесь, что этот маршрут настроен на сервере
            if (!response.ok) {
                throw new Error('Ошибка при получении данных о полях');
            }
            const fields = await response.json();
            populateTable(fields);
        } catch (error) {
            console.error(error);
            alert('Не удалось загрузить данные о полях.');
        }
    }

    // Функция для заполнения таблицы данными о полях
    function populateTable(fields) {
        const tableBody = document.getElementById('field-table-body');
        tableBody.innerHTML = ''; // Очищаем текущую таблицу

        fields.forEach(field => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${field.field_id}</td>
                <td>${field.name_field}</td>
                <td>${field.address}</td>
                <td>${field.size_field}</td>
                <td>${field.number_of_players}</td>
                <td>${field.type_of_coating}</td>
                <td>${field.is_lighting ? 'Есть' : 'Нет'}</td>
                <td>${field.is_stands ? 'Есть' : 'Нет'}</td>
                <td>${field.is_changings_rooms ? 'Есть' : 'Нет'}</td>
                <td>${field.is_parking ? 'Есть' : 'Нет'}</td>

                <!-- Предполагается, что фото хранится по URL -->
                <td><img src="/image/${field.field_id}" alt="${field.name_field}" class="car-image"></td>

                <!-- Добавьте цену и информацию -->
                <td>${field.price}</td>
                <td>${field.information || 'Нет информации'}</td>

                <!-- Кнопки редактирования и удаления -->
                <td><button onclick="editField(${field.field_id})">Редактировать</button></td>
                <td><button onclick="deleteField(${field.field_id})">Удалить</button></td>`;
            
            tableBody.appendChild(row);
        });
    }

    // Функция поиска полей
    async function searchFields() {
        const query = document.getElementById('search-input').value.trim();
        
        if (query === '') {
            // Если строка поиска пуста, загружаем все поля
            fetchFields();
            return;
        }

        try {
            const response = await fetch(`/search_fields?query=${encodeURIComponent(query)}`); // Убедитесь, что этот маршрут настроен на сервере
            if (!response.ok) {
                throw new Error('Ошибка при поиске полей');
            }
            
            const fields = await response.json();
            populateTable(fields);
        } catch (error) {
            console.error(error);
            alert('Не удалось выполнить поиск полей.');
        }
    }

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

    // Функция редактирования поля
    function editField(fieldId) {
        window.location.href = `/edit-field/${fieldId}`; // Перенаправление на страницу редактирования
    }

    // Загружаем данные о полях при загрузке страницы
    document.addEventListener('DOMContentLoaded', fetchFields);
}