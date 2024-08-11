const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS lvlroles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guild_name TEXT,
      role_id TEXT,
      levels INT
    )`);

    connection.release();
  } catch (error) {
    
  }
}

