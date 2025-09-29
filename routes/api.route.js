const express = require("express")
const router = express.Router()

const dataApi = require("./fetchAllIots.api")
const reportApi = require("./reportdata.api")
const statusreportApi = require("./internalstatusreport.api")
const alarmApi = require('./alarm.route.api')

router.use("/api/v1", alarmApi)
router.use("/api/v1", reportApi)
router.use("/api/v1", dataApi)
router.use("/api/v1", statusreportApi)



module.exports = router