const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Sends Support Discord Server Invite Link'),
    usage: '',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;
        
        const connection = await getConnection();
            const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
            const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
        const defaultColor = cfgMiscRows[0].mastercolor;
        const userColor = userColorRow[0].usercolor;
        let embedColor;
        
        if (!userColor) {
            embedColor = defaultColor;
        } else if (userColor) {
            embedColor = userColor;
        }

        connection.release();
        try {
            const infoEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`Support Invite Link`)
                .addFields({ name: 'Server Name', value: `SystemdBot Support Server`})
                .addFields({ name: 'Invite Link', value: `https://discord.gg/nUu98TahRR`})
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();
                    
            interaction.reply({ embeds: [infoEmbed] });
        } catch(error) {
            console.error(error);
        }
    },
  };