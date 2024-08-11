const getConnection = require('../../functions/database/connectDatabase');
const { Webhook } = require('discord-webhook-node');
console.log(`DB Record Creation Event Started at ${new Date().toLocaleString()}`);

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        try {
            const connection = await getConnection();
                const [enableRecordRow] = await connection.query("SELECT * FROM cfg_enable WHERE guild_id = ?", [guild.id]);
                const [channelRecordRow] = await connection.query("SELECT * FROM cfg_channels WHERE guild_id = ?", [guild.id]);            
                const [miscRecordRow] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guild.id]);
            connection.release();

            const existingChannelRecord = channelRecordRow[0];
            const existingEnableRecord = enableRecordRow[0];
            const existingMiscRecord = miscRecordRow[0];

            if (!existingChannelRecord && !existingEnableRecord && !existingMiscRecord) {
                const insertEnableSql = `
                  INSERT INTO cfg_enable (guild_id, guild_name)
                  VALUES (?, ?)
                `;
                await connection.query(insertEnableSql, [guild.id, guild.name]);
                console.log('Created Enable/Disable Record');
        
                const insertChannelRecord = `
                  INSERT INTO cfg_channels (guild_id, guild_name)
                  VALUES (?, ?)
                `;
                await connection.query(insertChannelRecord, [guild.id, guild.name]);
                console.log('Created Channel ID Record');
        
                const insertMiscRecord = `
                  INSERT INTO cfg_misc (guild_id, guildname)
                  VALUES (?, ?)
                `;
                await connection.query(insertMiscRecord, [guild.id, guild.name]);
                console.log('Created Misc Record Record');
            } else {
                console.log('Guild Already Has One or More Active Database Records. No Action has been taken');
            }
            console.log(`Joined guild "${guild.name}" with ID "${guild.id}"`);
        } catch(error) {
            console.error(error);
        }
    }
}