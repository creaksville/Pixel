const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS user_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guildname TEXT,
      user_id TEXT,
      username TEXT,
      usercolor VARCHAR(255) DEFAULT null,
      mentionOnLevelUp BOOLEAN DEFAULT 1
    )`);

    connection.release();
  } catch (error) {
    console.error(error);
  }
}

