const mongoose = require('mongoose');

const Todo = mongoose.model('Todo', {
  text: {

    // Mongoose will cast numbers & booleans to string.
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = { Todo };
