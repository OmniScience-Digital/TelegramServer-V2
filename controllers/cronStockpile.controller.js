const { performance } = require('perf_hooks');
const { populateObjects } = require('../services/stockpile.service');
const { getCurrentDateFormatted, getCurrentTimeShift } = require('../utilities/time.utility');
const { StockpileScales } = require("../utilities/shift_utility");


exports.Stockpilecontroller = async (site) => {
    console.log('Route :Hourly Stockpile controller -: ');
    const start = performance.now();

    try {
   
        let item = site[0];

        let reportDataArray, plcIccid,sitestatus,  startTime, endTime, primaryScalesArray, sitename, scales, chatId;
        sitename = item.sitename?.S || '';


        //get current running date
        let date = getCurrentDateFormatted();
        //get times for report
        let { prevHour, currentHour, shift } = getCurrentTimeShift();


        startTime = prevHour;
        endTime = currentHour;


        //site parameters

        reportTo = item.reportTo?.S || '';
        email = item.email?.S || '';
        plcIccid = item.plcIccid?.S || '';
        monthstart = item.monthstart?.S || '';
        shiftFtp = item.shiftFtp?.S || '';
        sitestatus = item.sitestatus?.S || '';
        

        
        //sent to test group when in dev mode.
        chatId = (process.env.NODE_ENV==="development")?(process.env.chartIDTest):(item.telegramid?.S || '');

        

        // Destructure fore arrays and objects
        const { formulas, primaryScales,cyclonegraph} = item;

        scales = item.Telegramscales || [];
        primaryScalesArray = primaryScales?.L?.map((scale) => scale.S) || [];

        
 
        try {

            console.log('Processing StockPiles  Scales'); // Additional log for debugging

            //cyclone graph used for setpoints
            reportDataArray = await StockpileScales(startTime, endTime,scales, primaryScalesArray,'modbus-2-0', 'modbus-2-6','modbus-8-10' ,'modbus-4-10','modbus-6-10',plcIccid, shift, formulas,cyclonegraph);

            let telegramsg = formatTelegramMessage(sitename, date, endTime, startTime, reportDataArray);
       
       //  console.log(telegramsg)
         await populateObjects(telegramsg,  chatId);


        } catch (error) {
            console.error(`Error processing ${sitename}:`, error);

        }


    } catch (error) {
        console.error('Error in Stockpilecontroller:', error);
        
    }

    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
}



function formatTelegramMessage(siteName, date, currentHour, prevHour, data) {
    
    const {
        productionType,
        reportTitle,
        position,
        lastHourSPTons,
        lastHourRawBlend,
        lastHourWashBlend,
        progressiveSPTons,
        progressiveRawBlend,
        progressiveWashBlend,
        site_had_production,
        progressiveDay,
        stockpileRawratio,
        stockpileProductratio,
        progressiveRawtons,
        progressiveWashtons
    } = data;


    let formattedDate = new Date(date);
    let day = String(formattedDate.getDate()).padStart(2, '0'); // Adds leading zero if needed
    let month = String(formattedDate.getMonth() + 1).padStart(2, '0'); // Adds leading zero and month is zero-based
    let year = formattedDate.getFullYear();

    let newdate = `${day}/${month}/${year}`;

    let hours=`${prevHour} - ${currentHour}` ;




    let formattedMessage;
    if (site_had_production === 'yes') {
formattedMessage = `
${siteName}

#${productionType}
${reportTitle}
Position: ${position}
Date: ${newdate}
Time: ${hours}

-----------------------------------------
LAST HOUR

S/P tons: ${lastHourSPTons} tons
Raw Blend: ${lastHourRawBlend} %
Wash Blend: ${lastHourWashBlend} %
Raw Setpoint Ratio: ${stockpileRawratio} %
Product Setpoint Ratio: ${stockpileProductratio} %

-----------------------------------------
STOCKPILE 

S/P tons: ${progressiveSPTons} tons
Raw Blend: ${progressiveRawBlend} %
Wash Blend: ${progressiveWashBlend} %

-----------------------------------------
DAILY PROGRESSIVE 

S/P tons: ${progressiveDay} tons
Raw tons used: ${progressiveRawtons} tons
Wash tons used: ${progressiveWashtons} tons

-----------------------------------------
`.trim();
    }
    else {
formattedMessage = `
${siteName}

#${productionType}
${reportTitle}
Position : ${position}
Date     : ${newdate}
Time     : ${hours} 
--------------------------------------------------
TONS

Last Hour: 0.00 tons
Progressive Day: ${progressiveDay} tons

Blend Plant not on Production
--------------------------------------------------
STOCKPILE 

S/P tons: ${progressiveSPTons} tons
Raw Blend: ${progressiveRawBlend} %
Wash Blend: ${progressiveWashBlend} %
-------------------------------------------------
`.trim();
    }


    return formattedMessage;
}


