var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var async = require('async');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


exports.index = function(req, res) {   
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

exports.book_list = function(req, res, next) {
    Book.find({}, 'author title')
        .populate('author')
        .exec(function(err, list_books) {
            if (err) {return next(err);}
            res.render('book_list', {title: 'Book List', book_list: list_books});
        });
};

exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({'book': req.params.id})
                .exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance });
    });
};

exports.book_create_get = function(req, res, next) {
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    },
    function(err, results) {
        if (err) {
            return next(err);
        }
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres})
    });
};

exports.book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof(req.body.genre) == undefined) {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),
    sanitizeBody('*').escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });
        if (!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            },
            function(err, results) {
                if (err) { return next(err); }
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        } else {
            book.save(function(err) {
                if (err) {
                    return next(err);
                }
                res.redirect(book.url);
            });
        }
    }
];

exports.book_delete_get = function(req, res, next) {
    async.parallel(
        {
            book_instances: function(callback) {
                BookInstance.find({'book': req.params.id}).exec(callback);
            },
            book: function(callback) {
                Book.findById(req.params.id).exec(callback);
            }
        },
        function(err, results) {
            if (results.book == undefined) {
                var err = new Error('Book not found');
                err.status = 404;
                return next(err)
            }
            if (err) {
                return next(err);
            }
            res.render('book_delete', {title: 'Delte Book', book: results.book, book_instances: results.book_instances})
        });
};

exports.book_delete_post = function(req, res, err) {
    async.parallel(
        {
            book_instances: function(callback) {
                BookInstance.find({'book': req.body.bookid}).exec(callback);
            },
            book: function(callback) {
                Book.findById(req.body.bookid).exec(callback);
            }
        },
        function(err, results) {
            if (err) {
                return next(err);
            }
            if (results.book_instances.length == 0) {
                Book.findByIdAndDelete(results.book._id, function(err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect('/catalog/books');
                })
            } else {
                res.render('book_delete', {title: 'Delete Book', book: results.book, book_instances: results.book_instances});
                return;
            }
        });
};

exports.book_update_get = function(req, res, next) {
    async.parallel(
        {
            book: function(callback) {
                Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
            },
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            }
        },
        function(err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                var err = new Error('Book not found');
                err.status = 404;
                return next(err)
            }
            for (var i = 0; i < results.genres.length; i++) {
                for (var j = 0; j < results.book.genre.length; j++) {
                    if (results.genres[i]._id.toString()==results.book.genre[j]._id.toString()) {
                        results.genres[i].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors:results.authors, genres:results.genres, book: results.book });
        }
    );
};

exports.book_update_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id
        })
        if (!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        } else {
            // empty errors
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, book) {
                if (err) {
                    return next(err);
                }
                res.redirect(book.url)
            })
        }
    }
];