const { Schema, model } = require("mongoose");

const schema = new Schema({
    _id: Schema.Types.ObjectId,
    guildID: { type: String, default: "" },
    role: String,
    name: String,
    color: String,
    hoist: Boolean,
    position: Number,
    permler: Number,
    mentionable: Boolean,
    members: Array
});

module.exports = model("roles", schema)