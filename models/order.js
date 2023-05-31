const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
var Order = new Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  paymentMethod: {
    type: String,
  },
  shippingAddress: {
    type: String,
  },
  shippingFee: {
    type: Number,
  },
  orderStatus: {
    type: Number,
  },
  items: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],

  total: {
    type: Number,
  },
  timeIn: {
    type: String,
  },
  username: {
    type: Number,
  },
});
Order.plugin(passportLocalMongoose);

module.exports = mongoose.model("Order", Order);
