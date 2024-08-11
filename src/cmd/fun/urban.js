const fetch = require('node-fetch')
const bot = require('../../config/config')
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("urban")
        .setDescription("Searches for a Word From the Urban Dictionary")
        .addStringOption(option =>
            option
                .setName('term')
                .setDescription('The Dictionary Term You Want to Look Up')
                .setRequired(true)
        ),
    usage: '<dictionary term>',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;

        await interaction.deferReply(); // Defer the reply before making the API request

        try {
            const term = interaction.options.getString('term'); // Use getString to get the term
            const url = `https://mashape-community-urban-dictionary.p.rapidapi.com/define?term=${term}`;
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': bot.bot.api_key,
                    'X-RapidAPI-Host': bot.bot.urban_api_host
                }
            };

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

            const response = await fetch(url, options);
            const result = await response.json();

            // Check if result.list is defined and has at least one item
            if (result.list) {
                // Get the definition
                let definition = result.list[0].definition;
            
                // Truncate the definition if it's longer than 1000 characters
                if (definition.length > 1000) {
                    definition = definition.slice(0, 1000) + '...';
                }


                // Create an embed with the Urban Dictionary definition
                const embed = new EmbedBuilder()
                    .setTitle(`Urban Dictionary: ${term}`)
                    .setColor(embedColor)
                    .addFields({ name: 'Definition', value: definition || 'No definition available' })
                    .addFields({ name: 'Example', value: result.list[0].example || 'No example available' });

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Handle the case where no definition was found
                await interaction.editReply('No definition found for the specified term.');
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while fetching the definition.');
        }
    }
}
