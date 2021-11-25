const Database = require("../models/roles");
const config = require("./setup/config.json");
const { Client, MessageEmbed } = require("discord.js");
const client = (global.client = new Client({ fetchAllMembers: true }));
const moment = require("moment");
const mongoose = require("mongoose");
const fs = require("fs");
const guild = client.guilds.cache.get(config.Global.GuildID);

class main {

    static async connect() {
        client.login(config.Database.token).then(x => console.log(`[JAHKY PROF DATABASE] ${client.user.username} olarak giriş yaptı!`)).catch(err => console.log(`[JAHKY PROF DATABASE] Bota giriş yapılırken ${err} sebebiyle işlem duraklatıldı!`))
        client.on("ready", () => {
            client.user.setPresence({ activity: { name: "Jahky Prof Database", type: "LISTENING" }, status: "dnd" })
            client.backup()
        })
        
        setInterval(() => {
  client.backup()
}, 1000 * 60 * 60 * 15);

        require("./database-functions")(client)

        mongoose.connect(config.Database.mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(x => console.log("[MONGO] Mongoose veri tabanına bağlanıldı!"))
            .catch(err => console.log(`[MONGO] Mongoose veri tabanına bağlanırken bir hata ile karşılaşıldı! Hata: ${err}`));
    }

    static async RoleDefender() {
        let Tarih = `${moment(Date.now()).format("DD")} ${moment(Date.now()).format("MM").replace(/01/, 'Ocak').replace(/02/, 'Şubat').replace(/03/, 'Mart').replace(/04/, 'Nisan').replace(/05/, 'Mayıs').replace(/06/, 'Haziran').replace(/07/, 'Temmuz').replace(/08/, 'Ağustos').replace(/09/, 'Eylül').replace(/10/, 'Ekim').replace(/11/, 'Kasım').replace(/12/, 'Aralık')} ${moment(Date.now()).format("YYYY")} ${moment(Date.now()).format("HH:mm")}`
        client.on("roleDelete", async role => {
            const entry = role.guild.fetchAuditLogs({ limit: 5, type: "ROLE_DELETE" }).then(x => x.entries.first());
            if (!entry || !(await entry).executor || Safe((await entry).executor.id)) return;
            Punish("Forbidden", (await entry).executor.id);
            client.logSend(`${(await entry).executor} üyesi **rol sildi** ve rolü tekrar açıp, kanal izinlerini tekrar ayarlayıp, rolü üyelerine geri dağıttım ve  rolü silen kişiyi banladım.\n\n\`⦁\` Rol: \`${role.name}\` (\`${role.id}\`)\n\`⦁\` Yetkili: ${(await entry).executor} (\`${(await entry).executor.tag.replace("`", "")}\` - \`${(await entry).executor.id}\`)\n\n\`-\` Tarih: \`${Tarih}\``)
            // closeAllPermsRoles();
            const data = await Database.findOne({ guildID: role.guild.id, role: role.id });
            const newRole = await role.guild.roles.create({ data: { color: role.color, name: role.name, hoist: role.hoist, mentionable: role.mentionable, permissions: role.permissions, position: role.rawPosition } }).catch(err => { });
            let rolemembersdata = await Database.findOne({ Id: role.id })
            if (!rolemembersdata) return console.log(`Veritabanında ${role.name} (${role.id}) rolüne ait veri bulunmadığı için rol dağıtma işlemi iptal edildi.`);
            if (rolemembersdata.members.length <= 0) return console.log(`${role.name} (${role.id}) Olayında kayıtlı üye olmadığından dolayı rol dağıtımı gerçekleştirmedim.`);
            rolemembersdata.members.forEach(id => {
                if (!id) {
                    console.log(`${role.name} (${role.id}) Olayından sonra ${id} adlı üyeyi sunucuda bulamadım.`);
                    return true;
                }
                let member = role.guild.member(id);
                member.roles.add(newRole).then(e => { console.log(`${role.name} (${role.id}) Olayından sonra ${member.user.username} adlı üye ${newRole.name} rolünü aldı.`); }).catch(e => { console.log(`${role.name} (${role.id}) Olayından sonra ${member.user.username} adlı üyeye rol veremedim. ${e}`); });
            })
        })

        client.on("roleCreate", async role => {
            const entry = role.guild.fetchAuditLogs({ type: "ROLE_CREATE" }).then(x => x.entries.first());
            if (!entry | !(await entry).executor | Safe((await entry).executor.id)) return
            Punish("Forbidden", (await entry).executor.id);
            role.delete({ reason: "Jahky Role Guard" }).catch(err => { })
            closeAllPermsRoles()
            client.logSend(`${(await entry).executor} üyesi **rol açtı** ve rolü silip, rolü açan kişiyi banladım.\n\n\`⦁\` Rol: \`${role.name}\` (\`${role.id}\`)\n\`⦁\` Yetkili: ${(await entry).executor} (\`${(await entry).executor.tag.replace("`", "")}\` - \`${(await entry).executor.id}\`)\n\n\`-\` Tarih: \`${Tarih}\``)
        })

        client.on("roleUpdate", async (oldRole, newRole) => {
            const entry = newRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(x => x.entries.first())
            if (!entry | !(await entry).executor | Safe((await entry).executor.id)) return
            Punish("Forbidden", (await entry).executor.id);
            closeAllPermsRoles()
            newRole.edit({ ...oldRole })
            client.logSend(`${(await entry).executor} üyesi **rol güncelledi** ve rolü eski haline getirip, rolü güncelleyen kişiyi banladım.\n\n\`⦁\` Rol: <@&${oldRole.id}> (\`${oldRole.name}\` - \`${oldRole.id}\`)\n\`⦁\` Yetkili: ${(await entry).executor} (\`${(await entry).executor.tag.replace("`", "")}\` - \`${(await entry).executor.id}\`)\n\n\`-\` Tarih: \`${Tarih}\``)
        })

        client.on("guildMemberUpdate", async (oldMember, newMember) => {
            if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                client.backup()
            }
        })

        function Punish(type, user) {
            let member = client.guilds.cache.get(config.Global.GuildID).members.cache.get(user);
            if (!member) return;
            if (type == "Suspended") return member.roles.cache.has(config.Global.Boosters) ? member.roles.set([config.Global.Boosters, config.Global.Jails]) : member.roles.set([config.Global.Jails]);
            if (type == "Forbidden") return member.ban({ reason: "JAHKY Rol Koruma" }).catch(err => { });
        }

        function closeAllPermsRoles() {
            let role = guild.roles.cache.filter(role => role.managed && role.position < guild.me.roles.highest.position && role.permissions.has("MANAGE_GUILD") || role.permissions.has("BAN_MEMBERS") || role.permissions.has("MANAGE_ROLES") || role.permissions.has("MANAGE_WEBHOOKS") || role.permissions.has("MANAGE_NICKNAMES") || role.permissions.has("MANAGE_CHANNELS") || role.permissions.has("KICK_MEMBERS") || role.permissions.has("ADMINISTRATOR"))
            let roles = guild.roles.cache.filter(role => role.managed && role.position < guild.me.roles.highest.position && role.permissions.has("MANAGE_GUILD") || role.permissions.has("BAN_MEMBERS") || role.permissions.has("MANAGE_ROLES") || role.permissions.has("MANAGE_WEBHOOKS") || role.permissions.has("MANAGE_NICKNAMES") || role.permissions.has("MANAGE_CHANNELS") || role.permissions.has("KICK_MEMBERS") || role.permissions.has("ADMINISTRATOR")).forEach(async r => {
                if (config.Global.CloseAllPerms.some(x => r.id === x)) return
                await r.setPermissions(0).catch(() => { })
            })

            role.forEach(role => {
                if (role.permissions.has("ADMINISTRATOR")) {
                    if (config.Global.CloseAllPerms.some(x => role.id === x)) return
                    role.members.filter(e => e.manageable).forEach(member => {
                        if (safe(member.id)) return;
                        if (member.roles.highest.position < guild.me.roles.highest.position) member.roles.remove(role).catch(() => { })
                    })
                }
            })
        }

        function Safe(kisiID) {
            let uye = client.guilds.cache.get(config.Global.GuildID).members.cache.get(kisiID);
            let guvenliler = config.Global.Whitelist || [];
            if (!uye || uye.id === client.user.id || guvenliler.some(x => uye.id === x || uye.roles.cache.has(x))) return true

        }
    }

    static async Events() {
        client.on("message", async message => {
            if (message.author.bot || !message.guild || !message.content.startsWith(config.Database.prefix)) return;
            if (!config.Global.owners.includes(message.author.id)) return;
            let args = message.content.split(/ +/g).slice(1);
            let command = message.content.split(' ')[0].slice(config.Database.prefix.length);
            let embed = new MessageEmbed().setColor("#00ffdd").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(`Jahky was here`).setTimestamp();

            if (command === "eval") {
                if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
                let code = args.join(' ');
                function clean(text) {
                    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
                    text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
                    return text;
                };
                try {
                    var evaled = clean(await eval(code));
                    if (evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
                    message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, { code: "js", split: true });
                } catch (err) { message.channel.send(err, { code: "js", split: true }) };
            };

            if (command === "safe") {
                let hedef;
                let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
                let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
                if (rol) hedef = rol;
                if (uye) hedef = uye;
                let guvenliler = config.Global.Whitelist || [];
                if (!hedef) return message.channel.send(embed.setDescription(`Güvenli listeye eklemek/kaldırmak için bir hedef (üye/rol) belirtmelisin!`).addField("Güvenli Liste", guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g) || message.guild.members.cache.has(g)) ? (message.guild.roles.cache.get(g) || message.guild.members.cache.get(g)) : g).join('\n') + "." : "Bulunamadı!"));
                if (guvenliler.some(g => g.includes(hedef.id))) {
                    guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
                    config.Global.Whitelist = guvenliler;
                    fs.writeFile("./main/setup/config.json", JSON.stringify(config), (err) => {
                        if (err) console.log(err);
                    });
                    message.channel.send(embed.setDescription(`${hedef}, ${message.author} tarafından güvenli listeden kaldırıldı!`));
                } else {
                    config.Global.Whitelist.push(`${hedef.id}`);
                    fs.writeFile("./main/setup/config.json", JSON.stringify(config), (err) => {
                        if (err) console.log(err);
                    });
                    message.channel.send(embed.setDescription(`${hedef}, ${message.author} tarafından güvenli listeye eklendi!`));
                };
            };

            if (["backup-kur", "rol-kur", "setup"].some(x => command === x)) {
                if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));
                const data = await Database.findOne({ guildID: message.guild.id, role: args[0] });
                if (!data) return message.channel.send(embed.setDescription("Belirtilen rol ID'sine ait bir veri bulunamadı!"))
                message.guild.roles.create({
                    data: {
                        name: data.name,
                        color: data.color,
                        hoist: data.hoist,
                        permissions: data.permissions,
                        position: data.position,
                        mentionable: data.mentionable
                    },
                    reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
                }).then(newRole => {
                    let rolemembersdata = Database.findOne({ Id: role.id })
                    if (!rolemembersdata) return console.log(`Veritabanında ${role.name} (${role.id}) rolüne ait veri bulunmadığı için rol dağıtma işlemi iptal edildi.`);
                    let length = rolemembersdata.members.length;
                    if (length <= 0) return console.log(`${role.name} (${role.id}) Olayında kayıtlı üye olmadığından dolayı rol dağıtımı gerçekleştirmedim.`);
                    rolemembersdata.members.forEach(id => {
                        if (!member) {
                            console.log(`${role.name} (${role.id}) Olayından sonra ${id} adlı üyeyi sunucuda bulamadım.`);
                            return true;
                        }
                        let member = role.guild.member(id);
                        member.roles.add(newRole).then(e => { console.log(`${role.name} (${role.id}) Olayından sonra ${member.user.username} adlı üye ${newRole.name} rolünü aldı.`); }).catch(e => { console.log(`${role.name} (${role.id}) Olayından sonra ${member.user.username} adlı üyeye rol veremedim. ${e}`); });
                    })
                })
            }

            if (["backup-al", "database-al", "yedekle"].some(x => command === x)) {
                client.backup()
                message.channel.send(embed.setDescription("Sunucu rol verisi veri tabanına kaydedildi"))
            }
        });
    }
}

module.exports = main
