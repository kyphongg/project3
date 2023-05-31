const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var News = new Schema({
    newsTitle:{
        type: String
    },
    newsContent:{
        type: String
    },
    username:{
        type: Number
    },
})
  
News.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('News', News)
