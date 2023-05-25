const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');

let Item = new Schema({
    _id:{
        type: mongoose.Schema.Types.ObjectId
    },
    productID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less then 1.']
    }
})

const Cart = new Schema({
    items: [Item],
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    count:{
        type: Number,
        default: 0,
    },
    username:{
        type: Number
    },  
})
Cart.plugin(passportLocalMongoose);

module.exports = mongoose.model('Cart', Cart);

