const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS cfg_misc (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guildname TEXT,
      bumprole VARCHAR(255) DEFAULT 0,
      autorole VARCHAR(255) DEFAULT 0,
      mastercolor VARCHAR(255) DEFAULT '#000000',
      leaderboard_style TEXT,
      leaderboard_background TEXT,
      rankcard_background TEXT
    )`);

    connection.release();
  } catch (error) {
    console.error(error);
  }
}

