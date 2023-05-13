const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
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
    username:{
        type: Number
    },
},{timestamps:true})
  
Product.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Product', Product)
