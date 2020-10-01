const express = require('express');
const { sequelize, Book } = require('./models');
const fetch = require('node-fetch');
const paginate = require('express-paginate');

const app = express();

// set view engine to PUG
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set static server
app.use('/static', express.static('public'));

// adds pagination middleware and limits
app.use(paginate.middleware(10, 50));

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
app.get('/', (req, res) => {
  res.redirect('/books');
});

// Shows the full list of books
app.get('/books', asyncHandler(async (req, res) => {
  const books = await Book.findAll();

  // add pagination to the books page
  await Book.findAndCountAll({limit: req.query.limit, offset: req.skip})
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

// Shows the isbn new book form
app.get('/books/isbn', (req, res) => {
  res.render('isbn');
}); 

app.post('/books/isbn', asyncHandler(async (req, res) => {

  const fetchBook = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${req.body.isbn}`);
  const json = await fetchBook.json();
  
  const title = json.items[0].volumeInfo.title;
  const author = json.items[0].volumeInfo.authors[0];
  const genre = json.items[0].volumeInfo.categories[0];
  const year = json.items[0].volumeInfo.publishedDate;

  res.redirect(`/books/new/?title=${title}&author=${author}&genre=${genre}&year=${year}`);

}));

// Shows the create new book form
app.get('/books/new', (req, res) => {
  if (Object.keys(req.query).length === 0) {
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

// Deletes a book
app.post('/books/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    await book.destroy();
    res.redirect('/books');
  } else {
    res.sendStatus(404);
  }
}));

// Custom error route
app.get('/error', (req, res) => {
  console.log('Custom error route called');

  const err = new Error();
  err.message = 'Custom 500 error thrown';
  err.status = 500;
  throw err;
});

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
    res.status(404).render('page-not-found');
  } else {
    console.log('Error not working');
    res.status(505).render('error', { errors: err });
  }
});

module.exports = app;