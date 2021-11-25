const { MessageEmbed } = require("discord.js");
const config = require("./setup/config.json");
const moment = require("moment");
moment.locale("tr")

module.exports = async (client) => {
    client.Colors = new Array("#6959cd", "#1f0524", "#0b0067", "#4a0038", "#07052a", "#FFDF00", "#00FFFF", "#0091CC", "#0047AB", "#384B77", "#ffffff", "#000000", "#04031a", "#f9ffba", "f0f0f0");
    client.logSend = (content) => {
        const logEmbed = new MessageEmbed().setThumbnail(client.guilds.cache.get(config.Global.GuildID).iconURL({ dynamic: true })).setDescription(content).setAuthor(client.guilds.cache.get(config.Global.GuildID).name, client.guilds.cache.get(config.Global.GuildID).iconURL({ dynamic: true })).setColor(client.Colors[Math.floor(Math.random() * client.Colors.length)])
        client.channels.cache.get(config.Database.log).send("@everyone", logEmbed).catch(() => { })
    }

    client.backup = () => {
        const Database = require("../models/roles");
        Database.deleteMany({});
        client.guilds.cache.get(config.Global.GuildID).roles.cache.filter(e => !e.managed).forEach(async role => {
            new Database({
                guildID: client.guilds.cache.get(config.Global.GuildID).id,
                role: role.id,
                name: role.name,
                color: role.hexColor,
                hoist: role.hoist,
                position: role.rawPosition,
                permler: role.permissions,
                mentionable: role.mentionable,
                members: role.members.map(e => e.id)
            }).save()
        })
        console.log(`${moment(Date.now()).format("LLL")} Tarihinde başarıyla rollerin backup alma işlemi gerçekleştirildi!`)
    }
}
