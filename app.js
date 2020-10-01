const express = require('express');
const routes = require('./routes/routes');

const app = express();

// set view engine to PUG
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set static server
app.use('/static', express.static('public'));

// use routes
app.use(routes);

// error handler
app.use(function(err, req, res, next) {
  if (err.status === 404) {
    res.status(404).render('page-not-found');
  } else {
    console.log('Error not working');
    res.status(505).render('error', { errors: err });
  }
});

module.exports = app;