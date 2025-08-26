const redis = require('redis');
const { performance } = require('perf_hooks');
const { scanDynamoDBTableWithPlcIccid } = require('../repositories/dynamodb_repository');
const { getMostrecentStockpileFlow, getMostrecentStockpileTotalizer, checkStockpileTotalizerReset } = require('../repositories/postgress_repository');
const { calculatorCalculationsStockpile } = require('../utilities/formulas.utility');
const { populateObjects } = require('../services/stockpile.service');
const { reportdata } = require('../controllers/alarm.pdf.controller');

const redisUrl = process.env.redisUrl;
const client = redis.createClient({ url: redisUrl });

client.connect()
    .then(() => console.log(`Connected to Redis at ${redisUrl}`))
    .catch(console.error);

exports.alarmStockpile = async (req, res) => {
    console.log('Route: Alarm Stockpile controller');
    const start = performance.now();

    try {
        const {
            Cv06TotalizerModbus,
            Cv10Totalizer,
            Cv11Totalizer,
            Cv06FlowModbus,
            iccid,
            StockpileNumber
        } = req.body;

        const Cv06Totalizer = await getMostrecentStockpileTotalizer(Cv06TotalizerModbus, iccid);
        const Reset_totalizer_check = await checkStockpileTotalizerReset(Cv06TotalizerModbus, iccid);



        const Cv06Flow = await getMostrecentStockpileFlow(Cv06FlowModbus, iccid);


        // Determine message result based on Cv06Totalizer and Cv06Flow conditions
        let messageResult =
            Cv06Totalizer > 7000 ? (Cv06Flow > 50 ? 're-opened' : 'closed') :
                Cv06Totalizer > 100 ? (Cv06Flow > 50 ? 'unpaused' : 'paused') :
                    Cv06Flow >= 50 ? 'open' : 'debug';


        //if they was a reset
        if (Reset_totalizer_check) {
            messageResult = 'reset';
        }
        

        const getResultMessage = (status) => {
            const messages = {
                closed: `Stockpile number ${StockpileNumber} closed.`,
                unpaused: `Stockpile number ${StockpileNumber} back on production.`,
                paused: `Stockpile number ${StockpileNumber} on pause.`,
                open: `Stockpile number ${StockpileNumber} opened.`,
                reset: `Stockpile number ${StockpileNumber} had a premature closure.`,
            };
            return messages[status] || 'Status unknown, check the situation.';
        };

        const userFriendlyMessage = getResultMessage(messageResult);

        const site = await scanDynamoDBTableWithPlcIccid(iccid);
        const item = site[0] || {};
        const chatId = process.env.NODE_ENV === "development" ? process.env.chartIDTest : (item.telegramid?.S || '');

        const tonnages = { CV06: Cv06Totalizer, CV10: Cv10Totalizer, CV11: Cv11Totalizer };
        const shiftStats = await calculatorCalculationsStockpile(item.formulas, tonnages);
        const previousValue = await client.get('message');

        const jhbTimestamp = getJhbTimestamp();


        if (previousValue !== userFriendlyMessage) {
            await client.set('message', userFriendlyMessage);
            const telegramMsg = formatTelegramMessage(userFriendlyMessage, Cv06Totalizer, shiftStats);
            await populateObjects(telegramMsg, chatId);

            if (messageResult === 'open') {
                await client.set('openTime', jhbTimestamp);
            } else if (messageResult === 'closed' || messageResult === 'reset') {
                await client.set('closeTime', jhbTimestamp);
                const openTime = await client.get('openTime');
            

                // Delay execution for 10 minutes 
               await new Promise(resolve => setTimeout(resolve, 600000));

               const closeCurrentTime = getJhbTimestamp();

               console.log(`Open Time: ${openTime}`);
               console.log(`Close Time: ${closeCurrentTime}`);

               const alarmObj = { openTime, closeTime: closeCurrentTime, ...req.body };
               

               await reportdata(alarmObj, item,messageResult);
               await client.set('openTime', '');
            }

            console.log('Stockpile Open Time', await client.get('openTime'));
        }



        // let telegramAlarm = await  reportdata({
        //     'openTime':'2025-04-01 14:08:02',
        //     'closeTime':'2025-04-09 15:15:22',
        //     ...req.body
        // },item);

        res.send('Done');
    } catch (error) {
        console.error('Error in alarm stockpile:', error);
        throw error;
    }


    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
};

function getJhbTimestamp() {
    const options = { timeZone: 'Africa/Johannesburg', hour12: false };
    const jhbDate = new Intl.DateTimeFormat('en-GB', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date());

    const [datePart, timePart] = jhbDate.split(', ');
    const [day, month, year] = datePart.split('/');
    const jhbTimestamp = `${year}-${month}-${day} ${timePart}`;

    return jhbTimestamp;
}



function formatTelegramMessage(message, Cv06Totalizer, shiftStats) {

    const data = shiftStats.reduce((acc, item) => ({ ...acc, ...item }), {});
    const {
        'Product Blending Ratio': progressiveWashBlend,
        'Raw Blending Ratio':  progressiveRawBlend
    } = data;


    return `
${message}
---------------------------------------
STOCKPILE 

S/P tons: ${Cv06Totalizer} tons
Raw Blend: ${progressiveRawBlend} %
Wash Blend: ${progressiveWashBlend} %
---------------------------------------
`.trim();
}
