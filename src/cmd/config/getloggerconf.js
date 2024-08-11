const { SlashCommandBuilder, Client, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase"); // Import your MySQL connection pool

module.exports = {
    data: new SlashCommandBuilder()
          .setName('getlogger')
          .setDescription('Retrieves The Configuration for the Guild (DEPRECATED SOON)')
          .addStringOption(option =>
                option
                    .setName('table')
                    .setDescription('Table to Look At')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Enable/Disable', value: 'logger_enable' },
                        { name: 'Channel IDs', value: 'logger_channels' },
                    )),
    usage: '<table>',
    async execute(interaction, client) {
        try {
            const database = interaction.options.getString('table');

            console.log('Database:', database);
            console.log('Guild ID:', interaction.guild?.id);

            if (!database) {
                const tableNames = ['logger_enable', 'logger_channels']; // Update with your table names
                return interaction.reply(
                    `Please specify the database!! You can choose from the following tables:\n**${tableNames.join('\n')}**`
                );
            }

            let guildSettings;
            const guildId = interaction.guild?.id;
            const userId = interaction.member.user.id;
            const connection = await getConnection();

            switch (database) {
                case 'logger_enable':
                    const [enableRows] = await connection.query("SELECT * FROM logger_enable WHERE guild_id = ?", [guildId]);
                    guildSettings = enableRows[0];
                    break;
                case 'logger_channels':
                    const [chidRows] = await connection.query("SELECT * FROM logger_channels WHERE guild_id = ?", [guildId]);
                    guildSettings = chidRows[0];
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
                logger_enable: {
                    title: 'Logger Enable Settings',
                    description: 'Here are the current Logger Enable Settings for This Guild:',
                },
                logger_channels: {
                    title: 'Logger Channel ID Settings',
                    description: 'Here are the current Logger Channel ID Settings for This Guild:',
                },
            };

            const { title, description } = databaseEmbedMap[database];
            const newEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .setDescription(description)
                .setThumbnail(interaction.guild?.iconURL());

            const settingsText = Object.entries(guildSettings)
                .filter(([key, value]) => key !== 'guild_id' && key !== 'guildname' && key !== 'guild_name' && key !== 'id')
                .map(([key, value]) => {
                    let formattedValue = value;

                    if (database === 'logger_channels' && /^\d+$/.test(formattedValue)) {
                        const channelId = formattedValue;
                        const channel = interaction.guild?.channels.cache.get(channelId);
                        if (!channelId) {
                            formattedValue = 'NOT A VALID CHANNEL';
                        }
                        formattedValue = channel ? `<#${channelId}>` : formattedValue;
                    }

                    if (database === 'logger_enable') {
                        if (formattedValue == '1') {
                            formattedValue = 'True'
                        } else if (formattedValue == '0') {
                            formattedValue = 'False'
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
