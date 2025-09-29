const cron = require('node-cron');
const {scanDynamoDBTableWithPlcIccid,scanDynamoDBTableNight,scanDynamoDBTableExtraShift,scanDynamoDBTableDay } = require('../../repositories/dynamodb_repository');
const report_stockpile = require('../../controllers/cronStockpile.controller');

const report_controller = require('../../controllers/cron.controller');
const Statusreportcontroller = require('../../controllers/internalStatusreport.controller');


// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';



(async () => {
    try {
        //    const items = await scanDynamoDBTableNight('06:00');
        //     await report_controller.reportdata(items, "night");

        //   const items = await scanDynamoDBTableDay('0:30');
        //     await report_controller.reportdata(items, "day");

        //  const extrashiftitems = await scanDynamoDBTableExtraShift('22:00');
        //  await report_controller.reportdata(extrashiftitems, "day2");
        
       
    } catch (error) {
        console.error('Error:', error);
    }
})();


