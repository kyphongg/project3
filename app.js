const express = require("express");
const ejs = require("ejs");
const app = express();
const port = 3000;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const moment = require("moment-timezone");
const morgan = require("morgan");
const cors = require("cors");
const flash = require("connect-flash");

app.use(cors());
app.use(flash());

const dateVietNam = moment
  .tz(Date.now(), "Asia/Ho_Chi_Minh")
  .format("DD/MM/YYYY hh:mm");
console.log(dateVietNam);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Money format
const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

//Mongodb
const mongoose = require("mongoose");
const mongoClient = require("mongodb").MongoClient;
mongoose
  .connect(
    "mongodb+srv://lam:WBz1E8R60tx79jBO@cluster0.19fbi9g.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to mongo successfully"))
  .catch((err) => {
    console.error(err);
  });

//models
const Admin = require("./models/admin.js");
const User = require("./models/user.js");
const Category = require("./models/category.js");
const Producer = require("./models/producer.js");
const Product = require("./models/product.js");
const Warehouse = require("./models/warehouse.js");
const Coupon = require("./models/coupon.js");
const City = require("./models/city.js");
const Cart = require("./models/cart.js");
const Order = require("./models/order.js");
const News = require("./models/news.js");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//multer
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype == "image/bmp" ||
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/gif"
    ) {
      cb(null, true);
    } else {
      return cb(new Error("Chỉ được sử dụng hình ảnh cho tính năng này"));
    }
  },
}).single("productImage");

//body-parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

//Client
//Đăng nhập đăng ký tài khoản
app.get("/login", (req, res) => {
  res.render("layouts/clients/login", {
    userid: 1,
    fullname: 1,
    cart: 0,
    error: req.flash("error"),
  });
});

app.get("/signup", (req, res) => {
  res.render("layouts/clients/signup", {
    sID: req.sessionID,
    userid: 1,
    fullname: 1,
    cart: 0,
    error: req.flash("error"),
  });
});

app.post("/save", async function (req, res) {
  const check = await User.findOne({
    $or: [
      { email: req.body.email },
      { username: req.body.username },
      { phone: req.body.phone },
    ],
  });
  if (check) {
    req.flash("error", "Tài khoản đã tồn tại");
    res.redirect("/signup");
  } else {
    var user = User({
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
      phone: req.body.phone,
    });
    if (req.body.password != req.body.password2) {
      req.flash("error", "Mật khẩu không trùng khớp");
      res.redirect("/signup");
    } else {
      user.save().then(function () {
        res.redirect("/");
      });
    }
  }
});

//Xử lý đăng nhập
app.post("/login", async function (req, res) {
  try {
    //Kiểm tra xem tài khoản có tồn tại hay không
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      //Kiểm tra mật khẩu
      const result = req.body.password === user.password;
      if (result) {
        var sess = req.session;
        sess.guest = true;
        sess.fullname = user.fullname;
        sess.email = user.email;
        sess.userid = user._id;
        res.redirect("/");
      } else {
        req.flash("error", "Sai mật khẩu");
        res.redirect("/login");
      }
    } else {
      req.flash("error", "Tài khoản không tồn tại");
      res.redirect("/login");
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

//Đăng xuất
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

//Trang chủ
app.get("/", async (req, res) => {
  if (req.session.guest) {
    const news = await News.find({
      $or: [{ newsStatus: 0 }, { newsStatus: 1 }],
    });
    const cart = await Cart.aggregate([
      { $match: { userID: new mongoose.Types.ObjectId(req.session.userid) } },
      {
        $addFields: {
          size: {
            $size: "$items",
          },
        },
      },
      {
        $group: {
          _id: null,
          item_count: {
            $sum: "$size",
          },
        },
      },
    ]);
    var sess = req.session;
    sess.cart = cart;
    await Product.find({ $or: [{ productStatus: 0 }, { productStatus: 1 }] })
      .populate("categoryID")
      .populate("producerID")
      .then((data) => {
        res.render("layouts/clients/home", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
          tintuc: news,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    const news = await News.find({
      $or: [{ newsStatus: 0 }, { newsStatus: 1 }],
    });
    await Product.find({ $or: [{ productStatus: 0 }, { productStatus: 1 }] })
      .populate("categoryID")
      .populate("producerID")
      .then((data) => {
        res.render("layouts/clients/home", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
          tintuc: news,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Trang giới thiệu, tin tức, tuyển dụng, hỗ trợ
app.get("/about", async (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/about", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/about", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/privacy_policy", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/privacy_policy", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/privacy_policy", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/terms_of_service", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/terms_of_service", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/terms_of_service", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/news", async (req, res) => {
  let data = await News.find().populate("newsProduct");
  if (req.session.guest) {
    res.render("layouts/clients/news", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
    });
  } else {
    res.render("layouts/clients/news", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      danhsach: data,
    });
  }
});

app.get("/hiring", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/hiring", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/hiring", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/support", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/support", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/support", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/hotline", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/hotline", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/hotline", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

app.get("/customer_care", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/customer_care", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.render("layouts/clients/customer_care", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
    });
  }
});

//Trang profile, lịch sử đơn hàng, mật khẩu
app.get("/profile/:id", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/profile", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/orders/:id", async (req, res) => {
  if (req.session.guest) {
    let data = await Order.find({ userID: req.session.userid });
    res.render("layouts/clients/orders", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      VND,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/password/:id", (req, res) => {
  if (req.session.guest) {
    res.render("layouts/clients/password", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.redirect("/login");
  }
});

//Trang chi tiết lịch sử đơn hàng
app.get("/orders_detail", (req, res) => {
  res.render("layouts/clients/orders_detail", {
    nhanvat: 1,
  });
});

//Trang giỏ hàng và thanh toán và trang thông báo đặt hàng thành công
app.get("/cart/:id", async (req, res) => {
  if (req.session.guest) {
    const cart = await Cart.aggregate([
      { $match: { userID: new mongoose.Types.ObjectId(req.session.userid) } },
      {
        $addFields: {
          size: {
            $size: "$items",
          },
        },
      },
      {
        $group: {
          _id: null,
          item_count: {
            $sum: "$size",
          },
        },
      },
    ]);
    var sess = req.session;
    sess.cart = cart;
    const carti = await Cart.find({
      userID: new mongoose.Types.ObjectId(req.session.userid),
    });
    await Cart.find({ userID: new mongoose.Types.ObjectId(req.session.userid) })
      .populate("items.productID")
      .then((data) => {
        let money = 0;
        for (let i = 0; i < data.length; i++) {
          data[i].items.forEach(async function (pid) {
            money += pid.productID.priceOut * parseInt(pid.quantity);
          });
        }
        res.render("layouts/clients/cart", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
          carti,
          money,
        });
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/add_to_cart", async (req, res) => {
  const productId = req.body.product_id_hidden;
  const quantity = parseInt(req.body.quantity);
  const convert = req.body.quantity;
  const uid = req.body.user_id_hidden;
  let cart = await Cart.find({ userID: req.body.user_id_hidden });
  if (cart[0]) {
    for (let i = 0; i < cart.length; i++) {
      cart[0].items.forEach(async function (element) {
        if (element._id == productId && element.productID == productId) {
          if (quantity > 0) {
            // await Cart.updateOne(
            //   { "items._id": productId, userID: uid },
            //   { $addToSet: { "items.$.quantity": quantity } },
            //   {
            //     upsert: true,
            //   }
            // );
            await Cart.updateOne(
              {
                userID: uid,
                items: { $elemMatch: { _id: productId } },
              },
              { $inc: { "items.$.quantity": convert } }
            );
          }
        } else if (
          element._id != productId &&
          element.productID != productId &&
          quantity > 0
        ) {
          await Cart.updateOne(
            { userID: uid },
            {
              $addToSet: {
                items: {
                  _id: productId,
                  productID: productId,
                  quantity: quantity,
                },
              },
            }
          );
        }
      });
    }
    res.redirect("/cart/:id");
  } else {
    var cartData = Cart(
      {
        _id: uid,
        items: [
          {
            quantity: quantity,
            productID: productId,
            _id: productId,
          },
        ],
        userID: uid,
      },
      { unique: true }
    );
    cartData.save().then(function () {
      res.redirect("/cart/:id");
    });
  }
});

app.post("/update_quantity_cart", async (req, res) => {
  const quantity = req.body.quantity;
  const productId = req.body.product_id_hidden;
  const uid = req.body.user_id_hidden;
  await Cart.updateOne(
    {
      userID: uid,
      items: { $elemMatch: { _id: productId } },
    },

    { $set: { "items.$.quantity": quantity } }
  );
  res.redirect("/cart/:id");
});

app.get("/delete_cart_items/:id", async function (req, res) {
  if (req.session.guest) {
    const uid = req.session.userid;
    const productId = req.params.id;
    const cart = await Cart.aggregate([
      { $match: { userID: new mongoose.Types.ObjectId(req.session.userid) } },
      {
        $addFields: {
          size: {
            $size: "$items",
          },
        },
      },
      {
        $group: {
          _id: null,
          item_count: {
            $sum: "$size",
          },
        },
      },
    ]);
    cart.forEach(async function (item) {
      if (item.item_count == 1) {
        await Cart.deleteOne({
          userID: new mongoose.Types.ObjectId(req.session.userid),
        }).then(function () {
          res.redirect("/cart/:id");
        });
      } else {
        await Cart.updateOne(
          {
            "items._id": productId,
            userID: uid,
          },
          { $pull: { items: { _id: productId } } },
          { multi: true }
        ).then(function () {
          res.redirect("/cart/:id");
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/checkout/:id", async (req, res) => {
  if (req.session.guest) {
    let carti = await Cart.find({
      userID: new mongoose.Types.ObjectId(req.session.userid),
    });
    let address = await City.find();
    await Cart.find({
      userID: new mongoose.Types.ObjectId(req.session.userid),
    })
      .populate("items.productID")
      .then((data) => {
        let money = 0;
        for (let i = 0; i < data.length; i++) {
          data[i].items.forEach(function (pid) {
            money += pid.productID.priceOut * parseInt(pid.quantity);
          });
        }
        let convert = parseInt(money);
        res.render("layouts/clients/checkout", {
          fullname: req.session.fullname,
          email: req.session.email,
          userid: req.session.userid,
          sID: req.session.sessionID,
          cart: req.session.cart,
          carti,
          danhsach: data,
          VND,
          city: address,
          convert,
        });
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/creat_new_order", async (req, res) => {
  const productId = req.body.product_id_hidden;
  const quantity = parseInt(req.body.quantity_hidden);
  const uid = req.body.user_id_hidden;
  await Order({
    //items.0.productID
    // dùng thử forEach giống trong cart xong save bằng order[0]
    // nếu tìm thấy order[0] thì tạo order mới
    items: [[{ productID: productId, quantity: quantity, _id: productId }]],
    userID: uid,
    paymentMethod: req.body.paymentMethod,
    shippingAddress: req.body.shippingAddress,
    shippingFee: req.body.shippingFee,
    phone: req.body.phone,
    total: req.body.total,
    timeIn: dateVietNam,
    orderStatus: 0,
  }).save();
  await Cart.deleteOne({
    userID: new mongoose.Types.ObjectId(req.session.userid),
  });
  res.redirect("/success");
});

app.get("/success", async (req, res) => {
  if (req.session.guest) {
    const cart = await Cart.aggregate([
      { $match: { userID: new mongoose.Types.ObjectId(req.session.userid) } },
      {
        $addFields: {
          size: {
            $size: "$items",
          },
        },
      },
      {
        $group: {
          _id: null,
          item_count: {
            $sum: "$size",
          },
        },
      },
    ]);
    var sess = req.session;
    sess.cart = cart;
    res.render("layouts/clients/success", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
    });
  } else {
    res.redirect("/login");
  }
});

//Trang tìm kiếm
app.get("/search", async (req, res) => {
  let kw = req.query.kw;
  try {
    if (req.session.guest) {
      await Product.find({
        productName: { $regex: ".*" + kw + ".*", $options: "i" },
      })
        .then(async (data) => {
          res.render("layouts/clients/search", {
            fullname: req.session.fullname,
            userid: req.session.userid,
            sID: req.session.sessionID,
            danhsach: data,
            VND,
            cart: req.session.cart,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await Product.find({
        productName: { $regex: ".*" + kw + ".*", $options: "i" },
      })
        .then(async (data) => {
          res.render("layouts/clients/search", {
            fullname: 1,
            userid: 1,
            sID: req.session.sessionID,
            danhsach: data,
            VND,
            cart: 0,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (error) {
    res.status(400).json({ error: "Lỗi Tìm kiếm" });
  }
});

//Trang tất cả các sản phẩm
app.get("/all_product", async (req, res) => {
  if (req.session.guest) {
    await Product.find({ $or: [{ productStatus: 0 }, { productStatus: 1 }] })
      .populate("categoryID")
      .populate("producerID")
      .then((data) => {
        res.render("layouts/clients/all_product", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    await Product.find({ $or: [{ productStatus: 0 }, { productStatus: 1 }] })
      .populate("categoryID")
      .populate("producerID")
      .then(async (data) => {
        res.render("layouts/clients/all_product", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Trang chi tiết sản phẩm
app.get("/product/:id", async (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/product", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          cart: req.session.cart,
          VND,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/product", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Trang category
//Hành động
app.get("/category/6476b3651cde57b995f9a9ed", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "6476b3651cde57b995f9a9ed"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/hanhdong", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "6476b3651cde57b995f9a9ed"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/hanhdong", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Phiêu lưu
app.get("/category/645c5a60cf52334165588925", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a60cf52334165588925"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/phieuluu", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a60cf52334165588925"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/phieuluu", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Thể thao
app.get("/category/645c54d3c72a21d65472d42b", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c54d3c72a21d65472d42b"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/thethao", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c54d3c72a21d65472d42b"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/thethao", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Chiến thuật
app.get("/category/645c554c5eca5bdb84a25d09", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c554c5eca5bdb84a25d09"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/chienthuat", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c554c5eca5bdb84a25d09"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/chienthuat", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Nhập vai
app.get("/category/645c5a59cf52334165588922", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a59cf52334165588922"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/nhapvai", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a59cf52334165588922"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/nhapvai", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Mô phỏng
app.get("/category/645c5a67cf52334165588928", (req, res) => {
  if (req.session.guest) {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a67cf52334165588928"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/mophong", {
          fullname: req.session.fullname,
          userid: req.session.userid,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: req.session.cart,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Warehouse.aggregate([
      { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productList.categoryID",
          foreignField: "_id",
          as: "categoryList",
        },
      },
      {
        $match: {
          "productList.categoryID": new mongoose.Types.ObjectId(
            "645c5a67cf52334165588928"
          ),
        },
      },
      {
        $lookup: {
          from: "producers",
          localField: "productList.producerID",
          foreignField: "_id",
          as: "producerList",
        },
      },
    ])
      .then((data) => {
        res.render("layouts/clients/mophong", {
          fullname: 1,
          userid: 1,
          sID: req.session.sessionID,
          danhsach: data,
          VND,
          cart: 0,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Servers
//Trang đăng nhập
app.get("/admin_login", (req, res) => {
  res.render("layouts/servers/login", {
    error: req.flash("error"),
  });
});

//Xử lý đăng nhập
app.post("/admin_login", async function (req, res) {
  try {
    //Kiểm tra xem tài khoản có tồn tại hay không
    const admin = await Admin.findOne({ email: req.body.email });
    if (admin) {
      //Kiểm tra mật khẩu
      const result = req.body.password === admin.password;
      if (result) {
        const customer = await User.find().count();
        const employee = await Admin.find().count();
        const order = await Order.find({ orderStatus: 0 }).count();
        var sess = req.session;
        sess.daDangNhap = true;
        sess.fullname = admin.fullname;
        sess.admin_id = admin._id;
        sess.admin_role = admin.role;
        sess.number = customer;
        sess.numberal = employee;
        sess.order = order;
        res.redirect("/admin_home");
      } else {
        req.flash("error", "Sai mật khẩu");
        res.redirect("/admin_login");
      }
    } else {
      req.flash("error", "Tài khoản không tồn tại");
      res.redirect("/admin_login");
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

//Đăng xuất
app.get("/admin_logout", function (req, res) {
  req.session.destroy();
  res.redirect("/admin_login");
});

//Trang home admin
app.get("/admin_home", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/home", {
      fullname: req.session.fullname,
      number: req.session.number,
      numberal: req.session.numberal,
      order: req.session.order,
      admin_id: req.session.admin_id,
      admin_role: req.session.admin_role,
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang thể loại
app.get("/admin_categories", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Category.find();
      res.render("layouts/servers/categories/categories", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_categories", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      res.render("layouts/servers/categories/add_categories", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/categories_save", async function (req, res) {
  if (req.session.daDangNhap) {
    var check = await Category.findOne({ categoryName: req.body.categoryName });
    if (check) {
      req.flash("error", "Thể loại đã tồn tại");
      res.redirect("/admin_categories");
    } else {
      var category = Category({
        categoryName: req.body.categoryName,
      });
      category.save().then(function () {
        req.flash("success", "Thêm thành công");
        res.redirect("/admin_categories");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_categories/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Category.findById(req.params.id);
      res.render("layouts/servers/categories/edit_categories", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_categories_save", async function (req, res) {
  if (req.session.daDangNhap) {
    var check = await Category.findOne({ categoryName: req.body.categoryName });
    if (check) {
      req.flash("error", "Sửa không thành công");
      res.redirect("/admin_categories");
    } else {
      Category.updateOne(
        { _id: req.body.categoryId },
        {
          categoryName: req.body.categoryName,
        }
      ).then(function () {
        req.flash("success", "Sửa thành công");
        res.redirect("/admin_categories");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_categories/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Category.deleteOne({ _id: req.params.id }).then(function () {
      req.flash("success", "Xoá thành công");
      res.redirect("/admin_categories");
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang nhà sản xuất
app.get("/admin_producers", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Producer.find();
      res.render("layouts/servers/producers/producers", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_producers", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      res.render("layouts/servers/producers/add_producers", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/producers_save", async function (req, res) {
  if (req.session.daDangNhap) {
    var check = await Producer.findOne({ producerName: req.body.producerName });
    if (check) {
      req.flash("error", "NSX đã tồn tại");
      res.redirect("/admin_producers");
    } else {
      var producer = Producer({
        producerName: req.body.producerName,
      });
      producer.save().then(function () {
        req.flash("success", "Thêm thành công");
        res.redirect("/admin_producers");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_producers/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Producer.findById(req.params.id);
      res.render("layouts/servers/producers/edit_producers", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_producers_save", async function (req, res) {
  if (req.session.daDangNhap) {
    var check = await Producer.findOne({ producerName: req.body.producerName });
    if (check) {
      req.flash("error", "Sửa không thành công");
      res.redirect("/admin_producers");
    } else {
      Producer.updateOne(
        { _id: req.body.producerId },
        {
          producerName: req.body.producerName,
        }
      ).then(function () {
        req.flash("success", "Sửa thành công");
        res.redirect("/admin_producers");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_producers/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Producer.deleteOne({ _id: req.params.id }).then(function () {
      req.flash("success", "Xoá thành công");
      res.redirect("/admin_producers");
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang sản phẩm
app.get("/admin_product", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      await Product.find()
        .populate("categoryID")
        .populate("producerID")
        .then((data) => {
          res.render("layouts/servers/product/product", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            VND,
            admin_role: req.session.admin_role,
            success: req.flash("success"),
            error: req.flash("error"),
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_product", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      res.render("layouts/servers/product/add_product", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        VND,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/save_product", async (req, res) => {
  if (req.session.daDangNhap) {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        req.flash("error", "Lỗi Multer khi upload ảnh");
      } else if (err) {
        req.flash("error", "Lỗi bất ngờ xảy ra");
      } else {
        let check = await Product.findOne({
          $or: [
            { productName: req.body.productName },
            { productImage: req.file.filename },
          ],
        });
        if (check) {
          req.flash("error", "Sản phẩm đã tồn tại");
          res.redirect("/admin_product");
        } else {
          var product = Product({
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            productImage: req.file.filename,
            categoryID: req.body.categoryID,
            producerID: req.body.producerID,
            priceIn: req.body.priceIn,
            priceOut: req.body.priceOut,
            productStatus: req.body.productStatus,
            created_date: dateVietNam,
            updated_date: dateVietNam,
            created_by: req.session.fullname,
            updated_by: req.session.fullname,
          });
          product.save().then(function () {
            req.flash("success", "Thêm thành công");
            res.redirect("/admin_product");
          });
        }
      }
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_product/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      await Product.findById(req.params.id)
        .populate("categoryID")
        .populate("producerID")
        .then((data) => {
          res.render("layouts/servers/product/edit_product", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            VND,
            admin_role: req.session.admin_role,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_product_save", async (req, res) => {
  if (req.session.daDangNhap) {
    let check = await Product.findOne({
      $or: [
        { productName: req.body.productName },
        { productImage: req.file.filename },
      ],
    });
    if (check) {
      req.flash("error", "Sản phẩm đã tồn tại");
      res.redirect("/admin_product");
    } else {
      upload(req, res, function (err) {
        //Không chọn file mới
        if (!req.file) {
          Product.updateOne(
            { _id: req.body.productId },
            {
              productName: req.body.productName,
              productDescription: req.body.productDescription,
              categoryID: req.body.categoryID,
              producerID: req.body.producerID,
              priceIn: req.body.priceIn,
              priceOut: req.body.priceOut,
              productStatus: req.body.productStatus,
              updated_by: req.session.fullname,
              updated_date: dateVietNam,
            }
          ).then(function () {
            req.flash("success", "Sửa thành công");
            res.redirect("/admin_product");
          });
          // Chọn file mới
        } else {
          if (err instanceof multer.MulterError) {
            req.flash("error", "Lỗi Multer khi upload ảnh");
          } else if (err) {
            req.flash("error", "Lỗi bất ngờ xảy ra");
          } else {
            Product.updateOne(
              { _id: req.body.productId },
              {
                productName: req.body.productName,
                productDescription: req.body.productDescription,
                productImage: req.file.filename,
                categoryID: req.body.categoryID,
                producerID: req.body.producerID,
                priceIn: req.body.priceIn,
                priceOut: req.body.priceOut,
                productStatus: req.body.productStatus,
                updated_by: req.session.fullname,
                updated_date: dateVietNam,
              }
            ).then(function () {
              req.flash("success", "Sửa thành công");
              res.redirect("/admin_product");
            });
          }
        }
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang danh sách khách hàng
app.get("/customers", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      let data = await User.find();
      res.render("layouts/servers/customer/customer", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Nhân viên
app.get("/employees", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.find();
      res.render("layouts/servers/employee/employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/admin_profile/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.findById({ _id: req.params.id });
    res.render("layouts/servers/employee/profile", {
      fullname: req.session.fullname,
      admin_id: req.session.admin_id,
      nhanvat: data,
      admin_role: req.session.admin_role,
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/admin_setting/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.findById({ _id: req.params.id });
    res.render("layouts/servers/employee/setting", {
      fullname: req.session.fullname,
      admin_id: req.session.admin_id,
      nhanvat: data,
      admin_role: req.session.admin_role,
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/admin_save", async function (req, res) {
  if (req.session.daDangNhap) {
    let check = await Admin.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (check) {
      req.flash("error", "Tài khoản đã tồn tại");
      res.redirect("/employees");
    } else {
      var admin = Admin({
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        role: req.body.role,
        status: req.body.status,
      });
      admin.save().then(function () {
        req.flash("success", "Thêm thành công");
        res.redirect("/employees");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_employee", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      res.render("layouts/servers/employee/add_employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit/:id", async function (req, res) {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.findById(req.params.id);
      res.render("layouts/servers/employee/edit_employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_save", async function (req, res) {
  if (req.session.daDangNhap) {
    let check = await Admin.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (check) {
      req.flash("error", "Tài khoản đã tồn tại");
      res.redirect("/employees");
    } else {
      Admin.updateOne(
        { _id: req.body.id },
        {
          fullname: req.body.fullname,
          email: req.body.email,
          username: req.body.username,
          role: req.body.role,
          status: req.body.status,
        }
      ).then(function () {
        req.flash("success", "Sửa thành công");
        res.redirect("/employees");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Admin.deleteOne({ _id: req.params.id }).then(function () {
      req.flash("success", "Xoá thành công");
      res.redirect("/employees");
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/employees_store", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.find({ role: 1 });
      res.render("layouts/servers/employee/store_employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/employees_order", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.find({ role: 2 });
      res.render("layouts/servers/employee/order_employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/employees_customer_care", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.find({ role: 3 });
      res.render("layouts/servers/employee/customer_care_employee", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang quản lý đơn hàng
app.get("/all_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find().populate("userID");
      res.render("layouts/servers/orders/all_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/new_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find({ orderStatus: 0 }).populate("userID");
      res.render("layouts/servers/orders/new_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/order_detail", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      res.render("layouts/servers/orders/order_detail", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/accept_orders", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      res.render("layouts/servers/orders/accept_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/done_orders", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      res.render("layouts/servers/orders/done_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/cancel_orders", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      res.render("layouts/servers/orders/cancel_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang kho
app.get("/warehouse", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      Warehouse.aggregate([
        { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productList",
          },
        },
      ])
        .then(async (data) => {
          res.render("layouts/servers/warehouse/warehouse", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            VND,
            admin_role: req.session.admin_role,
            success: req.flash("success"),
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/list_warehouse/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      await Warehouse.find({ productID: req.params.id })
        .populate("productID")
        .populate("created_by")
        .then((data) => {
          res.render("layouts/servers/warehouse/list_warehouse", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            VND,
            admin_role: req.session.admin_role,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_warehouse", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      await Product.find()
        .populate("categoryID")
        .populate("producerID")
        .then((data) => {
          res.render("layouts/servers/warehouse/add_warehouse", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            admin_role: req.session.admin_role,
          });
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/save_warehouse", (req, res) => {
  if (req.session.daDangNhap) {
    var warehouse = Warehouse({
      productID: req.body.productID,
      quantityIn: req.body.quantityIn,
      created_by: req.session.admin_id,
      created_date: dateVietNam,
    });
    warehouse.save().then(function () {
      req.flash("success", "Thêm thành công");
      res.redirect("/warehouse");
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang mã giảm giá
app.get("/coupon", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Coupon.find();
      res.render("layouts/servers/coupon/coupon", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        VND,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_coupon", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      res.render("layouts/servers/coupon/add_coupon", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/coupon_save", async function (req, res) {
  if (req.session.daDangNhap) {
    let check = await Coupon.findOne({ couponCode: req.body.couponCode });
    if (check) {
      req.flash("error", "MGG đã tồn tại");
      res.redirect("/coupon");
    } else {
      var coupon = Coupon({
        couponName: req.body.couponName,
        couponCode: req.body.couponCode,
        couponQuantity: req.body.couponQuantity,
        couponType: req.body.couponType,
        couponStatus: req.body.couponStatus,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      });
      coupon.save().then(function () {
        req.flash("success", "Thêm thành công");
        res.redirect("/coupon");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_coupon/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Coupon.findById(req.params.id);
      res.render("layouts/servers/coupon/edit_coupon", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_coupon_save", async function (req, res) {
  if (req.session.daDangNhap) {
    Coupon.updateOne(
      { _id: req.body.couponId },
      {
        couponName: req.body.couponName,
        couponCode: req.body.couponCode,
        couponQuantity: req.body.couponQuantity,
        couponType: req.body.couponType,
        couponStatus: req.body.couponStatus,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      }
    ).then(function () {
      res.redirect("/coupon");
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_coupon/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Coupon.deleteOne({ _id: req.params.id }).then(function () {
      res.redirect("/coupon");
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang bảng giá từng thành phố
app.get("/cities", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await City.find();
      res.render("layouts/servers/cities/cities", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        VND,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_cities", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      res.render("layouts/servers/cities/add_cities", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/cities_save", async function (req, res) {
  if (req.session.daDangNhap) {
    let check = await City.findOne({ cityName: req.body.cityName });
    if (check) {
      req.flash("error", "Thành phố đã tồn tại");
      res.redirect("/cities");
    } else {
      var city = City({
        cityName: req.body.cityName,
        price: req.body.price,
      });
      city.save().then(function () {
        req.flash("success", "Thêm thành công");
        res.redirect("/cities");
      });
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_cities/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await City.findById(req.params.id);
      res.render("layouts/servers/cities/edit_cities", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_cities_save", async function (req, res) {
  if (req.session.daDangNhap) {
    City.updateOne(
      { _id: req.body.cityId },
      {
        price: req.body.price,
      }
    ).then(function () {
      req.flash("success", "Sửa thành công");
      res.redirect("/cities");
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_cities/:id", function (req, res) {
  if (req.session.daDangNhap) {
    City.deleteOne({ _id: req.params.id }).then(function () {
      req.flash("success", "Xoá thành công");
      res.redirect("/cities");
    });
  } else {
    res.redirect("/admin_login");
  }
});

//Trang quản lý tin tức
app.get("/admin_news", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      let data = await News.find().populate("newsProduct");
      res.render("layouts/servers/news/news", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        VND,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_news", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      await Product.find()
        .populate("categoryID")
        .populate("producerID")
        .then((data) => {
          res.render("layouts/servers/news/add_news", {
            fullname: req.session.fullname,
            admin_id: req.session.admin_id,
            danhsach: data,
            admin_role: req.session.admin_role,
          });
        });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/news_save", async function (req, res) {
  if (req.session.daDangNhap) {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        req.flash("error", "Lỗi Multer khi upload ảnh");
      } else if (err) {
        req.flash("error", "Lỗi bất ngờ xảy ra");
      } else {
        let check = await News.findOne({
          newsTitle: req.body.newsTitle,
        });
        if (check) {
          req.flash("error", "Tin đã tồn tại");
          res.redirect("/admin_news");
        } else {
          var news = News({
            newsTitle: req.body.newsTitle,
            newsContent: req.body.newsContent,
            newsProduct: req.body.newsProduct,
            productImage: req.file.filename,
            newsStatus: req.body.newsStatus,
            created_date: dateVietNam,
            updated_date: dateVietNam,
            created_by: req.session.fullname,
          });
          news.save().then(function () {
            req.flash("success", "Thêm thành công");
            res.redirect("/admin_news");
          });
        }
      }
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit_news/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      let data = await News.findById(req.params.id).populate("newsProduct");
      let pro = await Product.find();
      res.render("layouts/servers/news/edit_news", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        danhsach: data,
        sanpham: pro,
        admin_role: req.session.admin_role,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/edit_news_save", async function (req, res) {
  if (req.session.daDangNhap) {
    upload(req, res, function (err) {
      //Không chọn file mới
      if (!req.file) {
        News.updateOne(
          { _id: req.body.newsId },
          {
            newsTitle: req.body.newsTitle,
            newsContent: req.body.newsContent,
            newsProduct: req.body.newsProduct,
            newsStatus: req.body.newsStatus,
            updated_by: req.session.fullname,
            updated_date: dateVietNam,
          }
        ).then(function () {
          req.flash("success", "Sửa thành công");
          res.redirect("/admin_news");
        });
        // Chọn file mới
      } else {
        if (err instanceof multer.MulterError) {
          req.flash("error", "Lỗi Multer khi upload ảnh");
        } else if (err) {
          req.flash("error", "Lỗi bất ngờ xảy ra");
        } else {
          Product.updateOne(
            { _id: req.body.newsId },
            {
              newsTitle: req.body.newsTitle,
              newsContent: req.body.newsContent,
              newsProduct: req.body.newsProduct,
              productImage: req.file.filename,
              newsStatus: req.body.newsStatus,
              updated_by: req.session.fullname,
              updated_date: dateVietNam,
            }
          ).then(function () {
            req.flash("success", "Sửa thành công");
            res.redirect("/admin_news");
          });
        }
      }
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_news/:id", function (req, res) {
  if (req.session.daDangNhap) {
    News.deleteOne({ _id: req.params.id }).then(function () {
      req.flash("success", "Xoá thành công");
      res.redirect("/admin_news");
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
