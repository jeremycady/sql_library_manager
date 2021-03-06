const express = require('express');
const { sequelize, Book, Sequelize } = require('../models');
const { Op } = require('sequelize');
const fetch = require('node-fetch');
const paginate = require('express-paginate');

const routes = express();

// adds pagination middleware and limits
routes.use(paginate.middleware(10, 50));

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error) {
      next(error);
    }
  }
}

// redirects HOME to /books
routes.get('/', (req, res) => {
  res.redirect('/books');
});

// Shows the full list of books
routes.get('/books', asyncHandler(async (req, res) => {
  let search = {};

  // sets the query for book data retrieval
  if (req.query.search) {
    search = {
      where: {
        [Op.or]: {
          title: { [Op.like]: `%${req.query.search}%`},
          author: { [Op.like]: `%${req.query.search}%`},
          genre: { [Op.like]: `%${req.query.search}%`},
          year: { [Op.like]: `%${req.query.search}%`},
        }
      }
    };
  }

  // retrieve all books meeting search
  const books = await Book.findAll(search);

  // provide data for pagination
  await Book.findAndCountAll({
    search,
    limit: req.query.limit, 
    offset: req.skip})
    .then(results => {
      const itemCount = results.count;
      const pageCount = Math.ceil(results.count / req.query.limit);
      const offset = req.skip
      const limit = req.query.page * req.query.limit;
      res.render('index', {
        books,
        pageCount,
        itemCount,
        offset,
        limit,
        pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
      });
    }).catch(err => next(err));
})); 

// posts search query back to /books
routes.post('/books', asyncHandler(async (req, res) => {
  res.redirect(`/books/?search=${req.body}`);
}));

// Shows the isbn new book form
routes.get('/books/isbn', (req, res) => {
  res.render('isbn');
}); 

// fetches book data from Google Books API
routes.post('/books/isbn', asyncHandler(async (req, res) => {

  const fetchBook = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${req.body.isbn}`);
  const json = await fetchBook.json();
  
  // conditional on whether fetch returns no results from Google
  if (json.totalItems === 0) {
    res.redirect('/books/new?isbn=false');
  } else {
    const title = json.items[0].volumeInfo.title;
    const author = json.items[0].volumeInfo.authors[0];
    const genre = json.items[0].volumeInfo.categories[0];
    const year = json.items[0].volumeInfo.publishedDate;

    res.redirect(`/books/new?title=${title}&author=${author}&genre=${genre}&year=${year}`);
  }
}));

// Shows the create new book form
routes.get('/books/new', (req, res) => {
  // if no books returned from Google feeds empty form, otherwise fills form with retreived data
  if (req.query.isbn === 'false') {
    const errors = { error: {message: 'ISBN returned no results'}}
    res.render('new-book', { errors });
  } else if (req.query.title === undefined) {
    res.render('new-book');
  } else {
    let book = {};
    book.title = req.query.title;
    book.author = req.query.author;
    book.genre = req.query.genre;
    book.year = req.query.year;

    res.render('new-book', { book });
  }
}); 

// Posts a new book to the database
routes.post('/books/new', asyncHandler(async (req, res) => {
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
routes.get('/books/:id', asyncHandler( async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    res.render('update-book', { book });
  } else {
    const err = new Error('Page not Found');
    err.status = 404;
    return next(err);
  }
})); 

// Updates book info in the database
routes.post('/books/:id', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect('/books');
    } else {
      const err = new Error('Page not Found');
      err.status = 404;
      next(err);
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

// Deletes a book
routes.post('/books/:id/delete', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    await book.destroy();
    res.redirect('/books');
  } else {
    const err = new Error('Page not Found');
    err.status = 404;
    next(err);
  }
}));

// Custom error route
routes.get('/error', (req, res) => {
  console.log('Custom error route called');

  const err = new Error();
  err.message = 'Custom 500 error thrown';
  err.status = 500;
  throw err;
});

// gets json from database
routes.get('/json', async (req, res) => {
  const books = await Book.findAll();
  res.json(books);
});

// 404 error catch
routes.use((req, res, next) => {
  const err = new Error('Page not Found');
  err.status = 404;
  next(err);
});

module.exports = routes;