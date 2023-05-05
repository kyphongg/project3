const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('layouts/home')
  })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })