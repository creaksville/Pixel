const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS logger_channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(255),
        guild_name VARCHAR(255),
        channelCreate VARCHAR(255) DEFAULT 0,
        channelDelete VARCHAR(255) DEFAULT 0,
        channelUpdate VARCHAR(255) DEFAULT 0,
        guildBanAdd VARCHAR(255) DEFAULT 0,
        guildBanRemove VARCHAR(255) DEFAULT 0,
        guildEmojisUpdate VARCHAR(255) DEFAULT 0,
        guildMemberAdd VARCHAR(255) DEFAULT 0,
        guildMemberDelete VARCHAR(255) DEFAULT 0,
        guildMemberKick VARCHAR(255) DEFAULT 0,
        guildMemberNickUpdate VARCHAR(255) DEFAULT 0,
        guildMemberUpdate VARCHAR(255) DEFAULT 0,
        guildRoleCreate VARCHAR(255) DEFAULT 0,
        guildRoleDelete VARCHAR(255) DEFAULT 0,
        guildUpdate VARCHAR(255) DEFAULT 0,
        messageDelete VARCHAR(255) DEFAULT 0,
        messageDeleteBulk VARCHAR(255) DEFAULT 0,
        messageUpdate VARCHAR(255) DEFAULT 0,
        voiceChannelJoin VARCHAR(255) DEFAULT 0,
        voiceChannelLeave VARCHAR(255) DEFAULT 0,
        voiceChannelSwitch VARCHAR(255) DEFAULT 0,
        voiceStateUpdate VARCHAR(255) DEFAULT 0
    )`);

    connection.release();
  } catch (error) {
    
  }
}

