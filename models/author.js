var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max:100},
        date_of_birth: Date,
        date_of_death: Date
    }
);

AuthorSchema
    .virtual('name')
    .get(function() {
        return this.family_name + ', ' + this.first_name;
    });

AuthorSchema
    .virtual('url')
    .get(function() {
        return '/catalog/author/' + this._id;
    });

AuthorSchema
    .virtual('lifespan')
    .get(function() {
        var dod = this.date_of_death;
        if (dod==null) {
            dod = 'Now'
        } else {
            dod = moment(dod).format('MMMM DD, YYYY');
        }
        return moment(this.date_of_birth).format('MMMM DD, YYYY') + ' - ' + dod;
    });

AuthorSchema
    .virtual('date_of_birth_formatted')
    .get(function() {
        return moment(this.date_of_birth).format('MMMM DD, YYYY');
    });

AuthorSchema
    .virtual('date_of_death_formatted')
    .get(function() {
        return moment(this.date_of_death).format('MMMM DD, YYYY');
    });

AuthorSchema
    .virtual('date_of_death_update')
    .get(function() {
        return moment(this.date_of_death).format('YYYY-MM-DD');
    });

AuthorSchema
    .virtual('date_of_birth_update')
    .get(function() {
        return moment(this.date_of_birth).format('YYYY-MM-DD');
    });

module.exports = mongoose.model('Author', AuthorSchema);