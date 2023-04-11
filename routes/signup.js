var express = require('express');
var router = express.Router();
var firebase = require('../connection/firebase_connect');
var bodyParser = require('body-parser');
var admin = require("firebase-admin");
var auth = admin.auth();

router.use(bodyParser.urlencoded({ extended: false }));

router.post('/', function (req, res) {
    const {email, password } = req.body;
    console.log(req.body);
    auth.createUser({
        email,
        password,
    })
    .then(function(userRecord){
        console.log('new user:', userRecord);
        res.send('success');
    })
    .catch(function(error){
        console.log(error.code);
        if(error.errorInfo.code === 'auth/invalid-password') {
            res.send('密碼至少要6個字!');
        }
        if(error.errorInfo.code === 'auth/invalid-email') {
            res.send('信箱格式錯誤!');
        }
        if(error.errorInfo.code === 'auth/email-already-exists') {
            res.send('此email已被註冊使用，請重新換一個email!');
        }
    });

})

module.exports = router;