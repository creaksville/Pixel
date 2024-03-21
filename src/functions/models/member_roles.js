const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS member_roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id TEXT,
      guild_name TEXT,
      username TEXT,
      user_id TEXT,
      role_id TEXT
    )`);

    connection.release();
  } catch (error) {
    
  }
}

