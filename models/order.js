const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
let Item = new Schema({
  _id:{
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
});
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
  shippingCity: {
    type: String,
    default: "Hà Nội",
  },
  shippingDistrict: {
    type: String,
  },
  shippingAddress: {
    type: String,
  },
  shippingNote: {
    type: String,
  },
  shippingFee: {
    type: Number,
  },
  orderStatus: {
    type: Number,
  },
  items: [Item],
  shippingName: {
    type: String,
  },
  shippingPhone: {
    type: Number,
  },
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
