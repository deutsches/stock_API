var express = require("express");
var router = express.Router();
const firebase_admin = require("../connection/firebase_admin_connect");
const firebase_admin2 = require("firebase-admin");
var auth = firebase_admin2.auth();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: false }));
const axios = require("axios");
const database = firebase_admin2.database();

// 取得所有公司資料
router.get("/getStocks", function (req, res) {
  database.ref("stocks").once("value", function (snapshot) {
    // Object.keys(snapshot.val()).forEach((element) => {
    //   obj.code = snapshot.val()[element].code;
    //   obj.name = snapshot.val()[element].name;
    //   obj.stockCode = snapshot.val()[element].stockCode;
    //   ary.push(obj);
    //   obj = {};
    // });
    const dataArray = Object.entries(snapshot.val()).map(([code, { name, stockCode }]) => ({ code, name, stockCode }));

    res.send(dataArray);
  });
});


// 新增自己的庫藏股
router.post("/addStock", function (req, res) {
  const {
    price,
    uid,
    code,
    name,
    counts,
    token,
    stockCode,
    dealPrice,
    profit,
    change,
  } = req.body;
  const data = {};
  data[uid] = {
    code,
    name,
    price,
    counts,
    stockCode,
    dealPrice,
    change,
    profit,
    uid,
  };
  database.ref("store").child(token).update(data);
  res.send({ success: true });
});

// 顯示自己的庫藏股
router.post("/getStoreStock", function (req, res) {
  const token = req.header("Authorization");
  database
    .ref("store")
    .child(token)
    .once("value", function (snapshot) {
      if (snapshot.val() !== null) {
        const stockCodes = Array.from(
          new Set(Object.values(snapshot.val()).map((item) => item.stockCode))
        );
        let obj = snapshot.val();
        let para = "";
        stockCodes.forEach((item) => {
          para += item + "|";
        });
        const apiURL = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=${para}`;
        axios
          .get(apiURL)
          .then((response) => {
            console.log("response", response.data.msgArray);
            response.data.msgArray.forEach((item) => {
              for (let key in obj) {
                if (obj[key].code === item.c) {
                  if (item.z === "-") {
                    item.z = item.y;
                  }
                  obj[key].dealPrice = (item.z * 1).toFixed(2);
                  obj[key].profit =
                    (item.z * 1 - obj[key].price * 1) * obj[key].counts;
                  obj[key].change =
                    obj[key].profit === 0
                      ? 0
                      : (
                          (obj[key].profit /
                            (obj[key].counts * obj[key].price)) *
                          100
                        ).toFixed(2) + "%";
                }
              }
            });

            database.ref("store").child(token).update(obj);
            let result = Object.values(obj).reduce((acc, curr) => {
              if (!acc[curr.code]) {
                acc[curr.code] = { ...curr, price: curr.price * curr.counts };
              } else {
                acc[curr.code].profit += curr.profit;
                acc[curr.code].counts += curr.counts;
                acc[curr.code].price += curr.price * curr.counts;
              }
              return acc;
            }, {});
            let total = 0;
            let ROI = 0;
            Object.keys(result).forEach((code) => {
              ROI += result[code].price;
              total += result[code].profit;
              result[code].change =
                result[code].profit === 0
                  ? 0 + "%"
                  : ((result[code].profit / result[code].price) * 100).toFixed(
                      2
                    ) + "%";
              result[code].price = (
                result[code].price / result[code].counts
              ).toFixed(2);
            });
            total = total.toFixed(0);
            ROI = ((total / ROI) * 100).toFixed(2) + "%";
            const resultArray = Object.values(result);
            const analysis = [];
            resultArray.forEach((item) => {
              let tempAry = [];
              tempAry.push(item.name);
              tempAry.push(item.price * 1 * item.counts);
              analysis.push(tempAry);
            });
            console.log("resultArray", resultArray);
            res.send({ resultArray, analysis, total, ROI });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.send([]);
      }
    });
});

// 更新庫藏價格
router.post("/updateStoreStockPrice", function (req, res) {
  const token = req.header("Authorization");
  database
    .ref("store")
    .child(token)
    .once("value", function (snapshot) {
      const stockCodes = Array.from(
        new Set(Object.values(snapshot.val()).map((item) => item.stockCode))
      );
      let obj = snapshot.val();
      let para = "";
      stockCodes.forEach((item) => {
        para += item + "|";
      });
      const apiURL = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&ex_ch=${para}`;
      axios
        .get(apiURL)
        .then((response) => {
          response.data.msgArray.forEach((item) => {
            for (let key in obj) {
              if (obj[key].code === item.c) {
                obj[key].dealPrice = (item.z * 1).toFixed(2);
                obj[key].profit =
                  (item.z * 1 - obj[key].price * 1) * obj[key].counts;
                obj[key].change =
                  (
                    (obj[key].profit / (obj[key].counts * obj[key].price)) *
                    100
                  ).toFixed(2) + "%";
              }
            }
          });
          database.ref("store").child(token).update(obj);
          let result = Object.values(obj).reduce((acc, curr) => {
            if (!acc[curr.code]) {
              acc[curr.code] = { ...curr };
            } else {
              acc[curr.code].profit += curr.profit;
              acc[curr.code].counts += curr.counts;
              acc[curr.code].price += curr.price * curr.counts;
            }
            return acc;
          }, {});
          Object.keys(result).forEach((code) => {
            result[code].price = (
              result[code].price / result[code].counts
            ).toFixed(2);
          });
          const resultArray = Object.values(result);
          console.log("resultArray", resultArray);
          res.send(resultArray);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("Internal Server Error");
        });
    });
});

router.get("/stockDetail", function (req, res) {
  const token = req.header("Authorization");
  const { code } = req.query;
  database
    .ref("store")
    .child(token)
    .once("value", function (snapshot) {
      const filteredObj = Object.fromEntries(
        Object.entries(snapshot.val()).filter(
          ([key, value]) => value.code === code
        )
      );
      // 篩選出 code 為 2330 的資料
      const filteredData = Object.entries(filteredObj).filter(
        ([key, value]) => value.code === code
      );

      // 將篩選結果轉換為兩個陣列
      const values = filteredData.map(([key, value]) => value);
      res.send(values);
    });
});

//刪除整股票
router.delete("/deleteStock", function (req, res) {
  const token = req.header("Authorization");
  const { code } = req.query;
  database
    .ref("store")
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
      database.ref("store").child(token).set(obj);
      res.send({ success: true });
    });
});

// 刪除股票細項
router.delete("/deleteSingleStock", function (req, res) {
  const token = req.header("Authorization");
  const { uid } = req.query;

  database.ref("store").child(token).child(uid).remove();
  res.send({ success: true });
});
module.exports = router;
