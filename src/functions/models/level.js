const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS level (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guildId TEXT,
      guildname TEXT,
      userId TEXT,
      username TEXT,
      xp INT,
      totalxp INT,
      level INT
    )`);
    connection.release();
  } catch (error) {
    
  }
}

