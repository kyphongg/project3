const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Shipping = new Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cityID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    shippingAddress:{
        type: String
    },
    username:{
        type: Number
    },  
})
  
Shipping.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Shipping', Shipping)
