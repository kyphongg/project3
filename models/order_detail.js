const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var OrderDetail = new Schema({
    orderID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    productID:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    username:{
        type: Number
    },  
})
  
OrderDetail.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('OrderDetail', OrderDetail)
