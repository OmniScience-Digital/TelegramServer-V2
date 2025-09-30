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





