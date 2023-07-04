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
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const Swal = require('sweetalert2');

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

//Mail

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "lam3531xyz@gmail.com",
    pass: "bwlzpnogtfovacqx",
  },
});

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
const Password = require("./models/password.js");
const Comment = require("./models/comment.js")


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

var avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/avatars");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var avatarUpload = multer({
  storage: avatarStorage,
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
}).single("avatar");

//body-parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

//Random code
function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

//Client
//Đăng nhập đăng ký tài khoản
app.get("/login", (req, res) => {
  if (req.session.guest) {
    res.redirect("/");
  } else {
    res.render("layouts/clients/form/login", {
      userid: 1,
      fullname: 1,
      cart: 0,
      error: req.flash("error"),
      errorEmail: req.flash("errorEmail"),
      errorPassword: req.flash("errorPassword"),
      avatar: "user (2).png",
    });
  }
});

app.get("/signup", (req, res) => {
  if (req.session.guest) {
    res.redirect("/");
  } else {
    res.render("layouts/clients/form/signup", {
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
      avatar: "user (2).png",
    });
  }
});

app.post("/save", async (req, res) => {
  var box = req.body.checkbox;
  var name = req.body.fullname;
  var email = req.body.email;
  var username = req.body.username;
  var mobile = req.body.phone;
  var password = req.body.password;
  var password2 = req.body.password2;
  var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var vnn_regex =
    /^[a-zA-Z'-'\saAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ]*$/g;
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
      req.flash("nameED", "");
      req.flash("mobileED", "");
      req.flash("emailED", "");
      req.flash("usernameED", "");
      req.flash("passwordED", "");
      req.flash("password2ED", "");
      res.redirect("/success-signup");
    });
  }
});

// Trang đăng ký thành công
app.get("/success-signup", (req, res) => {
  if (req.session.guest) {
    req.session.destroy();
    res.render("layouts/clients/form/success_signup", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  } else {
    res.render("layouts/clients/form/success_signup", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

//Xử lý đăng nhập
app.post("/login", async (req, res) => {
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

//Quên mật khẩu
app.get("/forget", (req, res) => {
  if (req.session.guest) {
    res.redirect("/");
  } else {
    res.render("layouts/clients/password/forget", {
      userid: 1,
      fullname: 1,
      cart: 0,
      error: req.flash("error"),
      errorEmail: req.flash("errorEmail"),
      timeOut: req.flash("timeOut"),
      done: req.flash("done"),
      avatar: "user (2).png",
    });
  }
});

app.post("/requestPasswordReset", async (req, res) => {
  let errorEmail = req.body.email;
  let email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let e = 0;
  let timeIn = moment
    .tz(Date.now(), "Asia/Ho_Chi_Minh")
    .format("DD/MM/YYYY hh:mm a");
  let timeOut = moment
    .tz(Date.now(), "Asia/Ho_Chi_Minh")
    .add(15, 'minutes')
    .format("DD/MM/YYYY hh:mm a");
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
        let resetString = makeid(10);
        await Password.deleteMany({ userID: user._id });
        await transporter.sendMail({
          from: "lam3531xyz@gmail.com",
          to: errorEmail,
          subject: "Khôi phục mật khẩu tài khoản website GAMING STORE",
          html: `<p>Nhấn vào <a href=${
            "http://localhost:3000/changePassword/" + user._id
          }>đường dẫn này</a> để khôi phục lại mật khẩu.</p><p>Đường dẫn sẽ <b>hết hạn trong 15 phút!</b></p><p>Mã thay đổi: ${resetString}</p>`,
        });
        const newPasswordReset = new Password({
          userID: user._id,
          resetString: resetString,
          start_date: timeIn,
          end_date: timeOut,
        });
        await newPasswordReset.save();
        res.redirect("/doneRequest");
      } else {
        req.flash("error", "Tài khoản không tồn tại");
        req.flash("errorEmail", errorEmail);
        e++;
      }
    }
  }
  if (e != 0) {
    res.redirect("/forget");
  }
});

app.get("/doneRequest", (req, res) => {
  if (req.session.guest) {
    res.redirect("/");
  } else {
    res.render("layouts/clients/password/done", {
      userid: 1,
      fullname: 1,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/changePassword/:id", async (req, res) => {
  if (req.session.guest) {
    res.redirect("/");
  } else {
    let check = await Password.findOne({ userID: req.params.id });
    let timeNow = moment
      .tz(Date.now(), "Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY hh:mm a");
    let timeOut = check.end_date;
    let e = 0;
    if (timeNow >= timeOut) {
      e++;
      req.flash("timeOut", "Đường dẫn đã hết hạn!");
    } else {
      res.render("layouts/clients/password/change", {
        userid: 1,
        fullname: 1,
        cart: 0,
        danhsach: check,
        passwordError: req.flash("passwordError"),
        passwordED: req.flash("passwordED"),
        password2ED: req.flash("password2ED"),
        codeError: req.flash("codeError"),
        codeED: req.flash("codeED"),
        avatar: "user (2).png",
      });
    }
    if (e != 0) {
      res.redirect("/forget");
    }
  }
});

app.post("/saveNewPassword", async (req, res) => {
  var userid = req.body.userid;
  var code = req.body.code;
  var password = req.body.password;
  var password2 = req.body.password2;
  var vnp_regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/gm;
  let errorForm = 0;

  if (code == "") {
    req.flash("codeError", "Bạn chưa điền mã xác nhận!");
    errorForm++;
  } else {
    let check = await Password.findOne({ resetString: code });
    if (!check) {
      req.flash("codeError", "Mã xác nhận không đúng!");
      errorForm++;
      req.flash("codeED", code);
    } else {
      req.flash("codeED", code);
    }
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
          await User.updateOne(
            { _id: userid },
            { $set: { password: password } }
          );
          await Password.deleteMany({ userID: userid });
          req.flash("passwordED", "");
          req.flash("codeED", "");
          res.redirect("/success-changepwd");
        }
      }
    }
  }
  if (errorForm != 0) {
    res.redirect("/changePassword/" + userid);
  }
});

app.get("/success-changepwd", (req, res) => {
  if (req.session.guest) {
    req.session.destroy();
    res.render("layouts/clients/password/success_changepwd", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  } else {
    res.render("layouts/clients/password/success_changepwd", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

//Đăng xuất
app.get("/logout", (req, res) => {
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
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    let data = await Product.find({
      $or: [{ productStatus: 0 }, { productStatus: 1 }],
    })
      .populate("categoryID")
      .populate("producerID");
    res.render("layouts/clients/home", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: req.session.cart,
      tintuc: news,
      avatar: avatar,
    });
  } else {
    const news = await News.find({
      $or: [{ newsStatus: 0 }, { newsStatus: 1 }],
    });
    let data = await Product.find({
      $or: [{ productStatus: 0 }, { productStatus: 1 }],
    })
      .populate("categoryID")
      .populate("producerID");
    res.render("layouts/clients/home", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: 0,
      tintuc: news,
      avatar: "user (2).png",
    });
  }
});

//Trang giới thiệu, tin tức, tuyển dụng, hỗ trợ
app.get("/about", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/about", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/about", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/privacy_policy", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/privacy_policy", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/privacy_policy", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/terms_of_service", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/terms_of_service", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/terms_of_service", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/news", async (req, res) => {
  let data = await News.find().populate("newsProduct");
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/news/news", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/news/news", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      danhsach: data,
      avatar: "user (2).png",
    });
  }
});

app.get("/news/:id", async (req, res) => {
  let data = await News.find({ _id: req.params.id }).populate("newsProduct");
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/news/news_detail", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/news/news_detail", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      danhsach: data,
      avatar: "user (2).png",
    });
  }
});

app.get("/hiring", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/hiring", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/hiring", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/support", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/support", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/support", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/hotline", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/hotline", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/hotline", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

app.get("/customer_care", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/customer_care", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.render("layouts/clients/main/customer_care", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

//Trang profile, lịch sử đơn hàng, mật khẩu
app.get("/profile/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/profile", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/saveAvatar", async (req, res) => {
  if (req.session.guest) {
    let userid = req.session.userid;
    avatarUpload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        req.flash("error", "Lỗi Multer khi upload ảnh");
      } else if (err) {
        req.flash("error", "Lỗi bất ngờ xảy ra");
      } else {
        await User.updateOne({_id:userid},{$set:{avatar:req.file.filename}});
        req.flash("success", "Thêm thành công");
        res.redirect("/profile/"+userid);
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/orders/:id", async (req, res) => {
  if (req.session.guest) {
    let data = await Order.find({ userID: req.session.userid });
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/order/orders", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      VND,
      avatar: avatar,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/password/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/password/password", {
      fullname: req.session.fullname,
      email: req.session.email,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      passwordError: req.flash("passwordError"),
      password1Error: req.flash("password1Error"),
      passwordED: req.flash("passwordED"),
      password1ED: req.flash("password1ED"),
      avatar: avatar,
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/changePasswordNew", async (req, res) => {
  var userid = req.body.userid;
  var password1 = req.body.password1;
  var password = req.body.password;
  var password2 = req.body.password2;
  var vnp_regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/gm;
  let errorForm = 0;

  if (password1 == "") {
    req.flash("password1Error", "Bạn cần nhập mật khẩu cũ!");
    errorForm++;
  }
  if (password1 != "") {
    let check = await User.findOne({ _id: userid });
    let pcheck = check.password;
    if (password1 != pcheck) {
      req.flash("password1Error", "Mật khẩu cũ sai!");
      errorForm++;
    } else {
      req.flash("password1ED", password1);
    }
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
          await User.updateOne(
            { _id: userid },
            { $set: { password: password } }
          );
          req.flash("passwordED", "");
          req.session.destroy();
          res.redirect("/success-changepwd");
        }
      }
    }
  }
  if (errorForm != 0) {
    res.redirect("/password/" + userid);
  }
});

//Trang chi tiết lịch sử đơn hàng
app.get("/orders_detail/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
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
      res.render("layouts/clients/order/orders_detail", {
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
        avatar: avatar,
      });
    } else if (code != "Không") {
      let coupon = await Coupon.findOne({ couponCode: code });
      let couponValue = coupon.couponValue;
      let couponType = coupon.couponType;
      let money = 0;
      data.items.forEach(function (pid) {
        money += pid.productID.priceOut * pid.quantity;
      });

      res.render("layouts/clients/order/orders_detail", {
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
        avatar: avatar,
      });
    }
  } else {
    res.redirect("/login");
  }
});

//Trang giỏ hàng và thanh toán và trang thông báo đặt hàng thành công
app.get("/cart/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
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
    let data = await Cart.find({ userID: new mongoose.Types.ObjectId(req.session.userid) })
      .populate("items.productID");
    let money = 0;
    for (let i = 0; i < data.length; i++) {
      data[i].items.forEach(function (pid) {
        money += pid.productID.priceOut * parseInt(pid.quantity);
      });
    }
    res.render("layouts/clients/cart/cart", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: req.session.cart,
      carti,
      money,
      avatar: avatar,
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/add_to_cart", async (req, res) => {
  if(req.session.guest){
    const productId = req.body.product_id_hidden;
    const quantity = parseInt(req.body.quantity);
    const convert = req.body.quantity;
    const uid = req.body.user_id_hidden;
    const qty = await Product.findOne({ _id: productId });
    let cartE = await Cart.find({ userID: req.body.user_id_hidden });
    if (cartE[0]) {
      const isE = cartE[0].items.findIndex((item) => {
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
        if (cartE[0].items[isE].quantity == qty.productQuantity) {
          req.flash("error", "Số lượng của sản phẩm trong giỏ đã đầy");
        } else if (quantity + cartE[0].items[isE].quantity > qty.productQuantity) {
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
      req.flash("add", "Thêm vào giỏ thành công");
      res.redirect("/product/"+productId);
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
      await cartData.save();
      req.flash("add", "Thêm vào giỏ thành công");
      res.redirect("/product/"+productId);
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/update_quantity_cart", async (req, res) => {
  if(req.session.guest){
  const uid = req.session.userid;
  var productId = req.body.product_id_hidden;
  var quantity = req.body.quantity;
  const data = collect(productId);
  const total = data.count();
  if(total == 1){
    await Cart.updateOne(
      {
        userID: uid,
        items: { $elemMatch: { _id: productId } },
      },
      { "items.$.quantity": quantity }
    );
  } else {
    for (let i = 0; i < productId.length; i++) {
      await Cart.updateOne(
        {
          userID: uid,
          items: { $elemMatch: { _id: productId[i] } },
        },
        { "items.$.quantity": quantity[i] }
      );
    }
  }
  res.redirect("/cart/" + uid);
  } else {
    res.redirect("/login");
  }
});

app.get("/delete_cart_items/:id", async (req, res) => {
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
          res.redirect("/cart/" + uid);
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
          res.redirect("/cart/" + uid);
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/checkout/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
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
        res.render("layouts/clients/cart/checkout", {
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
          avatar: avatar,
        });
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/add_coupon_checkout", async (req, res) => {
  if (req.session.guest) {
    let uid = req.session.userid;
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
    res.redirect("/checkout/" + uid);
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
    /^[a-zA-Z'-'\saAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ]*$/g;
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
    res.redirect("/checkout/" + uid);
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
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/cart/success", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/get_order/:id", async (req, res) => {
  if (req.session.guest) {
    let uid = req.session.userid;
    await Order.updateOne(
      { _id: req.params.id },
      {
        $set: {
          orderStatus: 3,
          timeOut: moment
            .tz(Date.now(), "Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY hh:mm a"),
          time: moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY"),
          month: moment.tz(Date.now(), "Asia/Ho_Chi_Minh").month(),
        },
      }
    );
    let data = await Order.findOne({_id: req.params.id});
    let array = [];
    data.items.forEach(function(id){
      array.push(id.productID);
    });
    let length = array.length;
    if(length == 1){
      await Product.updateOne(
        { _id: array },
        { $addToSet: { userID: uid } }
      );
    } else {
      for (let i = 0; i < array.length; i++) {
        await Product.updateMany(
          { _id: array[i] },
          { $addToSet: { userID: uid } }
        );
      }
    }
    res.redirect("/orders/" + uid);
  } else {
    res.redirect("/login");
  }
});

app.post("/cancel_order/:id", async (req, res) => {
  if (req.session.guest) {
    let uid = req.session.userid;
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
    res.redirect("/orders/" + uid);
  } else {
    res.redirect("/login");
  }
});

//Trang tìm kiếm
app.get("/search", async (req, res) => {
  let kw = req.query.kw;
  if (req.session.guest) {
    let data = await Product.find({
      productName: { $regex: ".*" + kw + ".*", $options: "i" },
    });
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/search", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: req.session.cart,
      avatar: avatar,
    });
  } else {
    let data = await Product.find({
      productName: { $regex: ".*" + kw + ".*", $options: "i" },
    });
    res.render("layouts/clients/main/search", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: 0,
      avatar: "user (2).png",
    });
  }
});

//Trang tất cả các sản phẩm
app.get("/all_product", async (req, res) => {
  var page= req.query.page;
  if(page){
    page=parseInt(page);
    if(page < 1) {
      page = 1 
    } 
  }

  const limit = 4;
  
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    let data = await Product.find({
      $or: [{ productStatus: 0 }, { productStatus: 1 }],
    })
      .limit(limit*1)
      .skip((page-1) *limit)
      .populate("categoryID")
      .populate("producerID")
      .exec();

      let count = await Product.find({
        $or: [{ productStatus: 0 }, { productStatus: 1 }],
      })
      .countDocuments();   
    res.render("layouts/clients/main/all_product", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: req.session.cart,
      totalPages: Math.ceil(count/limit),
      currentPage: page,
      prevPage: page - 1,
      nextPage: page + 1,
      avatar: avatar,
    });
  } else {
    let data = await Product.find({
      $or: [{ productStatus: 0 }, { productStatus: 1 }],
    }).limit(limit*1)
      .skip((page-1) *limit)
      .populate("categoryID")
      .populate("producerID")
      .exec();
     
      
    let count = await Product.find({
      $or: [{ productStatus: 0 }, { productStatus: 1 }],
    })
      .countDocuments();   
    res.render("layouts/clients/main/all_product", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: 0,
      totalPages: Math.ceil(count/limit),
      currentPage: page,
      prevPage: page - 1,
      nextPage: page + 1,
      avatar: "user (2).png",
    });
  }
});

//Trang chi tiết sản phẩm
app.get("/product/:id", async (req, res) => {
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
    let product = await Product.findOne({ _id: req.params.id });
    let comments = await Comment.find({productID: new mongoose.Types.ObjectId(req.params.id)})
      .populate("userID");
    let pname = product.productName;
    let data = await Product.findOne({ _id: req.params.id })
      .populate("categoryID")
      .populate("producerID");
    let check = await Product.findOne({$and:[{_id: req.params.id},{userID:req.session.userid}]});
    let random = 0;
    if(check){
      random++;
    }
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    res.render("layouts/clients/main/product", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      danhsach: data,
      cart: req.session.cart,
      VND,
      pname,
      comments,
      add: req.flash("add"),
      random,
      avatar: avatar,
    });
  } else {
    let product = await Product.findOne({ _id: req.params.id });
    let pname = product.productName;
    let data = await Product.findOne({ _id: req.params.id })
      .populate("categoryID")
      .populate("producerID");
    res.render("layouts/clients/main/product", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      danhsach: data,
      VND,
      cart: 0,
      pname,
      add: req.flash("add"),
      avatar: "user (2).png",
    });
  }
});

//Bình luận sản phẩm
app.post("/comment", async (req, res) => {
  if (req.session.guest) {
    let pid = req.body.productID;
    let uid = req.body.userID;
    let check = Product.find({$and:[{_id:pid},{userID:uid}]});
    if(check){
      var comment = Comment({ 
        productID: pid,
        userID: uid,
        commentInfo: req.body.commentInfo,
        commentStatus: 1,
        commentDate: moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("DD/MM/YYYY hh:mm a"),
      });
      comment.save();
      res.redirect("/product/"+pid);
    } else {
      res.redirect("/product/"+pid);
    }
  } else {
    res.redirect("/login");
  }
});

//Trang danh mục theo NSX
app.get("/producer/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    let data = await Product.find({
      producerID: new mongoose.Types.ObjectId(req.params.id)
    });
    let producer = await Producer.findOne({_id: new mongoose.Types.ObjectId(req.params.id)});
    let title = producer.producerName;
    let id = producer._id;
    res.render("layouts/clients/producer/producer", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      VND,
      title,
      id,
      avatar: avatar,
    });
  } else {
    let data = await Product.find({
      producerID: new mongoose.Types.ObjectId(req.params.id)
    });
    let producer = await Producer.findOne({_id: new mongoose.Types.ObjectId(req.params.id)});
    let title = producer.producerName;
    let id = producer._id;
    res.render("layouts/clients/producer/producer", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      danhsach: data,
      VND,
      title,
      id,
      avatar: "user (2).png",
    });
  }
});

//Trang category
app.get("/category/:id", async (req, res) => {
  if (req.session.guest) {
    let user = await User.findOne({_id:req.session.userid});
    let avatar = "user (2).png";
    if(user.avatar){
      avatar = user.avatar;
    };
    let data = await Product.find({
      categoryID: new mongoose.Types.ObjectId(req.params.id)
    });
    let category = await Category.findOne({_id: new mongoose.Types.ObjectId(req.params.id)});
    let title = category.categoryName;
    let id = category._id;
    res.render("layouts/clients/category/category", {
      fullname: req.session.fullname,
      userid: req.session.userid,
      sID: req.session.sessionID,
      cart: req.session.cart,
      danhsach: data,
      VND,
      title,
      id,
      avatar: avatar,
    });
  } else {
    let data = await Product.find({
      categoryID: new mongoose.Types.ObjectId(req.params.id)
    });
    let category = await Category.findOne({_id: new mongoose.Types.ObjectId(req.params.id)});
    let title = category.categoryName;
    let id = category._id;
    res.render("layouts/clients/category/category", {
      fullname: 1,
      userid: 1,
      sID: req.session.sessionID,
      cart: 0,
      danhsach: data,
      VND,
      title,
      id,
      avatar: "user (2).png",
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
app.post("/admin_login", async (req, res) => {
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
            sess.adminName = admin.fullname;
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
app.get("/admin_logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin_login");
});

//Trang home admin
app.get("/admin_home", async (req, res) => {
  if (req.session.daDangNhap) {
    const order = await Order.find({ orderStatus: 0 }).count();
    const customer = await User.find().count();
    const employee = await Admin.find().count();

    let outOfStock = await Product.find({productQuantity:{$lte:20}});
    
    let limit = await Order.aggregate([
      { $match: { orderStatus: 3 } },
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
    ]);
    let sum = 0;
    for(let i = 0; i<limit.length; i++){
      sum += limit[i].totalCount;
    }
    let tb = sum/(limit.length);
    let bestSale = await Order.aggregate([
      { $match: { orderStatus: 3 } },
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
      {$match:{"totalCount":{$gt:tb}}},
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productList",
        },
      },
      { $limit : 5 },
    ]).sort({"totalCount":-1});

    // let data1 = await Order.find({ month: 0 }).populate("items.productID"); let money1 = 0;
    // let data2 = await Order.find({ month: 1 }).populate("items.productID"); let money2 = 0;
    // let data3 = await Order.find({ month: 2 }).populate("items.productID"); let money3 = 0;
    // let data4 = await Order.find({ month: 3 }).populate("items.productID"); let money4 = 0;
    // let data5 = await Order.find({ month: 4 }).populate("items.productID"); let money5 = 0;
    // let data6 = await Order.find({ month: 5 }).populate("items.productID"); let money6 = 0;
    // let data7 = await Order.find({ month: 6 }).populate("items.productID"); let money7 = 0;
    // let data8 = await Order.find({ month: 7 }).populate("items.productID"); let money8 = 0;
    // let data9 = await Order.find({ month: 8 }).populate("items.productID"); let money9 = 0;
    // let data10 = await Order.find({ month: 9 }).populate("items.productID");  let money10 = 0;
    // let data11 = await Order.find({ month: 10 }).populate("items.productID"); let money11 = 0;
    // let data12 = await Order.find({ month: 11 }).populate("items.productID"); let money12 = 0;

    // for(let i = 0; i < data1.length; i++){
    //   data1[i].items.forEach(function(id){
    //     money1 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data1[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data2.length; i++){
    //   data2[i].items.forEach(function(id){
    //     money2 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data2[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data3.length; i++){
    //   data3[i].items.forEach(function(id){
    //     money3 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data3[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data4.length; i++){
    //   data4[i].items.forEach(function(id){
    //     money4 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data4[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data5.length; i++){
    //   data5[i].items.forEach(function(id){
    //     money5 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data5[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data6.length; i++){
    //   data6[i].items.forEach(function(id){
    //     money6 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data6[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data7.length; i++){
    //   data7[i].items.forEach(function(id){
    //     money7 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data7[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data8.length; i++){
    //   data8[i].items.forEach(function(id){
    //     money8 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data8[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data9.length; i++){
    //   data9[i].items.forEach(function(id){
    //     money9 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data9[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data9.length; i++){
    //   data9[i].items.forEach(function(id){
    //     money9 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data9[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data10.length; i++){
    //   data10[i].items.forEach(function(id){
    //     money10 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data10[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data11.length; i++){
    //   data11[i].items.forEach(function(id){
    //     money11 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data11[i].shippingFee);
    //   });
    // };
    // for(let i = 0; i < data12.length; i++){
    //   data12[i].items.forEach(function(id){
    //     money12 += (id.quantity * (id.productID.priceOut - id.productID.priceIn)+data12[i].shippingFee);
    //   });
    // };

    res.render("layouts/servers/home", {
      adminName: req.session.adminName,
      number: customer,
      numberal: employee,
      order: order,
      admin_id: req.session.admin_id,
      admin_role: req.session.admin_role,
      VND,
      // money1,
      // money2,
      // money3,
      // money4,
      // money5,
      // money6,
      // money7,
      // money8,
      // money9,
      // money10,
      // money11,
      // money12,
      bestSale,
      outOfStock,
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/categories_save", async (req, res) => {
  if (req.session.daDangNhap) {
    var check = await Category.findOne({ categoryName: req.body.categoryName });
    if (check) {
      req.flash("error", "Thể loại đã tồn tại");
      res.redirect("/admin_categories");
    } else {
      await Category({
        categoryName: req.body.categoryName,
      }).save();
      req.flash("success", "Thêm thành công");
      res.redirect("/admin_categories");
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
        adminName: req.session.adminName,
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

app.post("/edit_categories_save", async (req, res) => {
  if (req.session.daDangNhap) {
    var check = await Category.findOne({ categoryName: req.body.categoryName });
    if (check) {
      req.flash("error", "Sửa không thành công");
      res.redirect("/admin_categories");
    } else {
      await Category.updateOne(
        { _id: req.body.categoryId },
        {
          categoryName: req.body.categoryName,
        }
      );
      req.flash("success", "Sửa thành công");
      res.redirect("/admin_categories");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_categories/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    await Category.deleteOne({ _id: req.params.id });
    req.flash("success", "Xoá thành công");
    res.redirect("/admin_categories");
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/producers_save", async (req, res) => {
  if (req.session.daDangNhap) {
    var check = await Producer.findOne({ producerName: req.body.producerName });
    if (check) {
      req.flash("error", "NSX đã tồn tại");
      res.redirect("/admin_producers");
    } else {
      await Producer({
        producerName: req.body.producerName,
      }).save();
      req.flash("success", "Thêm thành công");
      res.redirect("/admin_producers");
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
        adminName: req.session.adminName,
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

app.post("/edit_producers_save", async (req, res) => {
  if (req.session.daDangNhap) {
    var check = await Producer.findOne({ producerName: req.body.producerName });
    if (check) {
      req.flash("error", "Sửa không thành công");
      res.redirect("/admin_producers");
    } else {
      await Producer.updateOne(
        { _id: req.body.producerId },
        {
          producerName: req.body.producerName,
        }
      );
      req.flash("success", "Sửa thành công");
      res.redirect("/admin_producers");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete_producers/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    await Producer.deleteOne({ _id: req.params.id });
    req.flash("success", "Xoá thành công");
    res.redirect("/admin_producers");
  } else {
    res.redirect("/admin_login");
  }
});

//Trang sản phẩm
app.get("/admin_product", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let data = await Product.find()
        .populate("categoryID")
        .populate("producerID");
      res.render("layouts/servers/product/product", {
        adminName: req.session.adminName,
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

app.get("/admin_product/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 1) {
      let product = await Product.findOne({ _id: req.params.id });
      let prname = product.productName;
      let data = await Product.findOne({ _id: req.params.id })
        .populate("categoryID")
        .populate("producerID");
      res.render("layouts/servers/product/product_detail", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
        VND,
        prname,
        admin_role: req.session.admin_role,
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
        adminName: req.session.adminName,
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
        let check = await Product.findOne({ productName: req.body.productName });
        if (check) {
          req.flash("error", "Sản phẩm đã tồn tại");
          res.redirect("/admin_product");
        } else {
          await Product({
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            productImage: req.file.filename,
            categoryID: req.body.categoryID,
            producerID: req.body.producerID,
            priceIn: req.body.priceIn,
            priceOut: req.body.priceOut,
            productStatus: req.body.productStatus,
            productQuantity: 0,
            created_date: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
            created_by: req.session.adminName,
          }).save();
          req.flash("success", "Thêm thành công");
          res.redirect("/admin_product");
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
      let data = await Product.findById(req.params.id)
        .populate("categoryID")
        .populate("producerID");
      res.render("layouts/servers/product/edit_product", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
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

app.post("/edit_product_save", async (req, res) => {
  if (req.session.daDangNhap) {
    let check = await Product.findOne({ productName: req.body.productName });
    if (check) {
      req.flash("error", "Sản phẩm đã tồn tại");
      res.redirect("/admin_product");
    } else {
      upload(req, res, async function (err) {
        //Không chọn file mới
        if (!req.file) {
          await Product.updateOne(
            { _id: req.body.productId },
            {
              productName: req.body.productName,
              productDescription: req.body.productDescription,
              categoryID: req.body.categoryID,
              producerID: req.body.producerID,
              priceIn: req.body.priceIn,
              priceOut: req.body.priceOut,
              productStatus: req.body.productStatus,
              updated_by: req.session.adminName,
              updated_date: moment
                .tz(Date.now(), "Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY hh:mm a"),
            }
          );
          req.flash("success", "Sửa thành công");
          res.redirect("/admin_product");
          // Chọn file mới
        } else {
          if (err instanceof multer.MulterError) {
            req.flash("error", "Lỗi Multer khi upload ảnh");
          } else if (err) {
            req.flash("error", "Lỗi bất ngờ xảy ra");
          } else {
            await Product.updateOne(
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
                updated_by: req.session.adminName,
                updated_date: moment
                  .tz(Date.now(), "Asia/Ho_Chi_Minh")
                  .format("DD/MM/YYYY hh:mm a"),
              }
            );
            req.flash("success", "Sửa thành công");
            res.redirect("/admin_product");
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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
      adminName: req.session.adminName,
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
      adminName: req.session.adminName,
      admin_id: req.session.admin_id,
      nhanvat: data,
      admin_role: req.session.admin_role,
      passwordError: req.flash("passwordError"),
      password1Error: req.flash("password1Error"),
      passwordED: req.flash("passwordED"),
      password1ED: req.flash("password1ED"),
    });
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/add_employee", (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      res.render("layouts/servers/employee/add_employee", {
        adminName: req.session.adminName,
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

app.post("/admin_save", async (req, res) => {
  if (req.session.daDangNhap) {
    var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var vnn_regex =
      /^[a-zA-Z'-'\saAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ]*$/g;
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
      await Admin({
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        role: req.body.role,
        status: req.body.status,
      }).save();
      req.flash("success", "Thêm thành công");
      res.redirect("/employees");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/edit/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Admin.findById(req.params.id);
      res.render("layouts/servers/employee/edit_employee", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        nhanvat: data,
        admin_role: req.session.admin_role,
        nameError: req.flash("nameError"),
        usernameError: req.flash("usernameError"),
        emailError: req.flash("emailError"),
        emailED: req.flash("emailED"),
        nameED: req.flash("nameED"),
        usernameED: req.flash("usernameED"),
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

app.post("/edit_save", async (req, res) => {
  if (req.session.daDangNhap) {
    let id = req.body.id;
    var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var vnn_regex =
      /^[a-zA-Z'-'\saAàÀảẢãÃáÁạẠăĂằẰẳẲẵẴắẮặẶâÂầẦẩẨẫẪấẤậẬbBcCdDđĐeEèÈẻẺẽẼéÉẹẸêÊềỀểỂễỄếẾệỆfFgGhHiIìÌỉỈĩĨíÍịỊjJkKlLmMnNoOòÒỏỎõÕóÓọỌôÔồỒổỔỗỖốỐộỘơƠờỜởỞỡỠớỚợỢpPqQrRsStTuUùÙủỦũŨúÚụỤưƯừỪửỬữỮứỨựỰvVwWxXyYỳỲỷỶỹỸýÝỵỴzZ]*$/g;
    let errorForm = 0;
    var name = req.body.fullname;
    var email = req.body.email;
    var username = req.body.username;
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
    if (errorForm != 0) {
      res.redirect("/edit/" + id);
    } else {
      await Admin.updateOne(
        { _id: req.body.id },
        {
          fullname: req.body.fullname,
          email: req.body.email,
          username: req.body.username,
          role: req.body.role,
          status: req.body.status,
        }
      );
      req.flash("success", "Sửa thành công");
      res.redirect("/employees");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.get("/delete/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    await Admin.deleteOne({ _id: req.params.id });
    req.flash("success", "Xoá thành công");
    res.redirect("/employees");
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/adminSaveNewPw", async (req, res) => {
  var adminid = req.session.admin_id;
  var password1 = req.body.password1;
  var password = req.body.password;
  var password2 = req.body.password2;
  var vnp_regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/gm;
  let errorForm = 0;

  if (password1 == "") {
    req.flash("password1Error", "Bạn cần nhập mật khẩu cũ!");
    errorForm++;
  }
  if (password1 != "") {
    let check = await Admin.findOne({ _id: adminid });
    let pcheck = check.password;
    if (password1 != pcheck) {
      req.flash("password1Error", "Mật khẩu cũ sai!");
      errorForm++;
    } else {
      req.flash("password1ED", password1);
    }
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
          await Admin.updateOne(
            { _id: adminid },
            { $set: { password: password } }
          );
          req.flash("passwordED", "");
          req.session.destroy();
          res.redirect("/admin_login");
        }
      }
    }
  }
  if (errorForm != 0) {
    res.redirect("/admin_setting/" + adminid);
  }
});

//Trang quản lý đơn hàng
app.get("/all_orders", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let data = await Order.find().populate("userID").sort({"orderStatus":1,"timeIn":-1});
      const orderNew = await Order.find({ orderStatus: 0 }).count();
      const orderAccept = await Order.find({ orderStatus: 1 }).count();
      const orderVroom = await Order.find({ orderStatus: 2 }).count();
      const orderDone = await Order.find({ orderStatus: 3 }).count();
      const orderCancel = await Order.find({ orderStatus: 4 }).count();
      res.render("layouts/servers/orders/all_orders", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
        orderNew: orderNew,
        orderAccept: orderAccept,
        orderVroom: orderVroom,
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
      const order = await Order.find({ orderStatus: 0 }).count();
      res.render("layouts/servers/orders/new_orders", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
        order,
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
          adminName: req.session.adminName,
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
          adminName: req.session.adminName,
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
      const order = await Order.find({ orderStatus: 1 }).count();
      res.render("layouts/servers/orders/accept_orders", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        VND,
        order,
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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
      const order = await Order.find({ orderStatus: 2 }).count();
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

//Trang tổng doanh thu
app.get("/revenue", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let data = await Warehouse.aggregate([
        { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productList",
          },
        },
        { $sort : { total : -1 } }
      ]);
      res.render("layouts/servers/sales/revenue", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
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

//Trang doanh thu từng tháng
app.get("/monthlySale/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0) {
      let month = req.params.id;
      let data = await Order.find({ month: month }).populate("items.productID");
      let convert = parseInt(month);
      let money = 0;
      for (let i = 0; i < data.length; i++) {
        money += data[i].total;
      }
      res.render("layouts/servers/sales/monthlySale", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
        convert,
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
          adminName: req.session.adminName,
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
          adminName: req.session.adminName,
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
      let data = await Warehouse.aggregate([
        { $group: { _id: "$productID", total: { $sum: "$quantityIn" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productList",
          },
        },
      ]);
      res.render("layouts/servers/warehouse/warehouse", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
        VND,
        admin_role: req.session.admin_role,
        success: req.flash("success"),
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
      let data = await Warehouse.find({ productID: req.params.id })
        .populate("productID")
        .populate("created_by");
      res.render("layouts/servers/warehouse/list_warehouse", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        danhsach: data,
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
      let money = 0;
      for (let i = 0; i < data.length; i++) {
        data[i].items.forEach(function (id) {
          money += id.quantity;
        });
      }
      const name = await Order.findOne(
        { "items._id": req.params.id },
        { "items.$": 1 }
      ).populate("items.productID");
      res.render("layouts/servers/warehouse/sale_history", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: data,
        name,
        money,
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
      let data = await Product.find()
        .populate("categoryID")
        .populate("producerID");
        res.render("layouts/servers/warehouse/add_warehouse", {
          adminName: req.session.adminName,
          admin_id: req.session.admin_id,
          danhsach: data,
          admin_role: req.session.admin_role,
          emptyError: req.flash("emptyError"),
          quantityError: req.flash("quantityError"),
          quantityED: req.flash("quantityED"),
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
    var productId = req.body.productID;
    var quantity = req.body.quantityIn;
    const data = collect(productId);
    const total = data.count();
    if(total == 1){
      let error = 0;
      if(quantity == ""){
        req.flash("emptyError", "Vui lòng nhập số lượng!");
        error++;
      }
      if(quantity != ""){
        if(quantity <=0 || quantity > 100){
          req.flash("quantityError", "Số lượng lỗi!");
          let quantityED = quantity;
          req.flash("quantityED", quantityED);
          error++;
        }
      }
      if(error==0){
        var warehouse = Warehouse({
          productID: productId,
          quantityIn: quantity,
          created_by: req.session.admin_id,
          created_date: moment
            .tz(Date.now(), "Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY hh:mm a"),
        });
        await Product.updateOne(
          { _id: req.body.productID },
          { $inc: { productQuantity: req.body.quantityIn } }
        );
        await warehouse.save();
        req.flash("success", "Thêm thành công");
        res.redirect("/warehouse");
      } else {
        res.redirect("/add_warehouse");
      }
    } else {
      let error = 0;
      for (let i = 0; i < productId.length; i++) {
        if(quantity[i] == ""){
          req.flash("emptyError", "Vui lòng nhập số lượng!");
          error++;
        }
        if(quantity[i] != ""){
          if(quantity[i] <=0 || quantity[i] > 100){
            req.flash("quantityError", "Số lượng lỗi!");
            let quantityED = quantity[i];
            req.flash("quantityED", quantityED);
            error++;
          }
        }
        if(error==0){
          var warehouse = Warehouse({
            productID: productId[i],
            quantityIn: quantity[i],
            created_by: req.session.admin_id,
            created_date: moment
              .tz(Date.now(), "Asia/Ho_Chi_Minh")
              .format("DD/MM/YYYY hh:mm a"),
          });
          await Product.updateMany(
            { _id: productId[i] },
            { $inc: { productQuantity: quantity[i] } }
          );
        }
      }
      if(error!=0){
        res.redirect("/add_warehouse");
      } else {
        await warehouse.save();
        req.flash("success", "Thêm thành công");
        res.redirect("/warehouse");
      }
    }
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/coupon_save", async (req, res) => {
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
        adminName: req.session.adminName,
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

app.post("/edit_coupon_save", async (req, res) => {
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

app.get("/delete_coupon/:id", (req, res) => {
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
        adminName: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/cities_save", async (req, res) => {
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
        adminName: req.session.adminName,
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

app.post("/edit_cities_save", async (req, res) => {
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

app.get("/delete_cities/:id", (req, res) => {
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
        adminName: req.session.adminName,
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
            adminName: req.session.adminName,
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

app.post("/news_save", async (req, res) => {
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
            created_by: req.session.adminName,
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
        adminName: req.session.adminName,
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

app.post("/edit_news_save", async (req, res) => {
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
            updated_by: req.session.adminName,
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
              updated_by: req.session.adminName,
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

app.get("/delete_news/:id", (req, res) => {
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

//Danh sách bình luận
app.get("/comment", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      let comments = await Comment.find()
      .populate("userID")
      .populate("productID");
      const notAcceptComment = await Comment.find({ commentStatus: 0 }).count();
      const acceptComment = await Comment.find({ CommentStatus:1 }).count();
      res.render("layouts/servers/comment/comment", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        VND,
        admin_role: req.session.admin_role,
        comments,
        notAcceptComment,
        acceptComment,
      });
    } else {
      res.redirect("/comment");
    }
  } else {
    res.redirect("/admin_login");
  }
});

app.post("/update_commentStatus/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      await Comment.updateOne({ _id: req.params.id }, { commentStatus: 1 });
      res.redirect("/comment");
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});


app.post("/update_commentStatus_1/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 3) {
      await Comment.updateOne({ _id: req.params.id }, { commentStatus: 0 });
      res.redirect("/comment");
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang biểu đồ tổng doanh thu theo ngày
app.get("/salesbyday", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

      let timeMonday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("DD/MM/YYYY");
      let timeTuesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(2)
        .format("DD/MM/YYYY");
      let timeWednesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(3)
        .format("DD/MM/YYYY");
      let timeThursday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(4)
        .format("DD/MM/YYYY");
      let timeFriday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(5)
        .format("DD/MM/YYYY");
      let timeSaturday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(6)
        .format("DD/MM/YYYY");
      let timeSunday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("DD/MM/YYYY");

      // let startOfMonth = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").startOf('month').format('YYYY-MM-DD');

      let dateStart = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("YYYY-MM-DD");
      let dateEnd = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("YYYY-MM-DD");
      let dateNow = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");

      let dataNow = await Order.find({ time: time });

      let data1 = await Order.find({ time: timeMonday });
      let data2 = await Order.find({ time: timeTuesday });
      let data3 = await Order.find({ time: timeWednesday });
      let data4 = await Order.find({ time: timeThursday });
      let data5 = await Order.find({ time: timeFriday });
      let data6 = await Order.find({ time: timeSaturday });
      let data7 = await Order.find({ time: timeSunday });

      let moneyNow = 0;

      let money1 = 0;
      let money2 = 0;
      let money3 = 0;
      let money4 = 0;
      let money5 = 0;
      let money6 = 0;
      let money7 = 0;

      for (let i = 0; i < dataNow.length; i++) {
        moneyNow += dataNow[i].total;
      }

      for (let i = 0; i < data1.length; i++) {
        money1 += data1[i].total;
      }

      for (let i = 0; i < data2.length; i++) {
        money2 += data2[i].total;
      }

      for (let i = 0; i < data3.length; i++) {
        money3 += data3[i].total;
      }

      for (let i = 0; i < data4.length; i++) {
        money4 += data4[i].total;
      }

      for (let i = 0; i < data5.length; i++) {
        money5 += data5[i].total;
      }

      for (let i = 0; i < data6.length; i++) {
        money6 += data6[i].total;
      }

      for (let i = 0; i < data7.length; i++) {
        money7 += data7[i].total;
      }

      res.render("layouts/servers/sales/salesbyday", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: dataNow,
        VND,
        moneyNow,
        money1,
        money2,
        money3,
        money4,
        money5,
        money6,
        money7,
        time,
        dateStart,
        dateEnd,
        dateNow,
        timeMonday,
        timeSunday,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang biểu đồ tổng doanh thu theo tuần
app.get("/sales", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

      let timeMonday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("DD/MM/YYYY");
      let timeTuesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(2)
        .format("DD/MM/YYYY");
      let timeWednesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(3)
        .format("DD/MM/YYYY");
      let timeThursday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(4)
        .format("DD/MM/YYYY");
      let timeFriday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(5)
        .format("DD/MM/YYYY");
      let timeSaturday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(6)
        .format("DD/MM/YYYY");
      let timeSunday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("DD/MM/YYYY");

      // let startOfMonth = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").startOf('month').format('YYYY-MM-DD');

      let dateStart = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("YYYY-MM-DD");
      let dateEnd = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("YYYY-MM-DD");
      let dateNow = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");

      let dataNow = await Order.find({ time: time });

      let data1 = await Order.find({ time: timeMonday });
      let data2 = await Order.find({ time: timeTuesday });
      let data3 = await Order.find({ time: timeWednesday });
      let data4 = await Order.find({ time: timeThursday });
      let data5 = await Order.find({ time: timeFriday });
      let data6 = await Order.find({ time: timeSaturday });
      let data7 = await Order.find({ time: timeSunday });

      let moneyNow = 0;

      let money1 = 0;
      let money2 = 0;
      let money3 = 0;
      let money4 = 0;
      let money5 = 0;
      let money6 = 0;
      let money7 = 0;

      for (let i = 0; i < dataNow.length; i++) {
        moneyNow += dataNow[i].total;
      }

      for (let i = 0; i < data1.length; i++) {
        money1 += data1[i].total;
      }

      for (let i = 0; i < data2.length; i++) {
        money2 += data2[i].total;
      }

      for (let i = 0; i < data3.length; i++) {
        money3 += data3[i].total;
      }

      for (let i = 0; i < data4.length; i++) {
        money4 += data4[i].total;
      }

      for (let i = 0; i < data5.length; i++) {
        money5 += data5[i].total;
      }

      for (let i = 0; i < data6.length; i++) {
        money6 += data6[i].total;
      }

      for (let i = 0; i < data7.length; i++) {
        money7 += data7[i].total;
      }

      res.render("layouts/servers/sales/sales", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: dataNow,
        VND,
        moneyNow,
        money1,
        money2,
        money3,
        money4,
        money5,
        money6,
        money7,
        time,
        dateStart,
        dateEnd,
        dateNow,
        timeMonday,
        timeSunday,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang tổng doanh thu theo tháng
app.get("/salesbymonth", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

      let timeMonday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("DD/MM/YYYY");
      let timeTuesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(2)
        .format("DD/MM/YYYY");
      let timeWednesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(3)
        .format("DD/MM/YYYY");
      let timeThursday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(4)
        .format("DD/MM/YYYY");
      let timeFriday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(5)
        .format("DD/MM/YYYY");
      let timeSaturday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(6)
        .format("DD/MM/YYYY");
      let timeSunday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("DD/MM/YYYY");

      // let startOfMonth = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").startOf('month').format('YYYY-MM-DD');

      let dateStart = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("YYYY-MM-DD");
      let dateEnd = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("YYYY-MM-DD");
      let dateNow = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");

      let dataNow = await Order.find({ time: time });

      let data1 = await Order.find({ time: timeMonday });
      let data2 = await Order.find({ time: timeTuesday });
      let data3 = await Order.find({ time: timeWednesday });
      let data4 = await Order.find({ time: timeThursday });
      let data5 = await Order.find({ time: timeFriday });
      let data6 = await Order.find({ time: timeSaturday });
      let data7 = await Order.find({ time: timeSunday });

      let moneyNow = 0;

      let money1 = 0;
      let money2 = 0;
      let money3 = 0;
      let money4 = 0;
      let money5 = 0;
      let money6 = 0;
      let money7 = 0;

      for (let i = 0; i < dataNow.length; i++) {
        moneyNow += dataNow[i].total;
      }

      for (let i = 0; i < data1.length; i++) {
        money1 += data1[i].total;
      }

      for (let i = 0; i < data2.length; i++) {
        money2 += data2[i].total;
      }

      for (let i = 0; i < data3.length; i++) {
        money3 += data3[i].total;
      }

      for (let i = 0; i < data4.length; i++) {
        money4 += data4[i].total;
      }

      for (let i = 0; i < data5.length; i++) {
        money5 += data5[i].total;
      }

      for (let i = 0; i < data6.length; i++) {
        money6 += data6[i].total;
      }

      for (let i = 0; i < data7.length; i++) {
        money7 += data7[i].total;
      }

      res.render("layouts/servers/sales/salesbymonth", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: dataNow,
        VND,
        moneyNow,
        money1,
        money2,
        money3,
        money4,
        money5,
        money6,
        money7,
        time,
        dateStart,
        dateEnd,
        dateNow,
        timeMonday,
        timeSunday,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});

//Trang tổng doanh thu theo tuần
app.get("/salesbyyears", async (req, res) => {
  if (req.session.daDangNhap) {
    let role = req.session.admin_role;
    if (role == 0 || role == 2) {
      let time = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

      let timeMonday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("DD/MM/YYYY");
      let timeTuesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(2)
        .format("DD/MM/YYYY");
      let timeWednesday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(3)
        .format("DD/MM/YYYY");
      let timeThursday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(4)
        .format("DD/MM/YYYY");
      let timeFriday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(5)
        .format("DD/MM/YYYY");
      let timeSaturday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(6)
        .format("DD/MM/YYYY");
      let timeSunday = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("DD/MM/YYYY");

      // let startOfMonth = moment.tz(Date.now(), "Asia/Ho_Chi_Minh").startOf('month').format('YYYY-MM-DD');

      let dateStart = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(1)
        .format("YYYY-MM-DD");
      let dateEnd = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .day(7)
        .format("YYYY-MM-DD");
      let dateNow = moment
        .tz(Date.now(), "Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");

      let dataNow = await Order.find({ time: time });

      let data1 = await Order.find({ time: timeMonday });
      let data2 = await Order.find({ time: timeTuesday });
      let data3 = await Order.find({ time: timeWednesday });
      let data4 = await Order.find({ time: timeThursday });
      let data5 = await Order.find({ time: timeFriday });
      let data6 = await Order.find({ time: timeSaturday });
      let data7 = await Order.find({ time: timeSunday });

      let moneyNow = 0;

      let money1 = 0;
      let money2 = 0;
      let money3 = 0;
      let money4 = 0;
      let money5 = 0;
      let money6 = 0;
      let money7 = 0;

      for (let i = 0; i < dataNow.length; i++) {
        moneyNow += dataNow[i].total;
      }

      for (let i = 0; i < data1.length; i++) {
        money1 += data1[i].total;
      }

      for (let i = 0; i < data2.length; i++) {
        money2 += data2[i].total;
      }

      for (let i = 0; i < data3.length; i++) {
        money3 += data3[i].total;
      }

      for (let i = 0; i < data4.length; i++) {
        money4 += data4[i].total;
      }

      for (let i = 0; i < data5.length; i++) {
        money5 += data5[i].total;
      }

      for (let i = 0; i < data6.length; i++) {
        money6 += data6[i].total;
      }

      for (let i = 0; i < data7.length; i++) {
        money7 += data7[i].total;
      }

      res.render("layouts/servers/sales/salesbyyears", {
        adminName: req.session.adminName,
        admin_id: req.session.admin_id,
        admin_role: req.session.admin_role,
        danhsach: dataNow,
        VND,
        moneyNow,
        money1,
        money2,
        money3,
        money4,
        money5,
        money6,
        money7,
        time,
        dateStart,
        dateEnd,
        dateNow,
        timeMonday,
        timeSunday,
      });
    } else {
      res.redirect("/admin_home");
    }
  } else {
    res.redirect("/admin_login");
  }
});
