var {User} = require('./../models/user');

var authenticate = (req, res, next) => {
  var token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    req.user = user;
    req.token = token;

/*
next() causes the rest of the function to execute
in the functions in server/server.js where the
authenticate() method is used. */
    next();
  }).catch((e) => {

/*
401-Authentication is required. */
    res.status(401).send();
  });
};

module.exports = {authenticate};
