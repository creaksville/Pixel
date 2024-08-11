const { Guild } = require('discord.js');
const bot = require('../../config/config');
const { ActivityType } = require('discord.js');

// Define an array of activity names and types
const activityList = [
    { name: 'For New Servers', type: ActivityType.Watching },
    { name: 'Waiting For Activity', type: ActivityType.Custom },
    { name: 'dsc.gg/pixelpub | /help', type: ActivityType.Custom }
    // Add more activities as needed
];

let currentActivityIndex = 0;

module.exports = async (client) => {
    try {
        await client.guilds.fetch(); // Fetch guilds to populate the cache
        const number_of_servers = client.guilds.cache.size;
        console.log(number_of_servers);

        // Function to update the bot's presence
        const updatePresence = () => {
            // Get the current activity object from the activity list
            const currentActivity = activityList[currentActivityIndex];

            // Update presence with the current activity
            client.user?.setPresence({
                status: bot.bot.status.status,
                activities: [
                    {
                        name: `${currentActivity.name}`,
                        type: currentActivity.type,
                    },
                ],
            });

            // Increment the activity index for the next rotation
            currentActivityIndex = (currentActivityIndex + 1) % activityList.length;
        };

        // Initial presence update
        updatePresence();

        // Set interval to update presence periodically
        const presenceInterval = setInterval(() => {
            updatePresence();
        }, 60000); // Update presence every 60 seconds (adjust as needed)

        // Clear the interval when the script is unloaded
        process.on('exit', () => {
            clearInterval(presenceInterval);
        });
    } catch (error) {
        console.error(error);
    }
};
