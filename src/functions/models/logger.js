const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS logger_enable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(255),
        guild_name VARCHAR(255),
        channelCreate BOOLEAN DEFAULT 0,
        channelDelete BOOLEAN DEFAULT 0,
        channelUpdate BOOLEAN DEFAULT 0,
        guildBanAdd BOOLEAN DEFAULT 0,
        guildBanRemove BOOLEAN DEFAULT 0,
        guildEmojisUpdate BOOLEAN DEFAULT 0,
        guildMemberAdd BOOLEAN DEFAULT 0,
        guildMemberDelete BOOLEAN DEFAULT 0,
        guildMemberKick BOOLEAN DEFAULT 0,
        guildMemberNickUpdate BOOLEAN DEFAULT 0,
        guildMemberUpdate BOOLEAN DEFAULT 0,
        guildRoleCreate BOOLEAN DEFAULT 0,
        guildRoleDelete BOOLEAN DEFAULT 0,
        guildUpdate BOOLEAN DEFAULT 0,
        messageDelete BOOLEAN DEFAULT 0,
        messageDeleteBulk BOOLEAN DEFAULT 0,
        messageUpdate BOOLEAN DEFAULT 0,
        voiceChannelJoin BOOLEAN DEFAULT 0,
        voiceChannelLeave BOOLEAN DEFAULT 0,
        voiceChannelSwitch BOOLEAN DEFAULT 0,
        voiceStateUpdate BOOLEAN DEFAULT 0
    )`);

    connection.release();
  } catch (error) {
    
  }
}

