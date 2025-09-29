const cron = require('node-cron');
const {scanDynamoDBTableNight } = require('../../repositories/dynamodb_repository');
const report_controller = require('../../controllers/cron.controller');

// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';


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

