

document.getElementById('day-select').addEventListener('change', async function() {

    const selectedDate = this.value;
    const field_id = document.getElementById('field-id').textContent;
    const message = document.getElementById('field-id');
    // message.textContent = selectedDate;
    // try {
    //     const result = await pool.query('SELECT * FROM TIMESLOTS WHERE field_id = $1 and date_start = $2', [fieldId, selectedDate]);

    //     if (result.rows.length === 0) {
    //         return res.status(404).send('Поле не найдено.');
    //     }
    //     const tableBody = document.getElementById('field-table-body');
    //     tableBody.innerHTML = ''; // Очищаем текущую таблицу

    //     result.forEach(slot => {
    //         const row = document.createElement('tr');
    //         // const message = document.getElementById('field-id').textContent;
    //         // message = 'slot.number_slot';
    //         row.innerHTML = `
    //             <td>${slot.number_slot}</td>
    //             `;

            
    //         tableBody.appendChild(row);})
    // }
    // catch{

    // }
    const { Pool } = require('pg');
    
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'coursework',
        password: '141104',
        port: 5432,
    });

    const result = await pool.query('SELECT * FROM TIMESLOTS WHERE field_id = $1 AND date_start = $2', [fieldId, selectedDate]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Временные слоты не найдены.' });
        }

        res.json(result.rows); // Возвращаем найденные временные слоты
});