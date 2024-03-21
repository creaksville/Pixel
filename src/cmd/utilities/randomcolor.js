const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcolor')
        .setDescription('Generates a Random Color')
        .addStringOption(option =>
            option
                .setName('color_type')
                .setDescription('The Color Group You Want')
                .addChoices(
                    { name: 'Red', value: 'red' },
                    { name: 'Orange', value: 'orange' },
                    { name: 'Yellow', value: 'yellow' },
                    { name: 'Green', value: 'green' },
                    { name: 'Blue', value: 'blue' },
                    { name: 'Purple', value: 'purple' },
                )
                .setRequired(true)),
    usage: '<Color>',
    async execute(interaction, client) {
        const colorType = interaction.options.getString('color_type');
        const colorRanges = {
            red: {},
            orange: {},
            yellow: {},
            green: {},
            blue: {},
            purple: {},
        };

        // Set the properties for each color group
        colorRanges.red.minRed = 150;
        colorRanges.red.maxRed = 255;
        colorRanges.red.minGreen = 0;
        colorRanges.red.maxGreen = 100;
        colorRanges.red.minBlue = 0;
        colorRanges.red.maxBlue = 100;

        colorRanges.orange.minRed = 200;
        colorRanges.orange.maxRed = 255;
        colorRanges.orange.minGreen = 100;
        colorRanges.orange.maxGreen = 150;
        colorRanges.orange.minBlue = 0;
        colorRanges.orange.maxBlue = 50;

        colorRanges.yellow.minRed = 200;
        colorRanges.yellow.maxRed = 255;
        colorRanges.yellow.minGreen = 200;
        colorRanges.yellow.maxGreen = 255;
        colorRanges.yellow.minBlue = 0;
        colorRanges.yellow.maxBlue = 50;

        colorRanges.green.minRed = 0;
        colorRanges.green.maxRed = 50;
        colorRanges.green.minGreen = 150;
        colorRanges.green.maxGreen = 255;
        colorRanges.green.minBlue = 0;
        colorRanges.green.maxBlue = 50;

        colorRanges.blue.minRed = 0;
        colorRanges.blue.maxRed = 50;
        colorRanges.blue.minGreen = 0;
        colorRanges.blue.maxGreen = 100;
        colorRanges.blue.minBlue = 150;
        colorRanges.blue.maxBlue = 255;

        colorRanges.purple.minRed = 100;
        colorRanges.purple.maxRed = 150;
        colorRanges.purple.minGreen = 0;
        colorRanges.purple.maxGreen = 50;
        colorRanges.purple.minBlue = 100;
        colorRanges.purple.maxBlue = 150;

        if (!colorRanges[colorType]) {
            return interaction.reply('Invalid color type. Please specify a valid color type.');
        }

        const { minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue } = colorRanges[colorType];

        const red = Math.floor(Math.random() * (maxRed - minRed + 1)) + minRed;
        const green = Math.floor(Math.random() * (maxGreen - minGreen + 1)) + minGreen;
        const blue = Math.floor(Math.random() * (maxBlue - minBlue + 1)) + minBlue;

        const hex = rgbToHex(red, green, blue);

        // Create a MessageEmbed to display the color information
        const embed = new EmbedBuilder()
            .setTitle('Random Color')
            .setColor(hex)
            .addFields({ name: 'Hex Code', value: hex.toUpperCase() })
            .addFields({ name: 'Name', value: getColorName(hex) })
            .addFields({ name: 'RGB Values', value: `${red}, ${green}, ${blue}` })
            .setImage(getColorPreview(hex))
            .setFooter({ text: 'Enjoy your random color!' });

        // Send the embed as a message
        await interaction.reply({ embeds: [embed] });
    },
};

// Helper function to convert RGB values to hexadecimal
function rgbToHex(red, green, blue) {
    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${componentToHex(red)}${componentToHex(green)}${componentToHex(blue)}`;
}

// Helper function to get the color name based on the hexadecimal code
function getColorName(hex) {
    // You can customize this function to map color names to specific hex codes
    // For simplicity, this example returns the hex code as the color name
    return hex.toUpperCase();
}

// Helper function to generate a color preview image URL
function getColorPreview(hex) {
    // You can customize this function to generate a color preview image URL based on the hex code
    // For simplicity, this example returns a placeholder URL
    return `https://via.placeholder.com/200/${hex.substring(1)}/?text=Color+Preview`;
}
