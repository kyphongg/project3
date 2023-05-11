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
  if (req.session.daDangNhap) {
    res.render("layouts/clients/about", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/about", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/privacy_policy", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/privacy_policy", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/privacy_policy", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/terms_of_service", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/terms_of_service", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/terms_of_service", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/news", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/news", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/news", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/hiring", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/hiring", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/hiring", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/support", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/support", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/support", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/hotline", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/hotline", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/hotline", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
});

app.get("/customer_care", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/clients/customer_care", {
      fullname: req.session.fullname,
      id: req.session.id,
      sID: req.session.sessionID,
    });
  } else {
    res.render("layouts/clients/customer_care", {
      fullname: 1,
      id: 1,
      sID: req.session.sessionID,
    });
  }
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

//Xử lý đăng nhập
app.post("/admin_login", async function (req, res) {
  try {
    //Kiểm tra xem tài khoản có tồn tại hay không
    const admin = await Admin.findOne({ email: req.body.email });
    if (admin) {
      //Kiểm tra mật khẩu
      const result = req.body.password === admin.password;
      if (result) {
        console.log("Đăng nhập thành công với", admin.id);
        const customer = await User.find().count();
        const employee = await Admin.find().count();
        var sess = req.session;
        sess.daDangNhap = true;
        sess.fullname = admin.fullname;
        sess.admin_id = admin._id;
        sess.number = customer;
        sess.numberal = employee;
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

//Trang home admin
app.get("/admin_home", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/home", {
      fullname: req.session.fullname,
      number: req.session.number,
      numberal: req.session.numberal,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang thể loại
app.get("/admin_categories", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Category.find();
    res.render("layouts/servers/categories/categories", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      danhsach: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_categories", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/categories/add_categories", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/categories_save", function (req, res) {
  if (req.session.daDangNhap) {
    var category = Category({
      categoryName: req.body.categoryName,
    });
    category.save().then(function () {
      res.redirect("/admin_categories");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/edit_categories/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Category.findById(req.params.id);
    res.render("layouts/servers/categories/edit_categories", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      danhsach: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/edit_categories_save", async function (req, res) {
  if (req.session.daDangNhap) {
    Category.updateOne(
      { _id: req.body.categoryId },
      {
        categoryName: req.body.categoryName,
      }
    ).then(function () {
      res.redirect("/admin_categories");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/delete_categories/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Category.deleteOne({ _id: req.params.id }).then(function () {
      res.redirect("/admin_categories");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang nhà sản xuất
app.get("/admin_producers", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Producer.find();
    res.render("layouts/servers/producers/producers", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      danhsach: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_producers", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/producers/add_producers", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/producers_save", function (req, res) {
  if (req.session.daDangNhap) {
    var producer = Producer({
      producerName: req.body.producerName,
    });
    producer.save().then(function () {
      res.redirect("/admin_producers");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/edit_producers/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Producer.findById(req.params.id);
    res.render("layouts/servers/producers/edit_producers", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      danhsach: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/edit_producers_save", async function (req, res) {
  if (req.session.daDangNhap) {
    Producer.updateOne(
      { _id: req.body.producerId },
      {
        producerName: req.body.producerName,
      }
    ).then(function () {
      res.redirect("/admin_producers");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/delete_producers/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Producer.deleteOne({ _id: req.params.id }).then(function () {
      res.redirect("/admin_producers");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang sản phẩm
app.get("/admin_product", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/product/product", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_product", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/product/add_product", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/edit_product", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/product/edit_product", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang danh sách khách hàng và (danh sách và thêm nhân viên)
app.get("/customers", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await User.find();
    res.render("layouts/servers/customer/customer", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Nhân viên
app.get("/employees", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.find();
    res.render("layouts/servers/employee/employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/admin_profile/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.findById({ _id: req.params.id });
    res.render("layouts/servers/employee/profile", {
      fullname: req.session.fullname,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/admin_setting/:id", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.findById({ _id: req.params.id });
    res.render("layouts/servers/employee/setting", {
      fullname: req.session.fullname,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/admin_save", function (req, res) {
  if (req.session.daDangNhap) {
    var admin = Admin({
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
      role: req.body.role,
      status: req.body.status,
    });
    admin.save().then(function () {
      res.redirect("/employees");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_employee", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/employee/add_employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/edit/:id", async function (req, res) {
  if (req.session.daDangNhap) {
    let data = await Admin.findById(req.params.id);
    res.render("layouts/servers/employee/edit_employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.post("/edit_save", async function (req, res) {
  if (req.session.daDangNhap) {
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
      res.redirect("/employees");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/delete/:id", function (req, res) {
  if (req.session.daDangNhap) {
    Admin.deleteOne({ _id: req.params.id }).then(function () {
      res.redirect("/employees");
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/employees_store", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.find({ role: 1 });
    res.render("layouts/servers/employee/store_employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/employees_order", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.find({ role: 2 });
    res.render("layouts/servers/employee/order_employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/employees_customer_care", async (req, res) => {
  if (req.session.daDangNhap) {
    let data = await Admin.find({ role: 3 });
    res.render("layouts/servers/employee/customer_care_employee", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
      nhanvat: data,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang quản lý đơn hàng
app.get("/all_orders", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/all_orders", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/new_orders", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/new_orders", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/order_detail", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/order_detail", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/accept_orders", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/accept_orders", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/done_orders", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/done_orders", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/cancel_orders", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/orders/cancel_orders", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

//Trang nhập kho
app.get("/warehouse", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/warehouse/warehouse", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/add_warehouse", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/warehouse/add_warehouse", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.get("/edit_warehouse", (req, res) => {
  if (req.session.daDangNhap) {
    res.render("layouts/servers/warehouse/edit_warehouse", {
      fullname: req.session.fullname,
      id: req.session.admin_id,
    });
  } else {
    req.session.back = "/admin_home";
    res.redirect("/admin_login");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
