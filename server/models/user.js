const bcrypt                      = require('bcryptjs');
const jwt                         = require('jsonwebtoken');
const mongoose                    = require('mongoose');
const _                           = require('lodash');
const validator                   = require('validator');


const UserSchema = new mongoose.Schema({
  email: {

/*
The text field is a String. Beware that Mongoose WILL
cast a Number or a Boolean into a String, e.g.,
text: true -> "true". */
    type: String,

/*
The text value MUST exist. */
    required: true,

/*
Remove leading & trailing whitespace from the text
field's value. */
    trim: true,

/*
No empty strings. */
    minlength: 1,

/*
The email property is compared to others in the collection
& must be unique. */
    unique: true,
    validate: {

/*
Validate that the String passed in is a valid email. */
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});


/*
We override toJSON() to leave off the password & the
tokens array, which are properties that should NEVER be
sent back to the user, & only return the id & email. */
UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};


/*
generateAuthToken() is used by app.post('/users', ...)
in server/server.js. */
UserSchema.methods.generateAuthToken = function () {

/*
We use the function keyword because we need access to the
this keyword, which stores the individual document. */
  const user = this;
  const access = 'auth';

  const token = jwt.sign(
    {
      _id: user._id.toHexString(),
      access
    },
    process.env.JWT_SECRET)
    .toString();

/*
user.tokens is an empty Array by default. */
  user.tokens.push({access, token});

user.save() returns a Promise. */
  return user.save().then(() => {
    return token;
  });
};


UserSchema.methods.removeToken = function (token) {
  const user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};


/*
findByToken() is a custom model method.
Everything added onto the .statics object is a model
method, as opposed to an instance method. */
UserSchema.statics.findByToken = function (token) {
  const User = this;
  let decoded;

  try {

/*
jwt.verify() throws an error if the secret doesn't match
the secret that the token was created with or if the token
value was manipulated with. */
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {

/*
Same thing as...
return new Promise((resolve, reject) => {
  reject();
});
return Promise.reject();
An arg in reject() would be used as the error arg in
server/server.js app.get('/users/me',...)'s
catch() block. */
  }

/*
return the returned Promise. */
  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};


UserSchema.statics.findByCredentials =

/*
This password is the plain-text password, so we can't
directly query the database. */
    function (email, password) {

  const User = this;

/*
Find one user whose email is the passed in email.*/
  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {

      bcrypt.compare(password, user.password,
          (err, res) => {

        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};


/*
pre() includes code to run before the 'save' event. */
UserSchema.pre('save', function (next) {
  const user = this;

  if (user.isModified('password')) {

/*
Salting a password adds random characters to the hash.
bcrypt.genSalt() takes two args:
a number of rounds used to generate the salt (the larger
number of rounds, the more time the algorithm takes), &
a callback function where the actual hashing takes place. */
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {

/*
Override the user.password to properly hide the plain text
password. */
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});


const User = mongoose.model('User', UserSchema);


/*
Export so we can use the User model elsewhere. */
module.exports = {User}
