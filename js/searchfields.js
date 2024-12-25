const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coursework',
    password: '141104',
    port: 5432,
});

function findFields() {
    
const query = document.getElementById('search-input').value;
if(query){
    try {
    const result =  pool.query('SELECT * FROM FIELDS WHERE name_field ILIKE $1',[`%${query}%`]);
    res.json(result.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при поиске полей.');
        }
    }
}