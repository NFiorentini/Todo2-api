const mongoose          = require('mongoose');

/*
Tell Mongoose which Promise library to use. */
mongoose.Promise = global.Promise;

/*
Tell Mongoose how to connect to the database. */
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose};
