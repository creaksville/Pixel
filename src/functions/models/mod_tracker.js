const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS mod_tracker (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guild_name TEXT,
      username TEXT,
      modname TEXT,
      modevent TEXT,
      reason VARCHAR(255) DEFAULT 0,
      duration VARCHAR(255) DEFAULT 0,
      number_of_messages VARCHAR(255) DEFAULT 0,
      timestamp TEXT
    )`);

    connection.release();
  } catch (error) {
    
  }
}

