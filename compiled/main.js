var _a = require('discord.js'), Client = _a.Client, Intents = _a.Intents;
var token = require('./config.json').token;
var client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.once('ready', function () {
    console.log('Ready!');
});
client.login(token);
