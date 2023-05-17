const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Cart = new Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productList:[{
        productID:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity:{
            type: Number
        },
    }],
    status:{
        type: Number
    },
    username:{
        type: Number
    },  
})
  
Cart.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Cart', Cart)
