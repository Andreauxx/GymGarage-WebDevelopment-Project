const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',  // Use the IP address 127.0.0.1, which is equivalent to localhost
    user: 'root',  // Username as shown in the image
    password: 'pastilsiomaiproben123',  // Replace with the actual password for the root user
    database: 'gymgarage',  // Add the name of your database here
    port: 3306,  // Default MySQL port
    connectionLimit: 10  // Limit connections to avoid overwhelming the server
});

module.exports = pool.promise();  // Use promise-based queries for async/await

pool.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('MySQL connection successful:', results);
    }
});
