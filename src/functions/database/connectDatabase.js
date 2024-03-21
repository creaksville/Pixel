const mysql = require('mysql2/promise');
const web = require('../../config/webconfig');

// Define pool at the module level
const config = {
    host: web.mysql_host,
    user: web.mysql_user,
    password: web.mysql_pass,
    database: web.mysql_database,
};

const pool = mysql.createPool(config);

// Set an interval to periodically check the MySQL connection status
setInterval(logMySQLConnectionStatus, 60 * 60 * 1000);

// Function to get a connection from the pool
const getConnection = async () => {
    return await pool.getConnection();
};

async function logMySQLConnectionStatus() {
    try {
        // Check the MySQL connection status
        const [rows] = await pool.execute('SELECT 1'); // Destructure the result to get 'rows'

        if (rows && rows.length > 0) {
            console.log('MySQL connection is active at', new Date().toLocaleString());
        } else {
            console.log('MySQL connection is not active at', new Date().toLocaleString());
        }
    } catch (error) {
        console.error('Error checking MySQL connection:', error);
    }
}

module.exports = getConnection; // Export the getConnection function
