const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    id: String,
    previousGenerations: [Object]
});

module.exports = mongoose.model('User', userSchema);