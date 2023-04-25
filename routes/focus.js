var express = require("express");
var router = express.Router();
const firebase_admin = require("../connection/firebase_admin_connect");
const admin = require("firebase-admin");
var auth = admin.auth();
var bodyParser = require("body-parser");
var nodemailer = require('nodemailer');
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: false }));
const axios = require("axios");
const database = admin.database();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.ACCOUNT,
    clientId: process.env.CLINENTID,
    clientSecret: process.env.CLINENTSECRET,
    refreshToken: process.env.REFRESHTOKEN,
    accessToken: process.env.ACCESSTOKEN,
  },
});


// 新增自己的關注股
router.post("/addStock", function (req, res) {
  const { uid, code, name, token, stockCode, dealPrice, updown, change } =
    req.body;
  const data = {};
  data[code] = {
    code,
    name,
    stockCode,
    dealPrice,
    change,
    updown,
    uid,
    notice:{
      dealPrice: '',
      send:false,
    }
  };
  database.ref("focus").child(token).update(data);
  console.log("data", data);
  res.send({ success: true });
});

// 顯示自己的關注股
router.post("/getFocusStock", function (req, res) {
  const token = req.header("Authorization");
  let index = {
    'tse':{
      name: '',
      deal: 0,
      updown: 0,
      change: '',
    },
    'otc':{
      name: '',
      deal: 0,
      updown: 0,
      change: '',
    }
  };
    database
      .ref("focus")
      .child(token)
      .once("value", function (snapshot) {
        if(snapshot.val() !== null) {
        const stockCodes = Array.from(
          new Set(Object.values(snapshot.val()).map((item) => item.stockCode))
        );
        
        let obj = snapshot.val();
        let para = "";
        stockCodes.forEach((item) => {
          para += item + "|";
        });
        const apiURL = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=tse_t00.tw|otc_o00.tw|${para}`;
        axios
          .get(apiURL)
          .then((response) => {
            response.data.msgArray.forEach((item) => {
              for (let key in obj) {
                if (obj[key].code === item.c) {
                  if (!item.hasOwnProperty('b')) {
                    item.z = item.y;
                  } else if (item.z === "-") {
                    let ary = item.b.split('_');
                    item.z = ary[0] * 1;
                  } 
                  obj[key].updown = ((item.z - item.y) * 1).toFixed(2);
                  obj[key].dealPrice = (item.z * 1).toFixed(2);
                  if((obj[key].dealPrice*1) === (obj[key].notice.dealPrice*1) &&
                    obj[key].notice.send === false) {
                    sendMail(token,obj[key]);
                  }
                  if (obj[key].updown === 0) {
                    obj[key].change = 0 + "%";
                  } else {
                    obj[key].change =
                      ((obj[key].updown / item.y) * 100).toFixed(2) + "%";
                  }

                } else {
                  // 加權指數和櫃買指數
                  if(item.c === 't00') {
                    index.tse.name = item.n;
                    index.tse.deal = item.z*1;
                    index.tse.updown = (item.z*1 - item.y*1).toFixed(2);
                    index.tse.change = (index.tse.updown / (item.y*1) * 100).toFixed(2) + '%';
                  } else if (item.c === 'o00') {
                    index.otc.name = item.n;
                    index.otc.deal = item.z*1;
                    index.otc.updown = (item.z*1 - item.y*1).toFixed(2);
                    index.otc.change = (index.otc.updown / (item.y*1)*100).toFixed(2) + '%';
                  }
                }
              }
            });
            database.ref("focus").child(token).update(obj);
            res.send({'resultArray':Object.values(obj),index});
          })
          .catch((error) => {
            console.log(error);
            // return false;
            // res.status(500).send("Internal Server Error");
          });
        } else {
          const apiURL = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=tse_t00.tw|otc_o00.tw|`;
          axios
          .get(apiURL)
          .then((response) => {
            response.data.msgArray.forEach((item) => {
              
            // 加權指數和櫃買指數
              if (item.c === "t00") {
                index.tse.name = item.n;
                index.tse.deal = item.z * 1;
                index.tse.updown = (item.z * 1 - item.y * 1).toFixed(2);
                index.tse.change =
                  ((index.tse.updown / (item.y * 1)) * 100).toFixed(2) + "%";
              } else {
                index.otc.name = item.n;
                index.otc.deal = item.z * 1;
                index.otc.updown = (item.z * 1 - item.y * 1).toFixed(2);
                index.otc.change =
                  ((index.otc.updown / (item.y * 1)) * 100).toFixed(2) + "%";
              }
            });
            res.send({ resultArray: [], index });
          })
          .catch((err) => {
            console.log(err);
          });
        }
      });
});

// 更新關注價格
// router.post("/updateFocusStockPrice", function (req, res) {
//   const token = req.header("Authorization");
//   if (updatePrice(token)) {
//     res.send({ success: true });
//   } else {
//     res.send({ success: false });
//   }
// });

// function updatePrice(token) {
//   console.log("updatePrice");
//   let obj = {};
//   database
//     .ref("focus")
//     .child(token)
//     .once("value", function (snapshot) {
//       const stockCodes = Array.from(
//         new Set(Object.values(snapshot.val()).map((item) => item.stockCode))
//       );
//       let obj = snapshot.val();
//       let para = "";
//       stockCodes.forEach((item) => {
//         para += item + "|";
//       });
//       const apiURL = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=${para}`;
//       axios
//         .get(apiURL)
//         .then((response) => {
//           response.data.msgArray.forEach((item) => {
//             for (let key in obj) {
//               if (obj[key].code === item.c) {
//                 if (item.z === "-") {
//                   obj[key].updown = 0;
//                   obj[key].dealPrice = item.y * 1;
//                 } else {
//                   obj[key].updown = ((item.z - item.y) * 1).toFixed(2);
//                   obj[key].dealPrice = (item.z * 1).toFixed(2);
//                 }
//                 if (obj[key].updown === 0) {
//                   obj[key].change = 0 + "%";
//                 } else {
//                   obj[key].change =
//                     ((obj[key].updown / item.y) * 100).toFixed(2) + "%";
//                 }
//               }
//             }
//           });
//           database.ref("focus").child(token).update(obj);
//           console.log("obj", Object.values(obj));
//           return Object.values(obj);
//         })
//         .catch((error) => {
//           console.log(error);
//           // return false;
//           // res.status(500).send("Internal Server Error");
//         });
//     });
// }

//刪除整股票
router.delete("/deleteStock", function (req, res) {
  const token = req.header("Authorization");
  const { code } = req.query;
  database
    .ref("focus")
    .child(token)
    .once("value", function (snapshot) {
      let obj = snapshot.val();
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key].code === code) {
            delete obj[key];
          }
        }
      }
      database.ref("focus").child(token).set(obj);
      res.send({ success: true });
    });
});

// 設定警示價格
router.post("/updateNoticePrice", function (req, res) {
  const token = req.header("Authorization");
  const { code,dealPrice } = req.query;
  const notice = {
    dealPrice,
    send:false,
  }
  database
    .ref("focus")
    .child(token).child(code).child('notice')
    .update(notice);
});

//提示mail
function sendMail(token,obj) {
  // obj.notice.send = true;
  let user = {};
  admin.auth().getUser(token)
  .then((userRecord) => {
    // 找到使用者，進行後續處理
    user = userRecord;
    const mailContent = {
      from: '"股市關注網"<germanyisgood@gmail.com>',
      // to: 'germanyisgood@gmail.com',
      to: user.email,
      subject: `${obj.name}價格警示`,
      text:`${obj.name}已經到了您設定的警示價格${obj.notice.dealPrice}`,
    }
    const notice = {
      dealPrice: '',
      send: true,
    }
    transporter.sendMail(mailContent,function(error, info) {
      console.log('user!',user.email);
      console.log('通知成功!');
      database
      .ref("focus")
      .child(token).child(obj.code).child('notice')
      .update(notice);
    })
  })
  .catch((error) => {
    console.log('Error fetching user data:', error);
  });
  
}

module.exports = router;
