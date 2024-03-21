const { SlashCommandBuilder, Client, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase"); // Import your MySQL connection pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getconf')
        .setDescription('Retrieves The Configuration for the Guild (DEPRECATED SOON)')
        .addStringOption(option =>
            option
                .setName('table')
                .setDescription('Table to Look At')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable/Disable', value: 'cfg_enable' },
                    { name: 'Channel IDs', value: 'cfg_channels' },
                    { name: 'Intervals', value: 'cfg_interval' },
                    { name: 'Miscellaneous', value: 'cfg_misc' }
                )),
    usage: '<table>',
    async execute(interaction, client) {
        try {
            const database = interaction.options.getString('table');

            console.log('Database:', database);
            console.log('Guild ID:', interaction.guild?.id);

            if (!database) {
                const tableNames = ['cfg_enable', 'cfg_channels', 'cfg_misc']; // Update with your table names
                return interaction.reply(
                    `Please specify the database!! You can choose from the following tables:\n**${tableNames.join('\n')}**`
                );
            }

            const guildId = interaction.guild?.id;
            const userId = interaction.member.user.id;
            const connection = await getConnection();

            let guildSettings;
            switch (database) {
                case 'cfg_enable':
                    const [enableRows] = await connection.query("SELECT * FROM cfg_enable WHERE guild_id = ?", [guildId]);
                    guildSettings = enableRows[0];
                    break;
                case 'cfg_channels':
                    const [chidRows] = await connection.query("SELECT * FROM cfg_channels WHERE guild_id = ?", [guildId]);
                    guildSettings = chidRows[0];
                    break;
                case 'cfg_misc':
                    const [miscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
                    guildSettings = miscRows[0];
                    break;
                default:
                    connection.release();
                    return interaction.reply('Invalid table name.');
            }

            connection.release();

            if (!guildSettings) return;

            // Inside the execute function

            const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
            const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
            const userColor = userColorRow[0]?.usercolor;
            const defaultColor = cfgMiscRows[0]?.mastercolor;
            const embedColor = userColor || defaultColor;

            // Ensure autorole is stored as an array of role IDs in the database
            let autorole = guildSettings['autorole'];
            if (autorole && typeof autorole === 'string') {
                // If autorole is stored as a comma-separated string, convert it to an array
                autorole = autorole.split(',').map(id => id.trim());
            }

            const databaseEmbedMap = {
                cfg_enable: {
                    title: 'CFG_Enable Settings',
                    description: 'Here are the current CFG_Enable Settings for This Guild:',
                },
                cfg_channels: {
                    title: 'CFG_CHID Settings',
                    description: 'Here are the current CFG_CHID Settings for This Guild:',
                },
                cfg_misc: {
                    title: 'CFG_Misc Settings',
                    description: 'Here are the current CFG_Misc Settings for This Guild:',
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

                    // Convert autorole array to mentionable roles
                    if (key === 'autorole' && Array.isArray(autorole)) {
                        formattedValue = autorole.map(roleId => {
                            const role = interaction.guild?.roles.cache.get(roleId);
                            return role ? `<@&${roleId}>` : `Invalid Role ID: ${roleId}`;
                        }).join('\n');
                    } else {
                        // Convert channel IDs to mentionable channels
                        if (database === 'cfg_channels' && /^\d+$/.test(formattedValue)) {
                            const channel = interaction.guild?.channels.cache.get(formattedValue);
                            formattedValue = channel ? `<#${formattedValue}>` : formattedValue;
                        }

                        // Convert role ID to mentionable role
                        if (database === 'cfg_misc' && /^\d+$/.test(formattedValue)) {
                            const role = interaction.guild?.roles.cache.get(formattedValue);
                            formattedValue = role ? `<@&${formattedValue}>` : formattedValue;
                        }

                        // Format true/false values
                        if (database === 'cfg_enable') {
                            formattedValue = formattedValue == '1' ? 'True' : formattedValue == '0' ? 'False' : formattedValue;
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
