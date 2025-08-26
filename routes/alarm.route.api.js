const express = require('express');
const router = express.Router();
const alarm = require("../controllers/alarm.stockpile.crontroller");

router.post('/stockpileAlarm',alarm.alarmStockpile);

module.exports =router;
