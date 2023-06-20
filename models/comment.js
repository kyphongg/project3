const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
const moment = require("moment-timezone");
var Comment = new Schema({
    commentProduct:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    commentInfo:{
        type: String
    },
    commentStatus:{
        type: Number
    },
    commentName:{
        type: String
    },
    commentDate:{
        type: String
    },
    username:{
        type: Number
    },
})
Comment.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Comment', Comment)