const { MessageEmbed } = require("discord.js");
const config = require("./setup/config.json");
const Database = require("../models/roles");
const moment = require("moment");
moment.locale("tr")

module.exports = async (client) => {
    client.Colors = new Array("#6959cd", "#1f0524", "#0b0067", "#4a0038", "#07052a", "#FFDF00", "#00FFFF", "#0091CC", "#0047AB", "#384B77", "#ffffff", "#000000", "#04031a", "#f9ffba", "f0f0f0");
    client.logSend = (content) => {
        const logEmbed = new MessageEmbed().setThumbnail(client.guilds.cache.get(config.Global.GuildID).iconURL({ dynamic: true })).setDescription(content).setAuthor(client.guilds.cache.get(config.Global.GuildID).name, client.guilds.cache.get(config.Global.GuildID).iconURL({ dynamic: true })).setColor(client.Colors[Math.floor(Math.random() * client.Colors.length)])
        client.channels.cache.get(config.Database.log).send("@everyone", logEmbed).catch(() => { })
    }

}