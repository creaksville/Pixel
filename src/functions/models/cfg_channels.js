const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS cfg_channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(255),
        guild_name VARCHAR(255),
        bump VARCHAR(255) DEFAULT 0,
        funfact VARCHAR(255) DEFAULT 0,
        greeter VARCHAR(255) DEFAULT 0,
        leaver VARCHAR(255) DEFAULT 0,
        rss VARCHAR(255) DEFAULT 0,
        levelup VARCHAR(255) DEFAULT 0,
        modmail VARCHAR(255) DEFAULT 0,
    )`);

    connection.release();
  } catch (error) {
    
  }
}

