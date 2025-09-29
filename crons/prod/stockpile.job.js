const cron = require('node-cron');
const { scanDynamoDBTableWithPlcIccid } = require('../../repositories/dynamodb_repository');
const report_stockpile = require('../../controllers/cronStockpile.controller');

// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';


// // Run at every hour except midnight (00:00) and noon (12:00)
// cron.schedule('0 1-11,13-23 * * *', async () => {
//     console.log('Cron job running every hour except midnight and noon');

//     const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
//     await report_stockpile.Stockpilecontroller(site);
// }, { timezone: timeZone });

// // Run specifically at 00:02 and 12:02
// cron.schedule('1 0,12 * * *', async () => {
//     console.log('Cron job running at 00:01 or 12:01');

//     const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
//     await report_stockpile.Stockpilecontroller(site);
// }, { timezone: timeZone });