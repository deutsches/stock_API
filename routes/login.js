var express = require('express');
var router = express.Router();
// const firebase = require("firebase");
// const firebase_admin = require("firebase-admin");
// const firebase_admin = require("../connection/firebase_admin_connect");
// var auth = firebase;
// var auth_admin = firebase.auth();
// var bodyParser = require('body-parser');

// router.use(bodyParser.urlencoded({ extended: false }));

// // console.log(auth);
// console.log(auth_admin.signInWithEmailAndPassword);

// router.post('/', function (req, res) {
//     const {email, password } = req.body;
//     console.log(email,password);
//     auth.signInWithEmailAndPassword(firebase_admin.getAuth,email, password)
//     .then((userCredential) => {
//       // 登入成功，取得 user 資訊
//       const { user } = userCredential;
//       const { uid } = user;
//       const { expirationTime } = user.stsTokenManager;
//       console.log(user.uid, user.stsTokenManager.expirationTime);
//      res.send({'success':true,uid,expirationTime});
//     })
//     .catch((error) => {
//       // 登入失敗，顯示錯誤訊息
//       const errorCode = error.code;
//       const errorMessage = error.message;
//       console.log(error);
//       console.log('error:', errorCode, errorMessage);
//       res.send({'success':false});
//     });
// })

module.exports = router;