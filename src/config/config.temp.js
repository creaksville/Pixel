//THIS FILE HAS BEEN SHORTENED!! MOST OF THE CONFIG HAS BEEN MOVED TO A DATABASE, NOW YOU CAN EASILY CHANGE THE CONFIGURATION OF PLUGINS WITH THE COMMANDS

module.exports = {
    bot: {
        token: "BOT TOKEN HERE",
        clientId: "BOT ID HERE",
        status: {
            status: "online",
            type: "WATCHING"
        },
        api_key: 'APIHUB KEY HERE',
        urban_api_host: 'URBAN DICTIONARY API URL FROM APIHUB HERE'
    },
    plugins: {
        funfact: {
            source: 'FUN FACT JSON LOCATION (filename must be funfact.json)'
        },
        rss: {
            source: 'RSS FEEDS JSON LOCATION (filename must be rss-feeds.json)'
        },
        roasts: {
            source: 'ROASTS JSON LOCATION (filename must be roasts.json)'
        },
        subreddits: {
            source: 'SUBREDDIT JSON LOCATION (filename must be subreddit.json)'
        },
        eightball: {
            source: '8BALL RESPONSE JSON LOCATION (filename must be 8ballresponses.json)'
        },
        jokes: {
            source: 'JOKES JSON LOCATION (filename must be jokes.json)'
        }
    },
    version: {
        version: "19.88.5"
    }
};