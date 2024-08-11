const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS warnings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guild_name TEXT,
      warningid TEXT,
      username TEXT,
      modname TEXT,
      reason TEXT,
      timestamp TEXT
    )`);

    connection.release();
  } catch (error) {
    console.error(error);
  }
}

