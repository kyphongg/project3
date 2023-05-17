const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');

let Item = new Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less then 1.']
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true,
    }
})

const Cart = new Schema({
    items: [Item],
    subTotal: {
        default: 0,
        type: Number
    },
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
})
Cart.plugin(passportLocalMongoose);

module.exports = mongoose.model('Cart', Cart);

