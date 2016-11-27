const mongoose                        = require('mongoose');


// mongoose.model() takes two args:
// a String name & an object.
const Todo = mongoose.model('Todo', {
  text: {

    // The Text field is a String. Beware that Mongoose
    // WILL cast a Number or a Boolean into a String,
    // e.g., text: true -> "true".
    type: String,

    // The Text value MUST exist.
    required: true,

    // No empty strings.
    minlength: 1,

    // Remove leading & trailing whitespace from
    // the Text field's value.
    trim: true
  },
  completed: {

    // The Completed field is a Boolean.
    type: Boolean,

    // Rather than requiring the Completed field, it
    // has a default value of false.
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});


// Export so we can use the Todo model elsewhere.
module.exports = {Todo};
