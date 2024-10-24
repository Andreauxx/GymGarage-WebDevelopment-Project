import mysql from "mysql2";

import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST, 
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
}).promise()

// pool.query('SELECT 1 + 1 AS result', (err, results) => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log('MySQL connection successful:', results);
//     }
// });

export async function getNotes(){
    const [rows] = await pool.query("SELECT * FROM notes");
    return rows;
}

export async function getNote(id) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM notes
        WHERE id = ?
        `, [id]);
    return rows;
}

export async function createNote(title, contents){
    const [result] = await pool.query(`
        INSERT INTO notes (title, contents)
        VALUES (?, ?)
    `, [title, contents]);
    const id = result.insertId;
    return getNote(id);
}
