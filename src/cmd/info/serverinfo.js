const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Retrieve Server Information'),
    usage: '',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;

        try {
            const guild = interaction.guild;
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

            await interaction.guild?.members.fetch(interaction.guild?.ownerId).then(async (owner) => {
                const ownerTag = owner.user ? owner.user.tag : 'Unknown';
                const created = interaction.guild?.createdAt.toLocaleString();
                const channels = interaction.guild?.channels.cache.size;
                const roles = interaction.guild?.roles.cache.size;
                const emojis = interaction.guild?.emojis.cache.size;
                const members = interaction.guild?.memberCount;
                const bots = interaction.guild?.members.cache.filter(member => member.user.bot).size;

            
                const infoEmbed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle(`${guild.name} Server Information`)
                    .addFields({ name: 'Owner', value: ownerTag, inline: true })
                    .addFields({ name: 'Created', value: created, inline: true })
                    .addFields({ name: 'Channels', value: `${channels}`, inline: true })
                    .addFields({ name: 'Roles', value: `${roles}`, inline: true })
                    .addFields({ name: 'Emojis', value: `${emojis}`, inline: true })
                    .addFields({ name: 'Members', value: `${members} (${bots} bots)`, inline: true })
                    .setThumbnail(client.user.displayAvatarURL())
                    .setTimestamp();
                    
                interaction.reply({ embeds: [infoEmbed] });
            })
        } catch(error) {
            console.error(error);
        }
    },
  };
  