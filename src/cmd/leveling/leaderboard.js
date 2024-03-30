const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Retrieve Leaderboard'),
    usage: '',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;
        await interaction.deferReply();
        try {
            const connection = await getConnection();
            const [topUsers] = await connection.query(
                "SELECT userId, level, xp, totalxp FROM level WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT 10",
                [guildId]
            );
            const [userRow] = await connection.query(
                "SELECT userId, level FROM level WHERE userId = ? AND guildId = ?",
                [interaction.member?.user.id, guildId]
            );
            const [cfgMiscRows] = await connection.query('SELECT mastercolor FROM cfg_misc WHERE guild_id = ?', [interaction.guild?.id]);
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

            if (!topUsers || topUsers.length === 0) {
                return interaction.editReply('There is currently no data in the leaderboard.');
            }

            const rank = topUsers.findIndex((row) => row.userId === interaction.member?.user.id) + 1;

            const leaderboardEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Leaderboard')
                .setDescription('Top 10 Users by XP')
                .setThumbnail(client.user?.displayAvatarURL())
                .setTimestamp();

            let leaderboard = '';

            for (const [index, row] of topUsers.entries()) {
                const user = await client.users.fetch(row.userId);
                const place = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                leaderboard += `${place} <@${user.id}>\nLevel ${row.level} | XP ${row.xp} | Total XP ${row.totalxp}\n`;
            }

            leaderboardEmbed.addFields({ name: 'Rankings', value: `${leaderboard}` });

            if (userRow && userRow.length > 0) {
                const userPlace = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
                leaderboardEmbed.addFields({ name: 'Your Rank', value: `Rank: ${userPlace} | **Level** ${userRow[0].level}`, inline: true });
            }

            interaction.editReply({ embeds: [leaderboardEmbed] });
        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while fetching the leaderboard.');
        }
    },
};
