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
const collect = require("collect.js");

app.use(cors());
app.use(flash());

const dateVietNam = moment
  .tz(Date.now(), "Asia/Ho_Chi_Minh")
  .format("DD/MM/YYYY hh:mm a");
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
  if (req.session.guest) {
    res.redirect("/");
  } else {
    res.render("layouts/clients/login", {
      userid: 1,
      fullname: 1,
      cart: 0,
      error: req.flash("error"),
      errorEmail: req.flash("errorEmail"),
      errorPassword: req.flash("errorPassword"),
    });
  }
});

app.get("/signup", (req, res) => {
  res.render("layouts/clients/signup", {
    sID: req.sessionID,
    userid: 1,
    fullname: 1,
    cart: 0,
    nameError: req.flash("nameError"),
    mobileError: req.flash("mobileError"),
    usernameError: req.flash("usernameError"),
    boxError: req.flash("boxError"),
    emailError: req.flash("emailError"),
    passwordError: req.flash("passwordError"),
    mobileED: req.flash("mobileED"),
    emailED: req.flash("emailED"),
    nameED: req.flash("nameED"),
    usernameED: req.flash("usernameED"),
    passwordED: req.flash("passwordED"),
    password2ED: req.flash("password2ED"),
    errorUsername: req.flash("errorUsername"),
    errorEmail: req.flash("errorEmail"),
    errorPhone: req.flash("errorPhone"),
  });
});

app.post("/save", async function (req, res) {
  var box = req.body.checkbox;
  var name = req.body.fullname;
  var email = req.body.email;
  var username = req.body.username;
  var mobile = req.body.phone;
  var password = req.body.password;
  var password2 = req.body.password2;
  var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var vnn_regex =
    /^[a-zA-Z'-'\sáàảãạăâắằấầặẵẫậéèẻ ẽẹếềểễệóòỏõọôốồổỗộ ơớờởỡợíìỉĩịđùúủũụưứ� �ửữựÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠ ƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼ� ��ỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞ ỠỢỤỨỪỬỮỰỲỴÝỶỸửữựỵ ỷỹ]*$/g;
  var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
  var vnp_regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/gm;
  let errorForm = 0;

  if (name == "") {
    req.flash("nameError", "Bạn chưa điền họ và tên!");
    errorForm++;
  }
  if (mobile == "") {
    req.flash("mobileError", "Bạn chưa điền số điện thoại!");
    errorForm++;
  }
  if (email == "") {
    req.flash("emailError", "Bạn chưa điền Email!");
    errorForm++;
  }
  if (username == "") {
    req.flash("usernameError", "Bạn chưa điền tên đăng nhập!");
    errorForm++;
  }
  if (password == "") {
    req.flash("passwordError", "Bạn chưa đặt mật khẩu!");
    errorForm++;
  }
  if (password != "") {
    if (vnp_regex.test(password) == false) {
      req.flash(
        "passwordError",
        "Mật khẩu tối thiểu tám ký tự, ít nhất một chữ cái, một số và một ký tự đặc biệt!"
      );
      errorForm++;
    } else {
      if (password2 == "") {
        req.flash("passwordError", "Vui lòng xác thực lại mật khẩu!");
        req.flash("passwordED", password);
        errorForm++;
      } else {
        if (password != password2) {
          req.flash("passwordError", "Mật khẩu không trùng khớp");
          req.flash("passwordED", password);
          errorForm++;
        } else {
          req.flash("passwordED", password);
          req.flash("password2ED", password2);
        }
      }
    }
  }

  if (username != "") {
    const checkUsername = await User.findOne({ username: username });
    if (checkUsername) {
      req.flash("errorUsername", "Username đã tồn tại");
      req.flash("usernameED", username);
      errorForm++;
    } else {
      req.flash("usernameED", username);
    }
  }
  if (email != "") {
    const checkEmail = await User.findOne({ email: email });
    if (checkEmail) {
      req.flash("errorEmail", "Email đã tồn tại");
      req.flash("emailED", email);
      errorForm++;
    } else {
      if (email_regex.test(email) == false) {
        req.flash("emailError", "Sai định dạng Email!");
        req.flash("emailED", email);
        errorForm++;
      } else {
        let emailED = email;
        req.flash("emailED", emailED);
      }
    }
  }
  if (name != "") {
    if (vnn_regex.test(name) == false) {
      req.flash("nameError", "Sai định dạng Họ và tên!");
      req.flash("nameED", name);
      errorForm++;
    } else {
      let nameED = name;
      req.flash("nameED", nameED);
    }
  }

  if (mobile != "") {
    const checkPhone = await User.findOne({ phone: mobile });
    if (checkPhone) {
      req.flash("errorPhone", "Số điện thoại đã tồn tại");
      req.flash("mobileED", mobile);
      errorForm++;
    } else {
      if (vnf_regex.test(mobile) == false) {
        req.flash("mobileError", "Sai định dạng Số điện thoại!");
        req.flash("mobileED", mobile);
        errorForm++;
      } else {
        let mobileED = mobile;
        req.flash("mobileED", mobileED);
      }
    }
  }

  if (box != "on") {
    errorForm++;
    req.flash("boxError", "Vui lòng đồng ý với điều khoản!");
  }

  if (errorForm != 0) {
    res.redirect("/signup");
  } else {
    var user = User({
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
      phone: req.body.phone,
    });

    user.save().then(function () {
      res.redirect("/");
    });
  }
});

//Xử lý đăng nhập
app.post("/login", async function (req, res) {
  let errorEmail = req.body.email;
  let email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let e = 0;
  if (errorEmail == "") {
    req.flash("error", "Vui lòng nhập Email!");
    e++;
  } else {
    if (email_regex.test(errorEmail) == false) {
      req.flash("error", "Sai định dạng Email");
      req.flash("errorEmail", errorEmail);
      e++;
    } else {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        //Kiểm tra mật khẩu
        let errorPassword = req.body.password;
        if (errorPassword == "") {
          req.flash("errorPassword", "Vui lòng nhập mật khẩu!");
          req.flash("errorEmail", errorEmail);
          e++;
        } else {
          const result = req.body.password === user.password;
          if (result) {
            var sess = req.session;
            sess.guest = true;
            sess.fullname = user.fullname;
            sess.email = user.email;
            sess.userid = user._id;
            res.redirect("/");
          } else {
            req.flash("errorPassword", "Sai mật khẩu");
            req.flash("errorEmail", errorEmail);
            e++;
          }
        }
      } else {
        req.flash("error", "Tài khoản không tồn tại");
        req.flash("errorEmail", errorEmail);
        e++;
      }
    }
  }
  if (e != 0) {
    res.redirect("/login");
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

app.get("/news/:id", async (req, res) => {
  let data = await News.find({ _id: req.params.id }).populate("newsProduct");
  if (req.session.guest) {
    res.render("layouts/clients/news_detail", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
    });
  } else {
    res.render("layouts/clients/news_detail", {
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
app.get("/orders_detail/:id", async (req, res) => {
  if (req.session.guest) {
    let data = await Order.findOne({ _id: req.params.id }).populate(
      "items.productID"
    );

    let code = data.couponCode;
    if (code == "Không") {
      let money = 0;
      let couponValue = 0;
      let couponType = 0;
      data.items.forEach(function (pid) {
        money += pid.productID.priceOut * pid.quantity;
      });
      res.render("layouts/clients/orders_detail", {
        fullname: req.session.fullname,
        email: req.session.email,
        userid: req.session.userid,
        sID: req.session.sessionID,
        cart: req.session.cart,
        danhsach: data,
        VND,
        money,
        couponValue,
        couponType,
      });
    } else if (code != "Không") {
      let coupon = await Coupon.findOne({ couponCode: code });
      let couponValue = coupon.couponValue;
      let couponType = coupon.couponType;
      let money = 0;
      data.items.forEach(function (pid) {
        money += pid.productID.priceOut * pid.quantity;
      });

      res.render("layouts/clients/orders_detail", {
        fullname: req.session.fullname,
        email: req.session.email,
        userid: req.session.userid,
        sID: req.session.sessionID,
        cart: req.session.cart,
        danhsach: data,
        VND,
        money,
        couponValue,
        couponType,
      });
    }
  } else {
    res.redirect("/login");
  }
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
  const qty = await Product.findOne({ _id: productId });
  let cart = await Cart.find({ userID: req.body.user_id_hidden });
  if (cart[0]) {
    const isE = cart[0].items.findIndex((item) => {
      return new String(item.productID).trim() == new String(productId).trim();
    });
    if (isE == -1) {
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
    } else {
      if (cart[0].items[isE].quantity == qty.productQuantity) {
        req.flash("error", "Số lượng của sản phẩm đã đầy");
      } else if (quantity + cart[0].items[isE].quantity > qty.productQuantity) {
        await Cart.updateOne(
          {
            userID: uid,
            items: { $elemMatch: { _id: productId } },
          },
          { $set: { "items.$.quantity": qty.productQuantity } }
        );
      } else {
        await Cart.updateOne(
          {
            userID: uid,
            items: { $elemMatch: { _id: productId } },
          },
          { $inc: { "items.$.quantity": convert } }
        );
      }
    }
    res.redirect("/cart/:id");
  } else {
    var cartData = Cart({
      _id: uid,
      items: [
        {
          quantity: quantity,
          productID: productId,
          _id: productId,
        },
      ],
      userID: uid,
    });
    cartData.save().then(function () {
      res.redirect("/cart/:id");
    });
  }
});

app.post("/update_quantity_cart", async (req, res) => {
  const quantity = req.body.quantity;
  const productId = req.body.product_id_hidden;
  const uid = req.body.user_id_hidden;
  if (quantity > 0) {
    await Cart.updateOne(
      {
        userID: uid,
        items: { $elemMatch: { _id: productId } },
      },

      { $set: { "items.$.quantity": quantity } }
    );
  } else {
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
        });
      } else {
        await Cart.updateOne(
          {
            "items._id": productId,
            userID: uid,
          },
          { $pull: { items: { _id: productId } } },
          { multi: true }
        );
      }
    });
  }
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
          success: req.flash("success"),
          error: req.flash("error"),
          cash: req.flash("cash"),
          blunt: req.flash("blunt"),
          percent: req.flash("percent"),
          code: req.flash("code"),
          type: req.flash("type"),
          nameError: req.flash("nameError"),
          cityError: req.flash("cityError"),
          districtError: req.flash("districtError"),
          addressError: req.flash("addressError"),
          mobileError: req.flash("mobileError"),
          methodError: req.flash("methodError"),
          mobileED: req.flash("mobileED"),
          nameED: req.flash("nameED"),
          districtED: req.flash("districtED"),
          addressED: req.flash("addressED"),
          noteED: req.flash("noteED"),
        });
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/add_coupon_checkout", async (req, res) => {
  if (req.session.guest) {
    let check = await Coupon.findOne({ couponCode: req.body.couponCode });

    var name = req.body.shippingName;
    var district = req.body.shippingDistrict;
    var address = req.body.shippingAddress;
    var mobile = req.body.shippingPhone;
    var note = req.body.shippingNote;

    if (name != "") {
      let nameED = name;
      req.flash("nameED", nameED);
    }
    if (mobile != "") {
      let mobileED = mobile;
      req.flash("mobileED", mobileED);
    }
    if (district != "") {
      let districtED = district;
      req.flash("districtED", districtED);
    }
    if (address != "") {
      let addressED = address;
      req.flash("addressED", addressED);
    }
    if (note != "") {
      let noteED = note;
      req.flash("noteED", noteED);
    }

    if (check) {
      let uid = req.session.userid;
      let userCheck = await Coupon.findOne({
        $and: [{ couponCode: req.body.couponCode }, { userID: uid }],
      });
      if (userCheck) {
        req.flash(
          "error",
          "Mã giảm giá đã được sử dụng trong tài khoản của bạn"
        );
      } else {
        let time = moment
          .tz(Date.now(), "Asia/Ho_Chi_Minh")
          .format("DD/MM/YYYY");
        let timeStart = check.start_date;
        let timeEnd = check.end_date;
        if (time < timeStart) {
          req.flash("error", "Thêm mã giảm giá không thành công");
        } else if (time > timeEnd) {
          req.flash("error", "Thêm mã giảm giá không thành công");
        } else {
          if (check.couponQuantity == 0) {
            req.flash("error", "Thêm mã giảm giá không thành công");
          } else {
            if (check.couponType == 0) {
              req.flash("cash", "- " + VND.format(check.couponValue * 1000));
              req.flash("blunt", check.couponValue * 1000);
              req.flash("percent", 0);
              req.flash("code", check.couponCode);
              await Coupon.updateOne(
                { couponCode: req.body.couponCode },
                { $addToSet: { userID: uid } }
              );
            } else if (check.couponType == 1) {
              req.flash("cash", "- " + check.couponValue + "%");
              req.flash("blunt", 0);
              req.flash("percent", check.couponValue * 0.01);
              req.flash("code", check.couponCode);
              await Coupon.updateOne(
                { couponCode: req.body.couponCode },
                { $addToSet: { userID: uid } }
              );
            }
            req.flash("success", "Thêm mã giảm giá thành công");
          }
        }
      }
    } else {
      req.flash("error", "Thêm mã giảm giá không thành công");
    }
    res.redirect("/checkout/:id");
  } else {
    res.redirect("/login");
  }
});

app.post("/creat_new_order", async (req, res) => {
  const productId = req.body.product_id_hidden;
  const quantity = req.body.quantity_hidden;
  const uid = req.body.user_id_hidden;
  const code = req.body.couponCode;

  let errorForm = 0;

  var name = req.body.shippingName;
  var city = req.body.shippingCity;
  var district = req.body.shippingDistrict;
  var address = req.body.shippingAddress;
  var mobile = req.body.shippingPhone;
  var note = req.body.shippingNote;
  var method = req.body.paymentMethod;

  var vnn_regex =
    /^[a-zA-Z'-'\sáàảãạăâắằấầặẵẫậéèẻ ẽẹếềểễệóòỏõọôốồổỗộ ơớờởỡợíìỉĩịđùúủũụưứ� �ửữựÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠ ƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼ� ��ỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞ ỠỢỤỨỪỬỮỰỲỴÝỶỸửữựỵ ỷỹ]*$/g;
  var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;

  if (name == "") {
    req.flash("nameError", "Bạn chưa điền họ và tên người nhận!");
    errorForm++;
  }
  if (city == "Chọn thành phố") {
    req.flash("cityError", "Bạn chưa chọn thành phố!");
    errorForm++;
  }
  if (district == "") {
    req.flash("districtError", "Bạn chưa điền quận!");
    errorForm++;
  }
  if (address == "") {
    req.flash("addressError", "Bạn chưa điền địa chỉ!");
    errorForm++;
  }
  if (mobile == "") {
    req.flash("mobileError", "Bạn chưa điền số điện thoại!");
    errorForm++;
  }
  if (mobile != "") {
    if (vnf_regex.test(mobile) == false) {
      req.flash("mobileError", "Số điện thoại của bạn không đúng định dạng!");
      let mobileED = mobile;
      req.flash("mobileED", mobileED);
      errorForm++;
    } else {
      let mobileED = mobile;
      req.flash("mobileED", mobileED);
    }
  }
  if (name != "") {
    if (vnn_regex.test(name) == false) {
      req.flash("nameError", "Họ và tên của bạn không đúng định dạng!");
      let nameED = name;
      req.flash("nameED", nameED);
      errorForm++;
    } else {
      let nameED = name;
      req.flash("nameED", nameED);
    }
  }

  if (district != "") {
    let districtED = district;
    req.flash("districtED", districtED);
  }
  if (address != "") {
    let addressED = address;
    req.flash("addressED", addressED);
  }
  if (note != "") {
    let noteED = note;
    req.flash("noteED", noteED);
  }

  if (errorForm != 0) {
    res.redirect("/checkout/:id");
  } else {
    const data = collect(productId);
    const total = data.count();
    if (total == 1) {
      await Order.insertMany({
        items: [
          {
            quantity: quantity,
            productID: productId,
            _id: productId,
          },
        ],
        userID: uid,
        paymentMethod: method,
        shippingAddress: address,
        shippingFee: req.body.shippingFee,
        shippingName: name,
        shippingCity: city,
        shippingDistrict: district,
        shippingNote: req.body.shippingNote,
        shippingPhone: mobile,
        total: req.body.total,
        couponCode: code,
        timeIn: moment
          .tz(Date.now(), "Asia/Ho_Chi_Minh")
          .format("DD/MM/YYYY hh:mm a"),
        orderStatus: 0,
      });
      await Coupon.updateOne(
        { couponCode: code },
        { $inc: { couponQuantity: -1 } }
      );
      await Product.updateOne(
        { _id: productId },
        { $inc: { productQuantity: -quantity } }
      );
      await Cart.deleteOne({
        userID: new mongoose.Types.ObjectId(req.session.userid),
      });
    } else {
      let obj = productId.map((id, index_value) => {
        return {
          _id: id,
          productID: id,
          quantity: quantity[index_value],
        };
      });
      await Order.insertMany({
        items: obj,
        userID: uid,
        paymentMethod: method,
        shippingAddress: address,
        shippingFee: req.body.shippingFee,
        shippingName: name,
        shippingCity: city,
        shippingDistrict: district,
        shippingNote: req.body.shippingNote,
        shippingPhone: mobile,
        total: req.body.total,
        couponCode: code,
        timeIn: moment
          .tz(Date.now(), "Asia/Ho_Chi_Minh")
          .format("DD/MM/YYYY hh:mm a"),
        orderStatus: 0,
      });
      for (let i = 0; i < productId.length; i++) {
        await Product.updateMany(
          { _id: productId[i] },
          { $inc: { productQuantity: -quantity[i] } }
        );
      }
      await Coupon.updateOne(
        { couponCode: code },
        { $inc: { couponQuantity: -1 } }
      );
      await Cart.deleteOne({
        userID: new mongoose.Types.ObjectId(req.session.userid),
      });
    }
    res.redirect("/success");
  }
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

app.post("/get_order/:id", async (req, res) => {
  if (req.session.guest) {
    await Order.updateOne(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: 3,
          timeOut: moment
            .tz(Date.now(), "Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY hh:mm a"),
          time: moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY"),
        },
      }
    );
    res.redirect("/orders/:id");
  } else {
    res.redirect("/login");
  }
});

app.post("/cancel_order/:id", async (req, res) => {
  if (req.session.guest) {
    await Order.updateOne(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: 4,
          cancelReason: req.body.cancelReason,
          cancelFrom: "Khách",
          timeOut: moment
            .tz(Date.now(), "Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY hh:mm a"),
        },
      }
    );
    let data = await Order.findOne({ _id: req.params.id });
    if (data.items.length == 1) {
      data.items.forEach(async function (id) {
        let qty = id.quantity;
        let pid = id._id;
        await Product.updateOne(
          { _id: pid },
          { $inc: { productQuantity: qty } }
        );
      });
    } else if (data.items.length > 1) {
      let arrayQ = [];
      let arrayP = [];
      data.items.forEach(async function (id) {
        let qty = id.quantity;
        let pid = id._id;
        arrayQ.push(qty);
        arrayP.push(pid);
      });
      for (let i = 0; i < arrayP.length; i++) {
        await Product.updateMany(
          { _id: arrayP[i] },
          { $inc: { productQuantity: arrayQ[i] } }
        );
      }
    }
    res.redirect("/orders/:id");
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
    let name = await Product.findOne({ _id: req.params.id });
    let pname = name.productName;
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
          pname,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    let name = await Product.findOne({ _id: req.params.id });
    let pname = name.productName;
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
          pname,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//Trang category
//Hành động
app.get("/category/6476b3651cde57b995f9a9ed", async (req, res) => {
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
    errorEmail: req.flash("errorEmail"),
  });
});

//Xử lý đăng nhập
app.post("/admin_login", async function (req, res) {
  //Kiểm tra xem tài khoản có tồn tại hay không
  let errorEmail = req.body.email;
  let errorPassword = req.body.password;
  let email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let e = 0;
  if (errorEmail == "") {
    req.flash("error", "Vui lòng nhập Email");
    e++;
  } else {
    if (email_regex.test(errorEmail) == false) {
      req.flash("error", "Sai định dạng Email");
      req.flash("errorEmail", errorEmail);
      e++;
    } else {
      const admin = await Admin.findOne({ email: req.body.email });
      if (admin) {
        //Kiểm tra mật khẩu
        if (errorPassword == "") {
          req.flash("error", "Vui lòng nhập mật khẩu");
          req.flash("errorEmail", errorEmail);
          e++;
        } else {
          const result = req.body.password === admin.password;
          if (result) {
            var sess = req.session;
            sess.daDangNhap = true;
            sess.fullname = admin.fullname;
            sess.admin_id = admin._id;
            sess.admin_role = admin.role;
            res.redirect("/admin_home");
          } else {
            req.flash("error", "Sai mật khẩu");
            req.flash("errorEmail", errorEmail);
            e++;
          }
        }
      } else {
        req.flash("error", "Tài khoản không tồn tại");
        req.flash("errorEmail", errorEmail);
        e++;
      }
    }
  }
  if (e != 0) {
    res.redirect("/admin_login");
  }
});

//Đăng xuất
app.get("/admin_logout", function (req, res) {
  req.session.destroy();
  res.redirect("/admin_login");
});

//Trang home admin
app.get("/admin_home", async (req, res) => {
  if (req.session.daDangNhap) {
    const order = await Order.find({ orderStatus: 0 }).count();
    const customer = await User.find().count();
    const employee = await Admin.find().count();
    res.render("layouts/servers/home", {
      fullname: req.session.fullname,
      number: customer,
      numberal: employee,
      order: order,
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
            created_date: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
            created_by: req.session.fullname,
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
              updated_date: moment
                .tz(Date.now(), "Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY hh:mm a"),
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
                updated_date: moment
                  .tz(Date.now(), "Asia/Ho_Chi_Minh")
                  .format("DD/MM/YYYY hh:mm a"),
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
    var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var vnn_regex =
      /^[a-zA-Z'-'\sáàảãạăâắằấầặẵẫậéèẻ ẽẹếềểễệóòỏõọôốồổỗộ ơớờởỡợíìỉĩịđùúủũụưứ� �ửữựÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠ ƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼ� ��ỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞ ỠỢỤỨỪỬỮỰỲỴÝỶỸửữựỵ ỷỹ]*$/g;
    var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    var vnp_regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/gm;
    let errorForm = 0;
    var name = req.body.fullname;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    if (name == "") {
      req.flash("nameError", "Bạn chưa điền họ và tên!");
      errorForm++;
    }
    if (email == "") {
      req.flash("emailError", "Bạn chưa điền Email!");
      errorForm++;
    }
    if (username == "") {
      req.flash("usernameError", "Bạn chưa điền tên đăng nhập!");
      errorForm++;
    }
    if (password == "") {
      req.flash("passwordError", "Bạn chưa đặt mật khẩu!");
      errorForm++;
    }
    if (name != "") {
      if (vnn_regex.test(name) == false) {
        req.flash("nameError", "Sai định dạng Họ và tên!");
        req.flash("nameED", name);
        errorForm++;
      } else {
        let nameED = name;
        req.flash("nameED", nameED);
      }
    }
    if (email != "") {
      const checkEmail = await Admin.findOne({ email: email });
      if (checkEmail) {
        req.flash("errorEmail", "Email đã tồn tại");
        req.flash("emailED", email);
        errorForm++;
      } else {
        if (email_regex.test(email) == false) {
          req.flash("emailError", "Sai định dạng Email!");
          req.flash("emailED", email);
          errorForm++;
        } else {
          let emailED = email;
          req.flash("emailED", emailED);
        }
      }
    }
    if (username != "") {
      const checkUsername = await Admin.findOne({ username: username });
      if (checkUsername) {
        req.flash("errorUsername", "Username đã tồn tại");
        req.flash("usernameED", username);
        errorForm++;
      } else {
        req.flash("usernameED", username);
      }
    }
    if (password != "") {
      if (vnp_regex.test(password) == false) {
        req.flash(
          "passwordError",
          "Mật khẩu tối thiểu tám ký tự, ít nhất một chữ cái, một số và một ký tự đặc biệt!"
        );
        errorForm++;
      }
    }
    if (errorForm != 0) {
      res.redirect("/add_employee");
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
        nameError: req.flash("nameError"),
        usernameError: req.flash("usernameError"),
        emailError: req.flash("emailError"),
        passwordError: req.flash("passwordError"),
        emailED: req.flash("emailED"),
        nameED: req.flash("nameED"),
        usernameED: req.flash("usernameED"),
        passwordED: req.flash("passwordED"),
        errorUsername: req.flash("errorUsername"),
        errorEmail: req.flash("errorEmail"),
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
      const orderNew = await Order.find({ orderStatus: 0 }).count();
      const orderAccept = await Order.find({ orderStatus: 1 }).count();
      const orderDone = await Order.find({ orderStatus: 3 }).count();
      const orderCancel = await Order.find({ orderStatus: 4 }).count();
      res.render("layouts/servers/orders/all_orders", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
        orderNew: orderNew,
        orderAccept: orderAccept,
        orderDone: orderDone,
        orderCancel: orderCancel,
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

app.get("/order_detail/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.findOne({ _id: req.params.id }).populate(
        "items.productID"
      );
      let code = data.couponCode;
      if (code == "Không") {
        let money = 0;
        let couponValue = 0;
        let couponType = 0;
        data.items.forEach(function (pid) {
          money += pid.productID.priceOut * pid.quantity;
        });
        res.render("layouts/servers/orders/order_detail", {
          fullname: req.session.fullname,
          admin_id: req.session.admin_id,
          admin_role: req.session.admin_role,
          danhsach: data,
          VND,
          money,
          couponValue,
          couponType,
        });
      } else if (code != "Không") {
        let coupon = await Coupon.findOne({ couponCode: code });
        let couponValue = coupon.couponValue;
        let couponType = coupon.couponType;
        let money = 0;
        data.items.forEach(function (pid) {
          money += pid.productID.priceOut * pid.quantity;
        });
        res.render("layouts/servers/orders/order_detail", {
          fullname: req.session.fullname,
          admin_id: req.session.admin_id,
          admin_role: req.session.admin_role,
          danhsach: data,
          VND,
          money,
          couponValue,
          couponType,
        });
      }
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/accept_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find({ orderStatus: 1 }).populate("userID");
      res.render("layouts/servers/orders/accept_orders", {
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

app.get("/done_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find({ orderStatus: 3 }).populate("userID");
      res.render("layouts/servers/orders/done_orders", {
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

app.get("/cancel_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find({ orderStatus: 4 }).populate("userID");
      res.render("layouts/servers/orders/cancel_orders", {
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

app.post("/update_status/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      await Order.updateOne({ _id: req.params.id }, { orderStatus: 1 });
      res.redirect("/all_orders");
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/update_status_1/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      await Order.updateOne({ _id: req.params.id }, { orderStatus: 2 });
      res.redirect("/all_orders");
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/admin_cancel_order/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      await Order.updateOne(
        { _id: req.params.id },
        {
          $set: {
            orderStatus: 4,
            cancelReason: req.body.cancelReason,
            cancelFrom: "Admin",
            timeOut: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
          },
        }
      );
      let data = await Order.findOne({ _id: req.params.id });
      if (data.items.length == 1) {
        data.items.forEach(async function (id) {
          let qty = id.quantity;
          let pid = id._id;
          await Product.updateOne(
            { _id: pid },
            { $inc: { productQuantity: qty } }
          );
        });
      } else if (data.items.length > 1) {
        let arrayQ = [];
        let arrayP = [];
        data.items.forEach(async function (id) {
          let qty = id.quantity;
          let pid = id._id;
          arrayQ.push(qty);
          arrayP.push(pid);
        });
        for (let i = 0; i < arrayP.length; i++) {
          await Product.updateMany(
            { _id: arrayP[i] },
            { $inc: { productQuantity: arrayQ[i] } }
          );
        }
      }
      res.redirect("/all_orders");
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang tổng doanh thu theo ngày
app.get("/sales", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      let data = await Order.find({ time: time });
      let money = 0;
      for (let i = 0; i < data.length; i++) {
        money += data[i].total;
      }

      res.render("layouts/servers/sales/sales", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
        money,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang số lượng bán ra theo ngày
app.get("/sales_daily", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
      let data = await Order.aggregate([
        { $match: { time: time } },
        {
          $unwind: "$items",
        },
        {
          $unwind: "$items._id",
        },
        {
          $group: {
            _id: "$items._id",
            totalCount: {
              $sum: "$items.quantity",
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productList",
          },
        },
      ]);
      res.render("layouts/servers/sales/sales_daily", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        time,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang chi tiết danh sách bán hàng
app.get("/sales_detail/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.findOne({ _id: req.params.id }).populate(
        "items.productID"
      );
      let code = data.couponCode;
      if (code == "Không") {
        let money = 0;
        let couponValue = 0;
        let couponType = 0;
        data.items.forEach(function (pid) {
          money += pid.productID.priceOut * pid.quantity;
        });
        res.render("layouts/servers/sales/sales_detail", {
          fullname: req.session.fullname,
          admin_id: req.session.admin_id,
          admin_role: req.session.admin_role,
          danhsach: data,
          VND,
          money,
          couponValue,
          couponType,
        });
      } else if (code != "Không") {
        let coupon = await Coupon.findOne({ couponCode: code });
        let couponValue = coupon.couponValue;
        let couponType = coupon.couponType;
        let money = 0;
        data.items.forEach(function (pid) {
          money += pid.productID.priceOut * pid.quantity;
        });
        res.render("layouts/servers/sales/sales_detail", {
          fullname: req.session.fullname,
          admin_id: req.session.admin_id,
          admin_role: req.session.admin_role,
          danhsach: data,
          VND,
          money,
          couponValue,
          couponType,
        });
      }
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

app.get("/sale_history/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      const data = await Order.find(
        {
          $and: [{ orderStatus: { $lt: 4 } }, { "items._id": req.params.id }],
        },
        { "items.$": 1 }
      );
      const name = await Order.findOne(
        { "items._id": req.params.id },
        { "items.$": 1 }
      ).populate("items.productID");
      res.render("layouts/servers/warehouse/sale_history", {
        fullname: req.session.fullname,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        name,
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

app.post("/save_warehouse", async (req, res) => {
  if (req.session.daDangNhap) {
    var warehouse = Warehouse({
      productID: req.body.productID,
      quantityIn: req.body.quantityIn,
      created_by: req.session.admin_id,
      created_date: moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("DD/MM/YYYY hh:mm a"),
    });
    await Product.updateOne(
      { _id: req.body.productID },
      { $inc: { productQuantity: req.body.quantityIn } }
    );
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
        couponValue: req.body.couponValue,
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
        couponValue: req.body.couponValue,
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
            created_date: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
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
            updated_date: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
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
              updated_date: moment
                .tz(Date.now(), "Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY hh:mm a"),
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
