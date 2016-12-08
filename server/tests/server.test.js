const expect                  = require('expect');
const request                 = require('supertest');


const {app}                   = require('./../server');
const {ObjectID}              = require('mongodb');
const {Todo}                  = require('./../models/todo');


const {todos, populateTodos, users, populateUsers}
                              = require('./seed/seed');


const {User} = require('./../models/user');


/*
The beforeEach() testing lifecycle method runs before
each single test case. populateUsers & populateTodos from
seed/seed.js clears all todos & users prior to
populating the database. */
beforeEach(populateUsers);
beforeEach(populateTodos);


/*
describe() blocks group routes together. */
describe('POST /todos', () => {


/*
done is needed because this test is asynchronous. */
  it('should create a new todo', (done) => {
    const text = 'Test todo text';

/*
Make the test via Supertest. */
    request(app)

/*
post() sets up a POST request. */
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})

/*
Make assertions. */
      .expect(200)

/*
Our custom expect callbacks are passed a response
object. */
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {

/*
If err exists, wrap up the test. The
code afterwards will not run. */
        if (err) {
          return done(err);
        }

/*
Verify that the todo was added. */
        Todo.find({text}).then((todos) => {

/*
One todo item was added. */
          expect(todos.length).toBe(1);

/*
The added todo item has the text defined up above. */
          expect(todos[0].text).toBe(text);
          done();

/*
catch(e) catches any errors that might occur inside
of the callback. */
        }).catch((e) => done(e));
      });
  });


  it('should not create todo with invalid body data',
      (done) => {

/*
Here, we're passing in nothing at all. */
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})

/*
400-Bad Request. */
      .expect(400)
      .end((err, res) => {

        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {

/*
seed/seed.js puts 2 Todos into the collection. */
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });
});


describe('GET /todos', () => {


  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});


describe('GET /todos/:id', () => {


  it('should return todo doc', (done) => {
    request(app)

/*
The toHexString() method converts an id object to
a String. */
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)

/*
We expect that the text body of the todo matches the
text set up above. */
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });


  it('should not return todo doc created by other user',
      (done) => {

    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });


  it('should return 404 if todo not found', (done) => {
    const hexId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });


  it('should return 404 for non-object ids', (done) => {
    request(app)

/*
Object IDs have a specific structure & this isn't it. */
      .get('/todos/123abc')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});


describe('DELETE /todos/:id', () => {

  it('should remove a todo', (done) => {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

/*
hexId should have been deleted. */
        Todo.findById(hexId).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });


  it('should remove a todo', (done) => {

    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId).then((todo) => {
          expect(todo).toExist();
          done();
        }).catch((e) => done(e));
      });
  });


  it('should return 404 if todo not found', (done) => {
    const hexId = new ObjectID().toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });


  it('should return 404 if object id is invalid',
      (done) => {

    request(app)
      .delete('/todos/123abc')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});


describe('PATCH /todos/:id', () => {


  it('should update the todo', (done) => {

/*
Grab the id of the first item. */
    const hexId = todos[0]._id.toHexString();

/*
Dummy text. */
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)

/*
the things we want to change. */
      .send({
        completed: true,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });


  it('should not update the todo created by other user',
      (done) => {

    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({
        completed: true,
        text
      })
      .expect(404)
      .end(done);
  });


/*
This it() block is very similar to the first one. */
  it('should clear completedAt when todo is not completed',
      (done) => {

    const hexId = todos[1]._id.toHexString();
    const text = 'This should be the new text!!';

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({
        completed: false,
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });
});


describe('GET /users/me', () => {


  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {

        expect(res.body._id).toBe(users[0]
            ._id.toHexString());

        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });


  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')

/*
We don't use set() here because we want to see what
happens when we DO NOT provide the token. */
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});


describe('POST /users', () => {


  it('should create a user', (done) => {
    const email = 'example@example.com';
    const password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });


  it('should return validation errors if request invalid',
      (done) => {

    request(app)
      .post('/users')
      .send({
        email: 'and',
        password: '123'
      })
      .expect(400)
      .end(done);
  });


  it('should not create user if email in use', (done) => {
    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password: 'Password123!'
      })
      .expect(400)
      .end(done);
  });
});


describe('POST /users/login', () => {


  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[1]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });


  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      });
  });
});


describe('DELETE /users/me/token', () => {


  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
