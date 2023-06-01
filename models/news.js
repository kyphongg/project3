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
    newsStatus:{
        type: Number
    },
    productImage:{
        type: String
    },
    newsProduct:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    created_date:{
        type: String
    },
    updated_date:{
        type: String
    },
    created_by:{
        type: String
    },
    updated_by:{
        type: String
    },
    username:{
        type: Number
    },
})
  
News.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('News', News)
