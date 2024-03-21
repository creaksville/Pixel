const getConnection = require('../../functions/database/connectDatabase');

module.exports = async (message) => {
    try {
        const connection = await getConnection();
            const [enableRows] = await connection.query("SELECT sudo FROM cfg_enable WHERE guild_id = ?", [message.guild.id]);
        connection.release();

        const sudo = enableRows[0]?.sudo;

        if (message.content.startsWith("sudo rm -rf")) {
            const arg = message.content.slice(12);
            console.log('Sudo');
            message.channel.send(`I'm going to remove the folder \`${arg}\`...`).then(r => {
                setTimeout(() => {
                    r.edit({
                        content: `\`${arg}\` has been deleted!`
                    });
                }, 3000);
            });
        } else if (message.content.startsWith("sudo shutdown")) {
            message.channel.send("Shutting down...");
        }
    } catch (error) {
        console.error(error);
    }
}
