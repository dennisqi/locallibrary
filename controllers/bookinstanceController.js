var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, book_instance_list) {
            if (err) {
                return next(err);
            }
            res.render('book_instance_list', {
                title: 'Book Instance List',
                list_book_instances: book_instance_list
            });
        });
};

exports.bookinstance_detail = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('book_instance_detail', {
                title: 'Book:',
                bookinstance: bookinstance
            });
        })

};

exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, 'title')
        .exec(function(err, books) {
            if (err) {
                return next(err);
            }
            res.render('book_instance_form', {title: 'Create Book Instance', book_list: books});
        })
};

exports.bookinstance_create_post = [
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Not a valid date').optional({checkFalsy: true}).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        } else {
            bookInstance.save(function(err) {
                if (err) {
                    return next(err);
                }
                res.redirect(bookInstance.url);
            })
        }
    }
];

exports.bookinstance_delete_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, book_instance) {
            if (err) {
                return next(err);
            }
            res.render('book_instance_delete', {title: 'Delete Book Instance', book_instance: book_instance});
        });
};

exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findByIdAndDelete(req.body.bookinstanceid, function(err, book_instance) {
        if (err) {
            return next(err);
        }
        res.redirect('/catalog/bookinstances');
    });
};

exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback) {
                BookInstance.findById(req.params.id).populate('book').exec(callback)
        },
        books: function(callback) {
            Book.find(callback)
        }
    }, 
    function(err, results) {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_instance_form', { title: 'Update  BookInstance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance:results.bookinstance });
    });

};

exports.bookinstance_update_post = [
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    res.render('book_instance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
                if (err) { return next(err); }
                   res.redirect(thebookinstance.url);
                });
        }
    }
];