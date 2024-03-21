const eventName = 'guildDelete';
console.log(`Guild Delete Event Started at ${new Date().toLocaleString()}`);

module.exports = async (client, guild) => {
    try {
        const guildId = guild.id;
        console.log(`Left guild "${guild.name}" with ID "${guildId}"`);
    } catch(error) {
        console.error(error);
    }
}