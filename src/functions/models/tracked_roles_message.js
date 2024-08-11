const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS tracked_roles_message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(20),
        channel_id VARCHAR(20) NOT NULL,
        message_id VARCHAR(20) NOT NULL
    )`);

    connection.release();
  } catch (error) {
    
  }
}

