const { SlashCommandBuilder, Client, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase"); // Import your MySQL connection pool

module.exports = {
      data: new SlashCommandBuilder()
          .setName('getuconf')
          .setDescription('Retrieves The User Configuration for the Guild (DEPRECATED SOON)'),
      usage: '<table>',
      async execute(interaction, client) {
        try {
            const database = 'user_config';

            console.log('Database:', database);
            console.log('Guild ID:', interaction.guild?.id);

            if (!database) {
                const tableNames = 'user_config'; // Update with your table names
                return interaction.reply(
                    `Please specify the database!! You can choose from the following tables:\n**${tableNames}**`
                );
            }

            let guildSettings;
            const guildId = interaction.guild.id;
            const userId = interaction.member?.user.id;
            const connection = await getConnection();

            switch (database) {
                case 'user_config':
                    const [enableRows] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
                    guildSettings = enableRows[0];
                    break;
                default:
                    return interaction.reply('Invalid table name.');
            }

            connection.release();


            if (!guildSettings) return;
                const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
                const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
            let userColor = userColorRow[0]?.usercolor
            let defaultColor = cfgMiscRows[0]?.mastercolor;
            let embedColor;

            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            const databaseEmbedMap = {
                user_config: {
                    title: 'User Config Settings',
                    description: 'Here are your current User Configuration Settings for This Guild:',
                },
            };

            const { title, description } = databaseEmbedMap[database];
            const newEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .setDescription(description)
                .setThumbnail(interaction.guild?.iconURL());

            const settingsText = Object.entries(guildSettings)
                .filter(([key, value]) => key !== 'guild_id' && key !== 'guildname' && key !== 'guild_name' && key !== 'username'  && key !== 'user_id' && key !== 'id')
                .map(([key, value]) => {
                    let formattedValue = value;

                    if (database === 'user_config') {
                        if (formattedValue == '1') {
                            formattedValue = 'True'
                        } else if (formattedValue == '0') {
                            formattedValue = 'False'
                        } else if (formattedValue == null) {
                            formattedValue = 'Default';
                        }
                    }

                    return `${key}: ${formattedValue}`;
                })
                .join('\n');

            newEmbed.addFields({ name: 'Settings', value: settingsText || 'No settings available.' });

            await interaction.reply({ embeds: [newEmbed] });
        } catch (error) {
            console.error(error);
        }
    },
};
