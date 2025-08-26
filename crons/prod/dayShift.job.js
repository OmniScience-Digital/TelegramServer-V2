const cron = require('node-cron');

const { scanDynamoDBTableDay,  scanDynamoDBTableExtraShift } = require('../../repositories/dynamodb_repository');
const report_controller = require('../../controllers/cron.controller');
const Statusreportcontroller = require('../../controllers/internalStatusreport.controller');


// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';





//internal status report
cron.schedule('0 0 * * *', async () => {
    
    let triggerStart ="12:00",triggerEnd= "00:00",shift='day';
    await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

}, { timezone: timeZone });


cron.schedule('0 14 * * *', async () => {
    // This cron job triggers every day at 2 PM SAST
    const items = await scanDynamoDBTableDay('14:00');
    await report_controller.reportdata(items, "day");

}, { timezone: timeZone });


cron.schedule('0 16 * * *', async () => {
    // This cron job triggers every day at 4 PM SAST
    const items = await scanDynamoDBTableDay('16:00');
    await report_controller.reportdata(items, "day");


}, { timezone: timeZone });

cron.schedule('0 18 * * *', async () => {
    // This cron job triggers every day at 6 PM SAST

    const items = await scanDynamoDBTableDay('18:00');
    await report_controller.reportdata(items, "day");


}, { timezone: timeZone });



cron.schedule('30 18 * * *', async () => {
    // This cron job triggers every day at 6:30 PM SAST
    const items = await scanDynamoDBTableDay('18:30');
    await report_controller.reportdata(items, "day");


}, { timezone: timeZone });

cron.schedule('0 19 * * *', async () => {
    // This cron job triggers every day at 7 PM SAST
    const items = await scanDynamoDBTableDay('19:00');
    await report_controller.reportdata(items, "day");

}, { timezone: timeZone });



cron.schedule('0 22 * * *', async () => {
    // This cron job triggers every day at 22 PM SAST

    const items = await scanDynamoDBTableDay('22:00');
    //extrashift items
    const extrashiftitems = await scanDynamoDBTableExtraShift('22:00')

    await report_controller.reportdata(items, "day");
    await report_controller.reportdata(extrashiftitems, "day2");


}, { timezone: timeZone });




cron.schedule('0 0 * * *', async () => {
    // This cron job triggers every day at 12 AM SAST
    const items = await scanDynamoDBTableDay('00:00');
    await report_controller.reportdata(items, "day");


}, { timezone: timeZone });

