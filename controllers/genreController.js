var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


exports.genre_list = function (req, res, next) {
    Genre.find()
        .exec(function (err, genre_list) {
            if (err) {
                return next(err);
            }
            res.render('genre_list', {
                title: 'Genre List',
                genre_list: genre_list
            });
        });
};

exports.genre_detail = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({
                    'genre': req.params.id
                })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err)
        }
        if (results.genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {
            genre: results.genre,
            genre_books: results.genre_books
        });
    });
};

exports.genre_create_get = function (req, res) {
    res.render('genre_form', {
        title: 'Create Genre'
    });
};

exports.genre_create_post = [
    body('name', 'Genre name required').isLength({min: 1}).trim(),

    sanitizeBody('name').escape(),

    (req, res, next) => {
        const errors = validationResult(req);
        var genre = new Genre({ name: req.body.name });
        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array()
            });
            return;
        } else {
            Genre.findOne({'name': req.body.name})
                .exec(function(err, found_genre) {
                    if (err) {
                        return next(err);
                    }
                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function(err) {
                            if (err) {
                                return next(err);
                            }
                            res.redirect(genre.url);
                        });
                    }   
                }
            );
        }
}];

exports.genre_delete_get = function (req, res) {
    async.parallel({
        books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        },
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        }
    },
    function(err, results) {
        if (err) {
            return next(err);
        }
        res.render('genre_delete', {
            title: 'Delete Genre', book_list: results.books,
            genre: results.genre});
    });
};

exports.genre_delete_post = function (req, res, next) {
    async.parallel({
        books: function(callback) {
            Book.find({'genre': req.body.genreid}).exec(callback);
        },
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        }
    },
    function(err, results) {
        if (err) {
            next(err);
        }
        var genreid = req.body.genreid;
        if (results.books.length == 0) {
            Genre.findByIdAndDelete(genreid, function(err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect('/catalog/genres');
                });
        } else {
            res.render('genre_delete', {
                title: 'Delete Genre', book_list: result.books,
                genre: results.genre});
            return
        }
    });
};

exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id, function(err, genre) {
        if (err) { return next(err); }
        if (genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    });

};

exports.genre_update_post = [
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    sanitizeBody('name').escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        var genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
                if (err) { return next(err); }
                   res.redirect(thegenre.url);
                });
        }
    }
];