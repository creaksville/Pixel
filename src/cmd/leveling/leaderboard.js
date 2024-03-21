const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");
const canvacord = require('canvacord');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Retrieve Leaderboard'),

    async execute(interaction, client) {
        const guildId = interaction.guild?.id;

        try {
            const connection = await getConnection();

            // Fetch user data from the database
            const [rows] = await connection.query('SELECT * FROM level WHERE guildId = ?', [guildId]);
            const [customization] = await connection.query('SELECT leaderboard_style, leaderboard_background FROM cfg_lvl WHERE guild_id = ?', [guildId]);
            connection.release();

            // Check if user data exists
            if (!rows || rows.length === 0) {
                return interaction.reply('No data found for this server.');
            }

            // Sort users by level in descending order
            rows.sort((a, b) => b.level - a.level);

            // Fetch additional data from the database
            const [cfgMiscRows] = await connection.query('SELECT mastercolor FROM cfg_misc WHERE guild_id = ?', [guildId]);
            const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ${interaction.member?.user.id} AND guild_id = ?`, [guildId]);

            let embedColor;
            const defaultColor = cfgMiscRows[0].mastercolor;
            const userColor = userColorRow[0].usercolor;

            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            canvacord.Font.loadDefault();
            const members = interaction.guild?.memberCount;
            const _custom_style = customization[0].leaderboard_style;
            const _custom_background = customization[0].leaderboard_background;

            // Create a new LeaderboardBuilder instance
            const lb = new canvacord.LeaderboardBuilder()
                .setHeader({
                    title: `${interaction.guild?.name}`,
                    image: `${interaction.guild?.iconURL()}`,
                    subtitle: `${rows.length} Members on Leaderboard/${members} Total Members`,
                })
                .adjustCanvas(5000, 5000);

            lb.setBackgroundColor(embedColor);

            let style;
                
            if (!_custom_style || _custom_style == 'default' || _custom_style == 'Default') {
                style = 'default';
            } else if (_custom_style == 'horizontal' || _custom_style == 'Horizontal') {
                style = 'horizontal';
            }

            console.log(style)
            console.log(_custom_style);

            // Array to hold player objects
            const players = [];

            // Add player data to the leaderboard
            rows.forEach((userData, index) => {
                const rank = index + 1;
                const userPlace = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}`;
                const user = client.users.cache.get(userData.userId);
                if (user) {
                    players.push({
                        avatar: user.displayAvatarURL({ format: 'png' }),
                        username: user.username,
                        level: userData.level,
                        xp: userData.xp,
                        rank: userPlace,
                    });
                }
            });

            // Set the players
            lb.setPlayers(players);
            lb.adjustCanvas();
            lb.setVariant(style)

            // Build the leaderboard
            const image = await lb.build({ format: 'jpeg' });
            const attachment = new AttachmentBuilder(image);

            // Reply with the leaderboard image
            await interaction.reply({ files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the leaderboard.');
        }
    },
};
