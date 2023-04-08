var express = require('express');
var router = express.Router();
var firebaseDb = require('../connection/firebase_admin_connect');
var firebase = require('../connection/firebase_connect');

/* GET home page. */
router.get('/', function(req, res, next) {
  // console.log(firebase.auth());
  // console.log(req.cookies);
  // console.log(firebase.auth());
  res.render('index', { title: 'Express' });
});

module.exports = router;
