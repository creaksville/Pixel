const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS bumplb (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guildId TEXT,
      guildname TEXT,
      userId TEXT,
      username TEXT,
      total_bumps INT
    )`);
    connection.release();
  } catch (error) {
    
  }
}

