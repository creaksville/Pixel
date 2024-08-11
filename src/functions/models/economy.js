const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS economy (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guildname TEXT,
      user_id TEXT,
      username TEXT,
      wallet INT,
      bank INT,
      last_daily TEXT
    )`);
    connection.release();
  } catch (error) {
    
  }
}

