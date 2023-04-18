var express = require("express");
var router = express.Router();
const firebase_admin = require("../connection/firebase_admin_connect");
const admin = require("firebase-admin");
var auth = admin.auth();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: false }));

/* GET users listing. */
router.post("/check", function (req, res) {
  const uid = req.header("Authorization");

  auth
    .getUser(uid)
    .then((userRecord) => {
      // UID 存在，userRecord 將是包含該用戶詳細資訊的物件
      // console.log("Successfully fetched user data:", userRecord.toJSON());
      if (userRecord.toJSON()) {
        res.send({ success: true });
        
      } else {
        res.send({ success: false });
      }
    })
    .catch((error) => {
      // 發生錯誤，UID 不存在
      console.log("Error fetching user data:", error);
      res.send({ success: false });
    });
});

module.exports = router;
