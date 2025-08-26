const express = require("express");
const router = express.Router();


const runaudit = require("../controllers/auditor.controller");

router.post('/auditor',runaudit.runauditReport);

module.exports=router