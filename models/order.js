const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Order = new Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    cartID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    paymentID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    couponID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    shippingID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipping'
    },
    orderStatus:{
        type: Number
    },
    productQuantity:{
        type: Number
    },
    orderTotal:{
        type: Number
    },
    timeIn:{
        type: String
    },
    username:{
        type: Number
    },
})
Order.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Order', Order)
