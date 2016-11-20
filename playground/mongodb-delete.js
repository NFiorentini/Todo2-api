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

  // db.collection('Todos').deleteMany({ text: 'Eat lunch!' })
  //   .then((result) => {
  //
  //   console.log(result);
  // });

  // db.collection('Todos').deleteOne({ text: 'Eat lunch!' })
  //     .then((result) => {
  //
  //   console.log(result);
  // });

  // db.collection('Todos').findOneAndDelete({ completed: false })
  //     .then((result) => {
  //
  //   console.log(result);
  // });

  // db.collection('Users').deleteMany({ name: 'Bob' })
  //   .then((result) => {
  //
  //   console.log(result);
  // });

  db.collection('Users').findOneAndDelete(
    { _id: new ObjectID('5824f92608b2a130405ec6ec') })
    .then((results) => {

    console.log(JSON.stringify(results, undefined, 2));


  });





    // db.close();
});

/*
Nick@DESKTOP-K31TRU0 MINGW64 /c/program files/MongoDB/Server/3.2/bin
$ ./mongod --dbpath ~/desktop/code/node/meadnode2/mongo-data
*/
