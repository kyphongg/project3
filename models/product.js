const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
const moment = require("moment-timezone");
const dateVietNam = moment.tz(Date.now(), "Asia/Ho_Chi_Minh");
var Product = new Schema({
    productName:{
        type: String
    },
    productDescription:{    
        type: String
    },
    productImage:{
        type: String
    },
    categoryID:[{
        //Thử cho biến id{type: mongoose.Schema.Types.ObjectId,}
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    producerID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producer'
    },
    priceIn:{
        type: String
    },
    priceOut:{
        type: String
    },
    productStatus:{
        type: Number
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
Product.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Product', Product)
