const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');

//Mongodb
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lam:WBz1E8R60tx79jBO@cluster0.19fbi9g.mongodb.net/?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Connected to mongo successfully"))
.catch((err) => {
  console.error(err);
});

//Client
//Trang chủ
app.get('/', (req, res) => {
    res.render('layouts/clients/home')
})

//Đăng nhập đăng ký tài khoản
app.get('/login', (req, res) => {
  res.render('layouts/clients/login')
})

app.get('/signup', (req, res) => {
  res.render('layouts/clients/signup')
})

//Trang giới thiệu, tin tức, tuyển dụng, hỗ trợ
app.get('/about', (req, res) => {
  res.render('layouts/clients/about')
})

app.get('/news', (req, res) => {
  res.render('layouts/clients/news')
})

app.get('/hiring', (req, res) => {
  res.render('layouts/clients/hiring')
})

app.get('/support', (req, res) => {
  res.render('layouts/clients/support')
})

//Trang profile, lịch sử đơn hàng, mật khẩu
app.get('/profile', (req, res) => {
  res.render('layouts/clients/profile')
})

app.get('/orders', (req, res) => {
  res.render('layouts/clients/orders')
})

app.get('/password', (req, res) => {
  res.render('layouts/clients/password')
})

//Trang chi tiết lịch sử đơn hàng
app.get('/orders_detail', (req, res) => {
  res.render('layouts/clients/orders_detail')
})

//Trang giỏ hàng và thanh toán và trang thông báo đặt hàng thành công
app.get('/cart', (req, res) => {
  res.render('layouts/clients/cart')
})

app.get('/checkout', (req, res) => {
  res.render('layouts/clients/checkout')
})

app.get('/success', (req, res) => {
  res.render('layouts/clients/success')
})

//Trang chi tiết sản phẩm
app.get('/product', (req, res) => {
  res.render('layouts/clients/product')
})

//Trang category 
app.get('/category', (req, res) => {
  res.render('layouts/clients/category')
})


//Servers
//Trang home
app.get('/admin_home', (req, res) => {
  res.render('layouts/servers/home')
})

//Trang thể loại 
app.get('/admin_categories', (req, res) => {
  res.render('layouts/servers/categories/categories')
})

app.get('/add_categories', (req, res) => {
  res.render('layouts/servers/categories/add_categories')
})

app.get('/edit_categories', (req, res) => {
  res.render('layouts/servers/categories/edit_categories')
})

//Trang nhà sản xuất 
app.get('/admin_producers', (req, res) => {
  res.render('layouts/servers/producers/producers')
})

app.get('/add_producers', (req, res) => {
  res.render('layouts/servers/producers/add_producers')
})

app.get('/edit_producers', (req, res) => {
  res.render('layouts/servers/producers/edit_producers')
})

//Trang sản phẩm 
app.get('/admin_product', (req, res) => {
  res.render('layouts/servers/product/product')
})

app.get('/add_product', (req, res) => {
  res.render('layouts/servers/product/add_product')
})

app.get('/edit_product', (req, res) => {
  res.render('layouts/servers/product/edit_product')
})

//Trang danh sách khách hàng và danh sách nhân viên
app.get('/customers', (req, res) => {
  res.render('layouts/servers/customer/customer')
})

app.get('/employees', (req, res) => {
  res.render('layouts/servers/employee/employee')
})

//Trang quản lý đơn hàng
app.get('/all_orders', (req, res) => {
  res.render('layouts/servers/orders/all_orders')
})

app.get('/new_orders', (req, res) => {
  res.render('layouts/servers/orders/new_orders')
})

app.get('/order_detail', (req, res) => {
  res.render('layouts/servers/orders/order_detail')
})

app.get('/accept_orders', (req, res) => {
  res.render('layouts/servers/orders/accept_orders')
})

app.get('/done_orders', (req, res) => {
  res.render('layouts/servers/orders/done_orders')
})

app.get('/cancel_orders', (req, res) => {
  res.render('layouts/servers/orders/cancel_orders')
})

//Trang nhập kho
app.get('/warehouse', (req, res) => {
  res.render('layouts/servers/warehouse/warehouse')
})

app.get('/add_warehouse', (req, res) => {
  res.render('layouts/servers/warehouse/add_warehouse')
})

app.get('/edit_warehouse', (req, res) => {
  res.render('layouts/servers/warehouse/edit_warehouse')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })