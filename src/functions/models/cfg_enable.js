const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS cfg_enable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(255),
      guild_name VARCHAR(255),
      autorole BOOLEAN DEFAULT 0,
      bump BOOLEAN DEFAULT 0,
      funfact BOOLEAN DEFAULT 0,
      greeter BOOLEAN DEFAULT 0,
      leaver BOOLEAN DEFAULT 0,
      rss BOOLEAN DEFAULT 0,
      selfping BOOLEAN DEFAULT 0,
      sudo BOOLEAN DEFAULT 0,
      levelIsCard BOOLEAN DEFAULT 0,
      reddit BOOLEAN DEFAULT 0
    )`);

    connection.release();
  } catch (error) {
    
  }
}

