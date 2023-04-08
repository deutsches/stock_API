var express = require("express");
var router = express.Router();
const firebase_admin = require("../connection/firebase_admin_connect");
const firebase_admin2 = require("firebase-admin");
var auth = firebase_admin2.auth();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: false }));
const axios = require('axios');
const database = firebase_admin2.database().ref("stocks");

// 儲存上市公司
router.get("/savetse", function (req, res) {
  const apiURL = `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`;
  const obj = {};
  axios
    .get(apiURL)
    .then((response) => {
      response.data.forEach((element) => {
        obj[element.Code] = {};
        obj[element.Code].code = element.Code;
        obj[element.Code].name = element.Name;
        obj[element.Code].open = element.OpeningPrice;
        obj[element.Code].close = element.ClosingPrice;
        obj[element.Code].change = element.Change;
        obj[element.Code].stockCode = 'tse_' + element.Code + '.tw';
      });
      database.update(obj).then(function(){
        database.once("value", function (snapshot) {
        });
      });
      console.log('success tse');
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Internal Server Error");
    });
});

// 儲存上櫃公司
router.get("/saveotc", function (req, res) {
  const apiURL = `https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes`;
  const obj = {};
  axios
    .get(apiURL)
    .then((response) => {
      response.data.forEach((element) => {
        obj[element.SecuritiesCompanyCode] = {};
        obj[element.SecuritiesCompanyCode].code = element.SecuritiesCompanyCode;
        obj[element.SecuritiesCompanyCode].name = element.CompanyName;
        obj[element.SecuritiesCompanyCode].open = element.Open;
        obj[element.SecuritiesCompanyCode].close = element.Close;
        obj[element.SecuritiesCompanyCode].change = element.Change;
        obj[element.SecuritiesCompanyCode].stockCode = 'otc_' + element.SecuritiesCompanyCode + '.tw';
      });
      database.update(obj).then(function(){
      });
      console.log('success otc');
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Internal Server Error");
    });
});


module.exports = router;