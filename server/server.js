/*
server.js is where our routes are configured & where we
start the server, binding it to a port on our machine.
*/

require('./config/config');

/*
Library imports. */
const bodyParser     = require('body-parser');
const express        = require('express');
const _              = require('lodash');

/*
Local imports. */
const {authenticate} = require('./middleware/authenticate');
const {mongoose}     = require('./db/mongoose');
const {ObjectID}     = require('mongodb');
const {Todo}         = require('./models/todo');
const {User}         = require('./models/user');

const app            = express();
const PORT           = process.env.PORT;


/*
bodyParser takes a String body & turns it into a
Javascript object. The return value of bodyParser.json()
is middleware that is given to Express. */
app.use(bodyParser.json());

/*
Route definition...app.METHOD(PATH, HANDLER)
POST /todos is for creating a new Todo. */
app.post('/todos', authenticate, (req, res) => {

/*
Create an instance of a new Mongoose model. */
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

/*
Creating a new instance does NOT update the MongoDB
database. You have to call save(), which returns
a Promise. */
  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {

/*
200-OK is the default set by Express.
400-Bad Request. https://httpstatuses.com */
    res.status(400).send(e);
  });
});


/*
GET /todos is responsible for returning the todos.
'/todos' is the URL for the root of our app.
req stores info about the request coming in, including
headers used, body info, path, etc.
res has available methods that allow us to respond to
the http request. */
app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {

/*
We could pass in the todos array directly, but using
ES6 syntax & putting the todos on a Javascript object
allows you to add additional properties later. */
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});


/*
GET /todos/:id fetches one todo by its id. */
app.get('/todos/:id', authenticate, (req, res) => {

/*
req.params is an object with key/value pairs. */
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {

/*
404-Not Found. */
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

/*
To avoid disclosing private info, don't send back the
error object. */
    res.status(400).send();
  });
});


app.delete('/todos/:id', authenticate, (req, res) => {

/*
Grab the id off the request object. */
  const id = req.params.id;

/*
Validate the id. Exit the function if id isn't valid. */
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

/*
findByIdAndRemove()'s success case is called even if no
todo is deleted. */
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

/*
Use patch() to update a resource. */
app.patch('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {

/*
getTime returns a Javascript timestamp. */
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;

/*
To remove a value from the database, set it to null. */
    body.completedAt = null;
  }

/*
$set is a MongoDB operator.
{new: true} is a MongoDB an option that tweaks how the
function works. */
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


/*
POST /users creates a new user. */
app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  user.save().then(() => {

/*
We defined generateAuthToken() in models/user.js. */
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});


/*
GET /users/me requires authentication, finds the
associated user, & sends that user back. */
app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});


/*
POST /users/login is a dedicated route for logging in
users. The data sent here is the email & the plain-text
password. */
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
