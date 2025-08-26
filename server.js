require('dotenv').config();

const db = require('./configs/postgress_db');
const app = require('./index');

const cron = (process.env.NODE_ENV==="development")?
require('./crons/dev/processScheduledJobs'):require('./crons/prod/index.prod');





