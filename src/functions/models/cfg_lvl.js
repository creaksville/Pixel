const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS cfg_lvl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guildname TEXT,
      min_xp TEXT,
      max_xp TEXT,
      leaderboard_style TEXT,
      leaderboard_background TEXT,
      rankcard_background TEXT
    )`);

    connection.release();
  } catch (error) {
    console.error(error);
  }
}

