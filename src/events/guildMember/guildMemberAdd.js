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
        const guildEnable = enableRows[0].greeter;
        const guildChannel = channelRows[0].greeter;

        if (guildEnable && guildChannel && guildEnable === 1) {
            const newEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Member Joined')
                .setDescription(`Welcome to ${guildMember?.guild.name}, ${guildMember?.user}`)
                .addFields(
                    {name: `Welcome To ${guildMember?.guild.name}`, value: `**We Hope You Enjoy Your Stay**`},
                    {name: 'Member Count:', value: `We Officially Have **${guildMember?.guild.memberCount}** Members`},
                )
                .setThumbnail(guildMember.user.avatarURL())
                .setTimestamp();
            
            guildMember.guild.channels.cache.get(guildChannel).send({ embeds: [newEmbed] });
        }
    } catch(error) {
        console.error(error);
    }
    }
};