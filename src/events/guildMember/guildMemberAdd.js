const fs = require('fs');
const path = require('path');
const getConnection = require('../../functions/database/connectDatabase');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(guildMember, client) {
    try {
        const userId = guildMember?.user.id;
        const guildId = guildMember?.guild.id;
        const username = guildMember?.user.username;
        const guildname = guildMember?.guild.name;

	const configPath = path.join(__dirname, '../../custom/welcome-config.json');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const serverConfig = configData[guildId];

        if (!serverConfig) {
            console.log(`No configuration found for guild ${guildId}`);
            return;
        }

        const connection = await getConnection();
            const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildMember?.guild.id]);
            const [enableRows] = await connection.query("SELECT greeter FROM cfg_enable WHERE guild_id = ?", [guildMember?.guild.id]);
            const [channelRows] = await connection.query("SELECT greeter FROM cfg_channels WHERE guild_id = ?", [guildMember?.guild.id]);
            const [userConfigRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?`, [guildMember?.user.id, guildMember?.guild.id]);
        
            connection.query(`INSERT INTO user_config (user_id, username, guild_id, guildname) VALUES (?, ?, ?, ?)`, [userId, username, guildId, guildname]);
        connection.release();

        if (!guildMember || !guildMember.guild) {
            console.log('guildMember is undefined or has no guild.');
            return;
        }
        
        console.log(`${guildMember.user.tag} has joined ${guildMember.guild.name}!`);

        const embedColor = miscRows[0].mastercolor;
	const welcomeMessage = serverConfig.welcomeMessage || `Welcome to ${guildname}, ${username}!`;
        const guildEnable = enableRows[0].greeter;
        const guildChannel = channelRows[0].greeter;
	const userAvatar = guildMember.user.avatarURL() || 'https://i.pinimg.com/736x/8e/c8/98/8ec898fb5ca16f63a9557c2794b23a72.jpg';

        if (guildEnable && guildChannel && guildEnable === 1) {
            const newEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Member Joined')
                .setDescription(welcomeMessage.replace('{guildName}', guildname).replace('{user}', username).replace('{guildName}', guildname))
                .addFields(
                    {name: 'Member Count:', value: `We Officially Have **${guildMember?.guild.memberCount}** Members`}
                )
                .setThumbnail(userAvatar)
                .setTimestamp();
            
            guildMember.guild.channels.cache.get(guildChannel).send({ embeds: [newEmbed] });
        }
    } catch(error) {
        console.error(error);
    }
    }
};