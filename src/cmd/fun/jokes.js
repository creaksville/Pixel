const fs = require('fs');
const config = require('../../config/config');
const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jokes')
        .setDescription('Get The Bot to Tell a Joke'),
    usage: '',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;
        
        const responses = JSON.parse(fs.readFileSync(config.plugins.jokes.source, 'utf8'));
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

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
        // Create an embed with the 8 ball response
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .addFields({ name: 'Your Joke:', value: `${randomResponse}`});

        // Send the embed as a message
        await interaction.reply({ embeds: [embed] });
    },
};
