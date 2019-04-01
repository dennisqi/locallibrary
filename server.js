// var mongoose = require('mongoose');

// //Connections
// var mongoDB = 'mongodb://127.0.0.1/my_database';
// mongoose.connect(mongoDB, { useNewUrlParser: true });

// //Assign db with connection
// var db = mongoose.connection;

// //Handle errors
// db.on('error', console.error.bind(console, 'MongoDB Connection Error:'));

// //Setup sechma obj
// var Schema = mongoose.Schema;
// var SomeModelSchema = new Schema({
//     a_string: String,
//     a_date: Date
// });

// //Compile model
// var SomeModel = mongoose.model('SomeModel', SomeModelSchema);