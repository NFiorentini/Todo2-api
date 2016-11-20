// const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectID } = require('mongodb');


// Create a Mongo db by giving it a name (here, TodoApp)
// & then putting something in it.
MongoClient.connect('mongodb://localhost:27017/TodoApp',
    (err, db) => {

  if (err) {
    return console.log(
        'Unable to connect to MongoDB server');
  }

  console.log('Connected to MongoDB server');
  //
  // db.collection('Todos').findOneAndUpdate({
  //   _id: new ObjectID('58260c412a29e823b48440a0')
  // },{
  //   $set: {
  //     completed: true
  //   }
  // }, {
  //   returnOriginal: false
  // }).then((result) => {
  //   console.log(result);
  // });

  db.collection('Users').findOneAndUpdate({
      _id: new ObjectID('5824fc51cfb81830a4f60745')
    },{
      $set: {
        name: 'Homer'
      },
      $inc: {
        age: 1
      }
    }, {
      returnOriginal: false
    }).then((result) => {
      console.log(result);
    });
  // db.close();
});

/*
Nick@DESKTOP-K31TRU0 MINGW64 /c/program files/MongoDB/Server/3.2/bin
$ ./mongod --dbpath ~/desktop/code/node/meadnode2/mongo-data
*/
