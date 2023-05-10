const express = require("express");
const ejs = require("ejs");
const app = express();
const port = 3000;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

//Mongodb
const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://phong:ODiJ7TXfPD0XiClM@cluster0.19fbi9g.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to mongo successfully"))
  .catch((err) => {
    console.error(err);
  });

//models
const Admin = require("./models/admin.js");
const User = require("./models/user.js");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//body-parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

//Client
//Đăng nhập đăng ký tài khoản
app.get("/login", (req, res) => {
  res.render("layouts/clients/login", {
    id: 1,
    fullname: 1,
  });
});

app.get("/signup", (req, res) => {
  res.render("layouts/clients/signup", {
    sID: req.sessionID,
    id: 1,
    fullname: 1,
  });
});

app.post("/save", function (req, res) {
  var user = User({
    fullname: req.body.fullname,
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    phone: req.body.phone,
  });

  if (req.body.password != req.body.password2) {
    res.status(400).json({ error: "Mật khẩu không trùng khớp" });
  } else {
    user.save().then(function () {
      res.redirect("/");
    });
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
        console.log("Đăng nhập thành công với", user);
        var sess = req.session;
        sess.daDangNhap = true;
        sess.fullname = user.fullname;
        sess.email = user.email;
        sess.id = user._id;
        res.redirect("/");
      } else {
        res.status(400).json({ error: "Sai mật khẩu" });
      }
    } else {
      res.status(400).json({ error: "Tài khoản không tồn tại" });
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
app.get("/", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/home", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/home", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

//Trang giới thiệu, tin tức, tuyển dụng, hỗ trợ
app.get("/about", (req, res) => {
  res.render("layouts/clients/about", {
    nhanvat: 1,
  });
});

app.get("/news", (req, res) => {
  res.render("layouts/clients/news", {
    nhanvat: 1,
  });
});

app.get("/hiring", (req, res) => {
  res.render("layouts/clients/hiring", {
    nhanvat: 1,
  });
});

app.get("/support", (req, res) => {
  res.render("layouts/clients/support", {
    nhanvat: 1,
  });
});

//Trang profile, lịch sử đơn hàng, mật khẩu
app.get("/profile/:id", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/profile", {
      fullname: req.session.fullname,
      email: req.session.email,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/home", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/orders/:id", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/orders", {
      fullname: req.session.fullname,
      email: req.session.email,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/home", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/password/:id", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/password", {
      fullname: req.session.fullname,
      email: req.session.email,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/home", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

//Trang chi tiết lịch sử đơn hàng
app.get("/orders_detail", (req, res) => {
  res.render("layouts/clients/orders_detail", {
    nhanvat: 1,
  });
});

//Trang giỏ hàng và thanh toán và trang thông báo đặt hàng thành công
app.get("/cart/:id", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/cart", {
      fullname: req.session.fullname,
      email: req.session.email,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/home", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/checkout", (req, res) => {
  res.render("layouts/clients/checkout", {
    nhanvat: 1,
  });
});

app.get("/success", (req, res) => {
  res.render("layouts/clients/success", {
    nhanvat: 1,
  });
});

//Trang chi tiết sản phẩm
app.get("/product", (req, res) => {
  res.render("layouts/clients/product", {
    nhanvat: 1,
  });
});

//Trang category
app.get("/category", (req, res) => {
  res.render("layouts/clients/category", {
    nhanvat: 1,
  });
});

//Servers
//Trang đăng nhập
app.get("/admin_login", (req, res) => {
  res.render("layouts/servers/login");
});

app.post("/admin_save", function (req, res) {
  var user = User({
    fullname: req.body.fullname,
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    phone: req.body.phone,
  });

  if (req.body.password != req.body.password2) {
    res.status(400).json({ error: "Mật khẩu không trùng khớp" });
  } else {
    user.save().then(function () {
      res.redirect("/");
    });
  }
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
        console.log("Đăng nhập thành công với", admin);
        var sess = req.session;
        sess.daDangNhap = true;
        sess.fullname = admin.fullname;
        if (sess.back) {
          console.log(sess.back);
          res.redirect(sess.back);
        } else {
          res.redirect("/admin_home");
        }
      } else {
        res.status(400).json({ error: "Sai mật khẩu" });
      }
    } else {
      res.status(400).json({ error: "Tài khoản không tồn tại" });
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

//Trang home
app.get("/admin_home", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/home", {
      fullname: req.session.fullname,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang thể loại
app.get("/admin_categories", (req, res) => {
  res.render("layouts/servers/categories/categories", {
    nhanvat: 1,
  });
});

app.get("/add_categories", (req, res) => {
  res.render("layouts/servers/categories/add_categories", {
    nhanvat: 1,
  });
});

app.get("/edit_categories", (req, res) => {
  res.render("layouts/servers/categories/edit_categories", {
    nhanvat: 1,
  });
});

//Trang nhà sản xuất
app.get("/admin_producers", (req, res) => {
  res.render("layouts/servers/producers/producers", {
    nhanvat: 1,
  });
});

app.get("/add_producers", (req, res) => {
  res.render("layouts/servers/producers/add_producers", {
    nhanvat: 1,
  });
});

app.get("/edit_producers", (req, res) => {
  res.render("layouts/servers/producers/edit_producers", {
    nhanvat: 1,
  });
});

//Trang sản phẩm
app.get("/admin_product", (req, res) => {
  res.render("layouts/servers/product/product", {
    nhanvat: 1,
  });
});

app.get("/add_product", (req, res) => {
  res.render("layouts/servers/product/add_product", {
    nhanvat: 1,
  });
});

app.get("/edit_product", (req, res) => {
  res.render("layouts/servers/product/edit_product");
});

//Trang danh sách khách hàng và (danh sách và thêm nhân viên)
app.get("/customers", (req, res) => {
  res.render("layouts/servers/customer/customer", {
    un: 1,
  });
});

app.get("/employees", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/employee/employee", {
      fullname: req.session.fullname,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_employee", (req, res) => {
  res.render("layouts/servers/employee/add_employee");
});

//Trang quản lý đơn hàng
app.get("/all_orders", (req, res) => {
  res.render("layouts/servers/orders/all_orders", {
    nhanvat: 1,
  });
});

app.get("/new_orders", (req, res) => {
  res.render("layouts/servers/orders/new_orders", {
    nhanvat: 1,
  });
});

app.get("/order_detail", (req, res) => {
  res.render("layouts/servers/orders/order_detail", {
    nhanvat: 1,
  });
});

app.get("/accept_orders", (req, res) => {
  res.render("layouts/servers/orders/accept_orders", {
    nhanvat: 1,
  });
});

app.get("/done_orders", (req, res) => {
  res.render("layouts/servers/orders/done_orders", {
    nhanvat: 1,
  });
});

app.get("/cancel_orders", (req, res) => {
  res.render("layouts/servers/orders/cancel_orders");
});

//Trang nhập kho
app.get("/warehouse", (req, res) => {
  res.render("layouts/servers/warehouse/warehouse", {
    nhanvat: 1,
  });
});

app.get("/add_warehouse", (req, res) => {
  res.render("layouts/servers/warehouse/add_warehouse", {
    nhanvat: 1,
  });
});

app.get("/edit_warehouse", (req, res) => {
  res.render("layouts/servers/warehouse/edit_warehouse", {
    nhanvat: 1,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
