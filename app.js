var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const pug = require('pug');
const { sequelize, Book } = require('./models');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { post } = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set static server
app.use('/static', express.static('public'));

// redirects HOME to /books
app.get('/',(req, res) => {
  res.redirect('/books');
});

// Shows the full list of books
app.get('/books', async (req, res) => {
  const books = await Book.findAll();
  res.render('index', { books });
}); 

app.get('/books/new'); // Shows the create new book form
app.post('books/new');  // Posts a new book to the database
app.get('books/:id'); // Shows book detail form
app.post('books/:id'); // Updates book info in the database
app.post('books/:id/delete');  // Deletes a book. Careful, this can’t be undone. It can be helpful to create a new “test” book to test deleting.

app.get('/json', async (req, res) => {
  const books = await Book.findAll();
  res.json(books);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if (err.status === 404) {
    console.log(`${err.status}: ${err.message}`);
    // return res.render('page-not-found', { err });
  } else {
    err.status = 500;
    // err.message = 'There was an error on the server';
    console.log(`${err.status}: ${err.message}`);
    // return res.render('error', { err });
  }
});

(async () => {
  console.log('Testing the connection to the database...');
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = app;
