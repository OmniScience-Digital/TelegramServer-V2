//get site by id
const { singleScale, seriesScale, parallelScale, plcScale, plcParallelScale } = require("../utilities/shift_utility");
const { dertemine_numberofShifts, getCurrentDateFormatted } = require('../utilities/time.utility');
const { populateObjects } = require('../services/telegram.service');
const { headers_helper } = require('../helpers/headers.helper')
const { canvas } = require('../resources/static.headers.resource');


exports.runReportdata = async (req, res) => {

    // Access the id from the request body
    const { sitesArrays, run_type, shift } = req.body;

    let report = [];


    if (Array.isArray(sitesArrays)) {

        report = sitesArrays;
    }
    else {
        report.push(sitesArrays)
    }




    let reportDataArray;

    let item, startTime, reportTo, email, dayStart, primaryScalesArray, endTime, sitename, runningtph, maxUtilization, totalMonthTarget, startDay, scaleType, flowtitle, flowiccid, plcIccid, scales, shiftFtp, chatId;


    let items = report;
    let sites = items;



    try {
        // Destructure sites
        for (let index = 0; index < items.length; index++) {
            item = sites[index];

            sitename = item.sitename || '';

            if (!shift) continue;
            if (run_type === 'off') continue;


            console.log(sitename + ' : ')

            //get current running date
            let enddate = getCurrentDateFormatted();


            if (shift === 'day') {
                startTime = item.dayStart || '';
                endTime = item.dayStop || '';
            } else if (shift === 'night') {
                startTime = item.nightStart || '';
                endTime = item.nightStop || '';
            } else if (shift === 'extradayshift') {
                startTime = item.extraShiftStart || '';
                endTime = item.extraShiftStop || '';
            }

            totalMonthTarget = item.TotalmonthTarget || '';
            scaleType = item.scale_type || '';
            monthstart = item.monthstart || '';
            flowtitle = item.flowtitle || '';
            flowiccid = item.flowIccid || '';
            totalMonthTarget = item.monthtarget || '';
            runningtph = item.runningtph || '';
            maxUtilization = item.maxUtilization || '';
            plcIccid = item.plcIccid || '';
            email = item.email || '';
            reportTo = item.reportTo || '';
            shiftFtp = item.shiftFtp || '';

            chatId = (run_type === 'prod') ? item.telegramid : (process.env.chartIDTest);


            const { mtd_target, shifts_Ran } = dertemine_numberofShifts(item.dayStart, item.nightStart, item.extraShiftStart, totalMonthTarget, monthstart, shift, enddate)


            //destructe fore arrays and objects
            const { formulas, primaryScales, virtualDatapoints, reportHeaderRenames, cyclonegraph, plcFlow } = item;
            scales = item.scales || [];




            primaryScalesArray = primaryScales.map((scale) => scale) || [];

            const parseScales = (otherscales) => {

                // Set default value for otherscales if it's not provided or empty
                const sortedscales = otherscales && otherscales.length && otherscales[0] !== '[]'
                    ? JSON.parse(otherscales[0])
                    : [];


                // Check if sortedscales is an array and map over it
                return Array.isArray(sortedscales) ? sortedscales.map((scale) => {
                    // Get the key of the object inside scale
                    const scaleKey = Object.keys(scale)[0];

                    // Get the value of the key
                    const scaleValue = scale[scaleKey] || '';

                    // Create the scale object
                    const scaleObject = {};
                    scaleObject[scaleKey] = scaleValue;

                    return scaleObject;
                }) : [];
            };


            const plcflowArray = parseScales(plcFlow);
            const cyclonegraphArray = parseScales(cyclonegraph)


            const formattedDate = new Date(monthstart).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            startDay = formattedDate + ' ,' + dayStart;


            if (!plcIccid) {
                switch (scaleType) {
                    case 'single':
                        console.log('Processing single scale type');

                        reportDataArray = await singleScale(startTime, endTime, scales, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp);
                        break;
                    case 'series':
                        console.log('Processing series scale type');
                        reportDataArray = await seriesScale(startTime, endTime, scales, monthstart, flowtitle, flowiccid, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp);
                        break;
                    case 'parallel':
                        console.log('Processing parallel scale type');
                        reportDataArray = await parallelScale(startTime, endTime, scales, monthstart, flowtitle, flowiccid, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp);
                        break;
                }
            } else {
                if (scaleType === 'parallel') {
                    console.log('Processing plc parallel scale type'); // Additional log for debugging

                    reportDataArray = await plcParallelScale(startTime, endTime, scales, plcIccid, plcflowArray, flowtitle, flowiccid, cyclonegraphArray, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints);
                } else {
                    console.log('Processing plc  scale type'); // Additional log for debugging

                    reportDataArray = await plcScale(startTime, endTime, scales, plcIccid, plcflowArray, cyclonegraphArray, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints);
                }
            }




            let { reportnameDate, reportDateTime } = await headers_helper(shift, reportDataArray, monthstart, endTime, startTime);

            await populateObjects(reportDataArray, chatId, sitename, reportHeaderRenames, reportDateTime, reportTo, email, reportnameDate, run_type);

        }
    } catch (error) {
        console.error('Error in reportdata:', error); // Log the error
        throw error; //  rethrow to propagate the error further
    }


    res.status(200).send('Data received');
};




