const { performance } = require('perf_hooks');
const { alarmPdfStockPile} = require("../utilities/shift_utility");
const { dertemine_numberofShifts, getCurrentDateFormatted } = require('../utilities/time.utility');
const { stockpilepopulateObjects } = require('../services/stockpile.service');
const { headers_helper } = require('../helpers/stockpile.headers');
const {parseScales}= require('../helpers/scalesCalc.helper');
const { canvas } = require('../resources/static.headers.resource');

exports.reportdata = async (sitedata,site,messageResult='closed') => {
    console.log('Route : Alarm Pdf controller -: ');
    const start = performance.now();


    let reportDataArray;

    let item,sitestatus, StockpileNumber,flag,  dayStart, primaryScalesArray,  sitename, runningtph, maxUtilization, chatId, totalMonthTarget, scaleType, flowtitle, flowiccid, plcIccid, scales, reportTo, email,shiftFtp;


    ({openTime,closeTime,StockpileNumber}=sitedata);

    
    item = site;

    sitename = item.sitename?.S || '';
        
    console.log('sitename' + ' : '+sitename);

    // Get current running date
    let enddate = getCurrentDateFormatted();


    shift = 'night';

    //check if report runs 24 hours

    
    scaleType = item.scale_type?.S || '';
    monthstart = item.monthstart?.S || '';
    flowtitle = item.flowtitle?.S || '';
    flowiccid = item.flowIccid?.S || '';
    totalMonthTarget = item.monthtarget?.N || '';
    runningtph = item.runningtph?.N || '';
    maxUtilization = item.maxUtilization?.N || '';
    plcIccid = item.plcIccid?.S || '';
    reportTo = item.reportTo?.S || '';
    email = item.email?.S || '';
    shiftFtp=item.shiftFtp?.S||'';
    sitestatus =item.sitestatus?.S||'';
    flag=sitestatus;



    //sent to test group when in dev mode.
    chatId = ((process.env.NODE_ENV==="development")||(flag!=='prod'))?(process.env.chartIDTest):(item.telegramid?.S || '');

    
    const { mtd_target, shifts_Ran } = dertemine_numberofShifts(item.dayStart?.S, item.nightStart?.S, item.extraShiftStart?.S, totalMonthTarget, monthstart, shift, enddate);

    // Destructure fore arrays and objects
    const { formulas, primaryScales, virtualDatapoints, reportHeaderRenames, cyclonegraph, plcFlow } = item;

    scales = item.Telegramscales || [];


    primaryScalesArray = primaryScales?.L?.map((scale) => scale.S) || [];
    const plcflowArray = parseScales(plcFlow);
    const cyclonegraphArray = parseScales(cyclonegraph);

    const formattedDate = new Date(monthstart).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    startDay = formattedDate + ' ,' + dayStart;

        try {
        
         reportDataArray = await alarmPdfStockPile(openTime, closeTime,scales, plcIccid, plcflowArray, cyclonegraphArray, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints);
    
         
        // Additional header handling if needed
         let { reportnameDate, reportDateTime } = await headers_helper(shift, reportDataArray, monthstart, '06:00', '06:00',sitedata);
         await stockpilepopulateObjects(reportDataArray,sitedata, chatId, `${sitename}${StockpileNumber}`, reportHeaderRenames, reportDateTime, reportTo, email,messageResult, flag);
            

        } catch (error) {
            console.error(`Error processing ${sitename}:`, error);
    
        }
        
    
    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
    
};



