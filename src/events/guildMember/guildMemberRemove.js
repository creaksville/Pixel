const getConnection = require('../../functions/database/connectDatabase');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(guildMember, client) {
    try {
        const connection = await getConnection();
            const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildMember?.guild.id]);
            const [enableRows] = await connection.query("SELECT leaver FROM cfg_enable WHERE guild_id = ?", [guildMember?.guild.id]);
            const [channelRows] = await connection.query("SELECT leaver FROM cfg_channels WHERE guild_id = ?", [guildMember?.guild.id]);
        connection.release();

        if (!guildMember || !guildMember.guild) {
            console.log('guildMember is undefined or has no guild.');
            return;
        }
        
        console.log(`${guildMember.user.tag} has left ${guildMember?.guild.name}!`);

        const embedColor = miscRows[0].mastercolor;
        const guildEnable = enableRows[0].leaver;
        const guildChannel = channelRows[0].leaver;

        if (guildEnable && guildChannel && guildEnable === 1) {
            const newEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Member Left')
                .setDescription(`**Members Left: ${guildMember?.guild.memberCount} Members**`)
                .addFields(
                    {name: `We Are Sad To See You Go \:(`, value: `**We Hope To See You Soon**`},
                    {name: 'Member:', value: `**${guildMember?.user.tag}**`},
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