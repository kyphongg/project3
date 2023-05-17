const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Payment = new Schema({
    paymentMethod:{
        type: String
    },
    username:{
        type: Number
    },  
})
  
Payment.plugin(passportLocalMongoose);
  
module.exports = mongoose.model('Payment', Payment)
