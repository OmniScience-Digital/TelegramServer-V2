const cron = require('node-cron');
const { scanDynamoDBTableWithMonthStart } = require('../../repositories/dynamodb_repository');

// Set the time zone to Johannesburg, South Africa (SAST)
const timeZone = 'Africa/Johannesburg';


// Update none t1 start dates

cron.schedule('0 9 1 * *', async () => {
    scanDynamoDBTableWithMonthStart()
    .then(() => console.log('Monthstart updated successfully'))
    .catch(err => console.error('Error:', err));
}, { timezone: timeZone });



//internal status report
cron.schedule('0 0 * * *', async () => {
    console.log('Status report at midnight');
    let triggerStart ="12:00",triggerEnd= "00:00",shift='day';
    await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

}, { timezone: timeZone });


//internal status report
cron.schedule('0 12 * * *', async () => {
    console.log('Status report at noon');
    let triggerStart ="00:00",triggerEnd= "12:00",shift='night';
    await Statusreportcontroller.Statusreportcontroller(triggerStart,triggerEnd,shift);

}, { timezone: timeZone });