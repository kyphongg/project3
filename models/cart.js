const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Cart = new Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productID:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    username:{
        type: Number
    },  
})
  
Cart.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Cart', Cart)
