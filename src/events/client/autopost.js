const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

const CACHE_FILE_PATH = path.join(__dirname, '../../custom/reddit-cache.json');

// Store interval IDs per webhook name
const intervalIds = {};

// Function to fetch autopost configuration from the database
async function fetchAutopostConfig(guildId) {
    const connection = await getConnection();
    const [configRows] = await connection.query("SELECT * FROM cfg_autopost WHERE guild_id = ?", [guildId]);
    connection.release();
    return configRows;
}

module.exports = async (client) => {
    try {
        const guilds = client.guilds.cache;

        // Main loop to process each guild
        for (const guild of guilds.values()) {
            const guildId = guild.id;

            const connection = await getConnection();
                const [enableRows] = await connection.query("SELECT autopost FROM cfg_enable WHERE guild_id = ?", [guildId])
                const [embed_color] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildId])
            connection.release();

            const cacheData = fs.existsSync(CACHE_FILE_PATH) ? JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8')) : {};

            const [configRows] = await Promise.all([
                fetchAutopostConfig(guildId)
            ]);
            
            const enableFeature = enableRows[0].autopost;
            console.log(enableFeature)
            const color = embed_color[0]?.mastercolor;

            if (!enableFeature || enableFeature == 0) continue;

            // Process autopost configuration for the current guild
            for (const config of configRows) {
                let autopostIndex = 1;
                let autopostConfig = {};

                // Iterate through columns and gather autopost configuration
                while (config[`autopost${autopostIndex}name`] !== undefined) {
                    autopostConfig = {
                        name: config[`autopost${autopostIndex}name`] || `AutoPost${autopostIndex}`, // Provide a default name if config name is undefined
                        channelId: config[`autopost${autopostIndex}channel`],
                        subreddits: (config[`autopost${autopostIndex}subreddits`]).replace(/[\[\]]/g, '').split(',').map(subreddit => subreddit.trim()),
                        interval: config[`autopost${autopostIndex}interval`]
                    };

                    // Process the current autopost configuration
                    const { name, channelId, subreddits, interval } = autopostConfig;
                    if (!name || !channelId || !subreddits) {
                        console.log('No Entry Found, Skipping');
                        continue;
                    }

                    const channel = guild.channels.cache.get(channelId);
                    if (!channel) {
                        console.error(`Text channel with ID ${channelId} not found in guild ${guildId}.`);
                        continue;
                    }

                    let webhook = await channel.fetchWebhooks();
                    webhook = webhook.find(wh => wh.name === name);

                    if (!webhook) {
                        console.log("Creating webhook with name:", name); // Log the name value
                        webhook = await channel.createWebhook({
                            name: name,
                            avatar: client.user?.displayAvatarURL(),
                            reason: 'none'
                        });
                    }

                    // Clear previous interval if exists
                    if (intervalIds[name]) {
                        clearInterval(intervalIds[name]);
                    }

                    // Set new interval
                    intervalIds[name] = setInterval(async () => {
                        const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
                        const url = `https://www.reddit.com/r/${randomSubreddit}/random.json`;
                        const header_options = {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
                            }
                        };

                        try {
                            const response = await fetch(url, header_options);
                            const responseBody = await response.text();
                            const data = JSON.parse(responseBody);

                            if (!data || !data[0] || !data[0].data || !data[0].data.children[0]) {
                                console.log(`Could not find subreddit '${randomSubreddit}'.`);
                                return;
                            }

                            const post = data[0].data.children[0].data;

                            // Check if post is NSFW
                            if (post.over_18 && !channel.nsfw) {
                                console.log(`Post from subreddit '${randomSubreddit}' is NSFW, but channel is not marked as NSFW.`);
                                return;
                            }

                            // Check if post is already seen
                            if (cacheData[randomSubreddit] === post.id) {
                                console.log(`Post from subreddit '${randomSubreddit}' is already seen.`);
                                return;
                            }

                            // Store post ID in cache
                            cacheData[randomSubreddit] = post.id;
                            fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));

                            // Create and send embed
                            const embed = new EmbedBuilder()
                                .setTitle(post.title)
                                .setURL(`https://www.reddit.com${post.permalink}`)
                                .setColor(color)
                                .setDescription(post.selftext || ' ')
                                .setFooter({
                                    text: `r/${randomSubreddit} - 👍 ${post.ups} | 💬 ${post.num_comments}`
                                });

                            if (post.post_hint === 'image' || post.url.includes('.jpg') || post.url.includes('.png')) {
                                embed.setImage(post.url);
                            } else if (post.is_video) {
                                const thumbnailUrl = post.media.reddit_video.preview.images[0].source.url;
                                embed.setThumbnail(thumbnailUrl); // Set thumbnail for video post
                                embed.addFields({ name: 'Video', value: `[Watch Here](${post.url})` });
                            }

                            webhook.send({ embeds: [embed] });

                        } catch (error) {
                            console.error(`Error fetching data for ${randomSubreddit}`, error);
                        }
                    }, interval); // Use configured interval
                    autopostIndex++;
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
};
