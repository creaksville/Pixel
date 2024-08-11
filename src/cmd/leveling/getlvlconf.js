const { SlashCommandBuilder, Client, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase"); // Import your MySQL connection pool

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getlvlconf')
        .setDescription('Retrieves The Configuration for the Guild (DEPRECATED SOON)')
        .addStringOption(option =>
            option
                .setName('table')
                .setDescription('Table to Look At')
                .setRequired(true)),
    usage: '<table>',
    async execute(interaction, client) {
        try {
            const database = 'cfg_lvl';

            console.log('Database:', database);
            console.log('Guild ID:', interaction.guild?.id);

            if (!database) {
                return interaction.reply(
                    `THE DATABASE **DOES NOT EXIST** - ***ERR 404***`
                );
            }

            const guildId = interaction.guild?.id;
            const userId = interaction.member.user.id;
            const connection = await getConnection();

            let guildSettings;
            switch (database) {
                case 'cfg_lvl':
                    const [levelRows] = await connection.query("SELECT * FROM cfg_lvl WHERE guild_id = ?", [guildId]);
                    guildSettings = levelRows[0];
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
                cfg_lvl: {
                    title: 'LEVELING CONFIGURATION Settings',
                    description: 'Here are the current LEVELING CONFIGURATION Settings for This Guild:',
                }
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
