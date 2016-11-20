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

  // db.collection ('Todos').find({
  //   _id: new ObjectID('5824f1e9a463ac1904536f80')
  // })
  //     .toArray().then( (docs) => {
  //
  //   console.log('Todos');
  //   console.log(JSON.stringify(docs, undefined, 2));
  // }, (err) => {
  //   console.log('Unable to fetch todos', err);
  // });

//   db.collection ('Todos').find()
//       .count().then( (count) => {
//
//     console.log(`Todos count: ${ count }`);
//   }, (err) => {
//     console.log('Unable to fetch todos', err);
//   });

  db.collection('Users').find({ name: 'Bart' }).toArray()
      .then((docs) => {

    console.log(JSON.stringify(docs, undefined, 2));

    // db.close();
  });
});


/*
Nick@DESKTOP-K31TRU0 MINGW64 /c/program files/MongoDB/Server/3.2/bin
$ ./mongod --dbpath ~/desktop/code/node/meadnode2/mongo-data
*/
