require('./config/config');

// Library imports.
const bodyParser     = require('body-parser');
const express        = require('express');
const _              = require('lodash');

// Local imports.
const {authenticate} = require('./middleware/authenticate');
const {mongoose}     = require('./db/mongoose');
const {ObjectID}     = require('mongodb');
const {Todo}         = require('./models/todo');
const {User}         = require('./models/user');

const app            = express();
const PORT           = process.env.PORT;

// bodyParser takes a String body & turns it
// into a Javascript object. The return value of
// bodyParser.json() is middleware that is given
// to Express.
app.use(bodyParser.json());


// /todos is for creating a new Todo.
app.post('/todos', authenticate, (req, res) => {

  // Create an instance of a new Mongoose model.
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  // Creating a new instance does NOT update the MongoDB
  // database. You have to call save(), which returns
  // a Promise.
  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {

    // 200-OK is the default set by Express.
    // 400-Bad Request. https://httpstatuses.com
    res.status(400).send(e);
  });
});


app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});


app.get('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {

    // 404-Not Found.
    return res.status(404).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});


app.delete('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});


app.patch('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({_id: id, _creator: req.user._id},
      {$set: body}, {new: true}).then((todo) => {

    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});


// POST /users
app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});


app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});


app.post('/users/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password)
      .then((user) => {

    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});


app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});


app.listen(PORT, () => {
  console.log(
    `     Server is listening
         and caring
        on PORT ${PORT}!
    `
  );
});


module.exports = {app};
