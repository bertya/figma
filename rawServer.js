const fb = require('./firebase');

// var docRef = fb.db.collection('users').doc('alovelace');

// console.log(docRef);

// var setAda = docRef.set({
//   first: 'Ada',
//   last: 'Lovelace',
//   born: 1815
// });

var deleteDoc = fb.db.collection('files').doc('123').delete();