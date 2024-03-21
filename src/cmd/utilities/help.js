const fs = require('fs');
const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
let connection;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Help Menu')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Specific Command')),
    usage: '<Command Name> (Optional)',
    async execute(interaction, client) {
        try {
            const guildId = interaction.guild?.id;
            const userId = interaction.member.user.id;

            const specificCommandName = interaction.options.getString('command');
            const commandDirs = fs.readdirSync('./src/cmd');
            const { commands, commandArray } = client;

            connection = await getConnection();
                const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildId]);
                const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
            connection.release();

            const defaultColor = miscRows[0].mastercolor;
            const userColor = userColorRow[0].usercolor;
            let embedColor;
                    
            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            if (specificCommandName) {
                // User specified a specific command
                const specificCommand = commands.get(specificCommandName.toLowerCase());
                const commandUsage = `/${specificCommand.data.name} ${specificCommand.usage}`

                if (specificCommand) {
                    // Display details about the specific command
                    const embed = new EmbedBuilder()
                        .setTitle(`Command: ${specificCommand.data.name}`)
                        .setColor(embedColor)
                        .addFields({ name: 'Description', value: specificCommand.data.description })
                        .addFields({ name: 'Usage', value: commandUsage || 'No usage provided' });

                    interaction.reply({ embeds: [embed] });
                } else {
                    // Specified command not found
                    interaction.reply('Specified command not found.');
                }
            } else {
                // User requested general help menu
                // Create a map to store command categories
                const categories = new Map();

                // Loop through subdirectories to extract categories
                for (const folder of commandDirs) {
                    const commandFiles = fs
                        .readdirSync(`./src/cmd/${folder}`)
                        .filter((file) => file.endsWith('.js'));

                    for (const file of commandFiles) {
                        const command = require(`../../cmd/${folder}/${file}`);
                        commands.set(command.data.name, { ...command, category: folder });
                        commandArray.push(command.data);

                        const categoryName = folder.toLowerCase(); // Use the subdirectory name as the category
                        if (!categories.has(categoryName)) {
                            categories.set(categoryName, []);
                        }
                        categories.get(categoryName).push(`\`${command.data.name}\``);
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('Help Menu')
                    .setThumbnail(client.user.displayAvatarURL())
                    .setColor(embedColor)
                    .setTimestamp();

                categories.forEach((commands, category) => {
                    embed.addFields({ name: `★ ${category.toUpperCase()}`, value: commands.join(', ') });
                });

                interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
        }
    }
};
