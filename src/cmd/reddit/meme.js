const fetch = require('node-fetch');
const bot = require('../../config/config');
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Fetches a random non-NSFW post from a subreddit"),
    usage: '<subreddit>',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;

        await interaction.deferReply();

        try {
            const subreddit = 'memes';
            const url = `https://reddit34.p.rapidapi.com/getPostsBySubreddit?subreddit=${subreddit}&sort=new`;
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': bot.bot.api_key,
                    'X-RapidAPI-Host': bot.bot.reddit_api_host
                }
            };

            const connection = await getConnection();
            const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
            const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
            const defaultColor = cfgMiscRows[0]?.mastercolor || "#2F3136";
            const userColor = userColorRow[0]?.usercolor;
            const embedColor = userColor || defaultColor;
            connection.release();

            const response = await fetch(url, options);
            const result = await response.json();

            if (!result?.data?.posts || !Array.isArray(result.data.posts) || result.data.posts.length === 0) {
                await interaction.editReply(`No posts found for **r/${subreddit}**.`);
                return;
            }

            // Filter out NSFW posts (over_18)
            const safePosts = result.data.posts.filter(post => !post.data.over_18);

            if (safePosts.length === 0) {
                await interaction.editReply(`No non-NSFW posts found for **r/${subreddit}**.`);
                return;
            }

            // Pick a random post from safe posts
            const randomIndex = Math.floor(Math.random() * safePosts.length);
            const post = safePosts[randomIndex].data;

            const title = post.title || "No title";
            const author = post.author || "Unknown";
            const permalink = post.permalink ? `https://reddit.com${post.permalink}` : null;
            const score = post.score ?? "N/A";
            const ups = post.ups ?? 0;
            const downs = post.downs ?? 0;
            const comments = post.num_comments ?? 0;
            const subredditName = post.subreddit || subreddit;

            // Video detection for thumbnail
            const isVideo = post.is_video === true;
            const imageUrl = post.url || "";
            const thumbnail = post.thumbnail || "";

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setURL(permalink || "https://reddit.com")
                .setColor(embedColor)
                .setAuthor({ name: `Posted by u/${author}`, url: `https://reddit.com/u/${author}` })
                .addFields(
                    { name: "Score", value: `${score}`, inline: true },
                    { name: "Subreddit", value: `r/${subredditName}`, inline: true }
                )
                .setFooter({ 
                    text: `⬆️ ${ups}  ⬇️ ${downs}  💬 ${comments}  •  Posted on Reddit` 
                });

            if (isVideo) {
                // Use thumbnail for video posts
                if (thumbnail.startsWith("http")) {
                    embed.setImage(thumbnail);
                }
            } else {
                // For images or links
                if (imageUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
                    embed.setImage(imageUrl);
                } else if (thumbnail.startsWith("http")) {
                    embed.setThumbnail(thumbnail);
                }
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while fetching Reddit posts.');
        }
    }
};