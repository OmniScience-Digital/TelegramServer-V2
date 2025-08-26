const cron = require('node-cron');

const {scanDynamoDBTableWithPlcIccid,scanDynamoDBTableNight } = require('../../repositories/dynamodb_repository');
const report_stockpile = require('../../controllers/cronStockpile.controller');


const report_controller = require('../../controllers/cron.controller');
const Statusreportcontroller = require('../../controllers/internalStatusreport.controller');


// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';




(async () => {
    try {


    // const items = await scanDynamoDBTableNight('06:00');
    // await report_controller.reportdata(items, "night");


    // let triggerStart ="00:00",triggerEnd= "12:00",shift='night';
    // await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

    
    // const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
    // await report_stockpile.Stockpilecontroller(site);

    } catch (error) {
        console.error('Error:', error);
    }
})();



// Run at every hour except midnight (00:00) and noon (12:00)
// cron.schedule('1 1-11,13-23 * * *', async () => {
//     console.log('Cron job running every hour except midnight and noon');
  
//     const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
//     await report_stockpile.Stockpilecontroller(site);
// }, { timezone: timeZone });

// // Run specifically at 00:02 and 12:02
// cron.schedule('2 0,12 * * *', async () => {
//     console.log('Cron job running at 00:01 or 12:01');

//     const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
//     await report_stockpile.Stockpilecontroller(site);
// }, { timezone: timeZone });
