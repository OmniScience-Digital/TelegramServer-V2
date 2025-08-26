const { scanDynamoDBTableDay, scanDynamoDBTableNight, scanDynamoDBTableExtraShift,scanDynamoDBTableWithPlcIccid,scanDynamoDBTableWithMonthStart } = require('./repositories/dynamodb_repository');
const report_controller = require('./controllers/cron.controller');
const report_stockpile = require('./controllers/cronStockpile.controller');
const Statusreportcontroller = require('./controllers/internalStatusreport.controller');

const cron = require('node-cron');

// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';

const getCurrentHour = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-ZA", {
        timeZone: "Africa/Johannesburg",
        hour: "numeric",
    });
    return Number(formatter.format(now));
};




(async () => {
    try {


    // This cron job triggers every day at 4 PM SAST
    // const items = await scanDynamoDBTableNight('06:00');
    // await report_controller.reportdata(items, "night");


    // let triggerStart ="00:00",triggerEnd= "12:00",shift='night';
    // await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

    // const currentHour = getCurrentHour();
    // const targetDate = new Date(); // Dynamic computation of current date-time
    
    // const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
    // await report_stockpile.Stockpilecontroller(site,currentHour,targetDate);

    } catch (error) {
        console.error('Error:', error);
    }
})();


/**Day Cron Jobs **/

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



///**************************Night SHIFT CRON*****************************///
//internal status report
cron.schedule('0 12 * * *', async () => {
    
    let triggerStart ="00:00",triggerEnd= "12:00",shift='night';
    await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

}, { timezone: timeZone });

cron.schedule('0 2 * * *', async () => {
    // This cron job triggers every day at 2 AM SAST
    const items = await scanDynamoDBTableNight('02:00');
    await report_controller.reportdata(items, "night");

}, { timezone: timeZone });


cron.schedule('0 5 * * *', async () => {
    // This cron job triggers every day at 6 PM SAST
    const items = await scanDynamoDBTableNight('05:00');
    await report_controller.reportdata(items, "night");


}, { timezone: timeZone });


cron.schedule('0 6 * * *', async () => {
    // This cron job triggers every day at 6 AM SAST
    const items = await scanDynamoDBTableNight('06:00');
    await report_controller.reportdata(items, "night");


}, { timezone: timeZone });

cron.schedule('30 6 * * *', async () => {
    // This cron job triggers every day at 6:30 AM SAST
    const items = await scanDynamoDBTableNight('06:30');
    await report_controller.reportdata(items, "night");



}, { timezone: timeZone });

cron.schedule('0 7 * * *', async () => {
    // This cron job triggers every day at 7 AM SAST
    const items = await scanDynamoDBTableNight('07:00');
    await report_controller.reportdata(items, "night");


}, { timezone: timeZone });


cron.schedule('0 12 * * *', async () => {
    // This cron job triggers every day at 12 PM SAST

    const items = await scanDynamoDBTableNight('12:00');
    await report_controller.reportdata(items, "night");


}, { timezone: timeZone });



// Update none t1 start dates

cron.schedule('0 9 1 * *', async () => {
    scanDynamoDBTableWithMonthStart()
    .then(() => console.log('Monthstart updated successfully'))
    .catch(err => console.error('Error:', err));
}, { timezone: timeZone });



//stockpile hourly cron, Use dynamic currentHour and targetDate within cron jobs

// Run at every hour except midnight (00:00) and noon (12:00)
cron.schedule('0 1-11,13-23 * * *', async () => {
    console.log('Cron job running every hour except midnight and noon');
    const currentHour = new Date().getHours();
    const targetDate = new Date();
    const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
    await report_stockpile.Stockpilecontroller(site, currentHour, targetDate);
}, { timezone: timeZone });

// Run specifically at 00:02 and 12:02
cron.schedule('2 0,12 * * *', async () => {
    console.log('Cron job running at 00:02 or 12:02');
    const currentHour = new Date().getHours();
    const targetDate = new Date();
    const site = await scanDynamoDBTableWithPlcIccid("7022249152040194002");
    await report_stockpile.Stockpilecontroller(site, currentHour, targetDate);
}, { timezone: timeZone });