// var createError = require('http-errors');
var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// const pug = require('pug');
const { sequelize, Book } = require('./models');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

// set static server
app.use('/static', express.static('public'));

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

// redirects HOME to /books
app.get('/', (req, res) => {
  res.redirect('/books');
});

// Shows the full list of books
app.get('/books', asyncHandler(async (req, res) => {
  const books = await Book.findAll();
  res.render('index', { books });
})); 

// Shows the create new book form
app.get('/books/new', (req, res) => {
  res.render('new-book');
}); 

// Posts a new book to the database
app.post('/books/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body)
    res.redirect('/books');
  } catch (error) {
    if(error.name === "SequelizeValidationError") { // checking the error
      book = await Book.build(req.body)
      res.render('new-book', { book, errors: error.errors })
    } else {
      throw error; // error caught in the asyncHandler's catch block
    }  
  }
}));  

// Shows book detail form
app.get('/books/:id', asyncHandler( async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    res.render('update-book', { book });
  } else {
    res.sendStatus(404);
  }
})); 

// Updates book info in the database
app.post('/books/:id', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect('/books');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") { // checking the error
      book = await Book.build(req.body)
      res.render('update-book', { book, errors: error.errors })
    } else {
      throw error; // error caught in the asyncHandler's catch block
    }  
  }
}));

// Deletes a book.
app.post('/books/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    await book.destroy();
    res.redirect('/books');
  } else {
    res.sendStatus(404);
  }
}));

app.get('/json', async (req, res) => {
  const books = await Book.findAll();
  res.json(books);
});

app.use((req, res, next) => {
  const err = new Error('Page not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if (err.status === 404) {
    return res.render('page-not-found');
  } else {
    err.status = 500;
    // err.message = 'There was an error on the server';
    console.log(`${err.status}: ${err.message}`);
    // return res.render('error', { err });
  }
});

module.exports = app;
