const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Coupon = new Schema({
    couponName:{
        type: String
    },
    couponCode:{
        type: String
    },
    couponQuantity:{
        type: Number
    },
    couponStatus:{
        type: Number
    },
    couponType:{
        type: Number
    },
    start_date:{
        type: String
    },
    end_date:{
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
  
Coupon.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Coupon', Coupon)