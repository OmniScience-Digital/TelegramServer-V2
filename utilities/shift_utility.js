const { subtractTwoHours, getCurrentDateFormatted, getPreviousDateFormatted } = require('./time.utility');
const { seriescaleCalcsFunc } = require('./series.scale.utility');
const { singlecaleCalcsFunc } = require('./single.scale.utility');
const { parallelcaleCalcsFunc } = require('./parallel.scale.utility')
const { plcScaleCalcsFunc, plcScale_noTypeCalcsFunc } = require('./plc.scale.utility.js')
const { handleShiftons, handlePlcShiftons, handleStockpileShiftons, handleAlarmStockpileShiftons } = require('./shiftons.utility');
const { flowutility, flowObjectValues, flowDataPLC, flowObjectDataPLC, cycloneDataPLC, StockpileValues } = require('./flow.utility');
const { calculatorCalculations, getValueByKey, parseFormulas, calculatorCalculationsStockpile } = require('./formulas.utility');
const { createDonutChart } = require('../helpers/charts/chart_helper');
const { samePlantCalc_ProcessScales, clearHashKeys } = require('../helpers/scalesCalc.helper');

//internal report status
const { internalreportStatusCalcsFunc } = require('./reportstatus.utility.js')

//repository

const { getProgressiveValues, getTotalizerProgressiveValues } = require('../repositories/postgress_repository');



module.exports.singleScale = async (startTime, endTime, scales, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp) => {
    try {


        
        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 


        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();

      
        //get   flow graphs

        //removing scales from shared plants
        let newscales = samePlantCalc_ProcessScales(scales);



        const myflowBuffer = await flowutility(postgress_start, postgress_end, startdate, enddate, newscales, canvas);



        const myflowObject = await flowObjectValues(postgress_start, postgress_end, startdate, enddate, runningtph, newscales);



        //check if site ran
        let flow_Values = await singlecaleCalcsFunc(shift, monthstart, shift, postgress_start, postgress_end, startdate, enddate, runningtph, maxUtilization, scales, primaryScalesArray)

        
        //handle shift tons 
        let tonnage = await handleShiftons(myflowBuffer, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization, shiftFtp)


        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)


        //plot pie charts

        var shift_statisticsPie = [];

        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }


        let cyclonegraphbuffer;


        shift_statisticsPie = { shift_statisticsPie }


        tonnage = clearHashKeys(tonnage);


        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };



        return combinedObject;

    } catch (error) {
        console.log(`Error processing  single scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }
}

module.exports.seriesScale = async (startTime, endTime, scales, monthstart, flowtitle, flowiccid, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp) => {
    try {

        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 
        
        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();

        //get   flow graphs

        //removing scales from shared plants
        let newscales = samePlantCalc_ProcessScales(scales);


        const myflowBuffer = await flowutility(postgress_start, postgress_end, startdate, enddate, newscales, canvas);

        //check if site ran
        let flow_Values = await seriescaleCalcsFunc(shift, postgress_start, postgress_end, flowtitle, flowiccid, startdate, enddate, runningtph, maxUtilization, scales, primaryScalesArray)

        //perscale flow average , run time and max
        const myflowObject = await flowObjectValues(postgress_start, postgress_end, startdate, enddate, runningtph, newscales);

       
        //handle shift tons 
        let tonnage = await handleShiftons(myflowBuffer, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization, shiftFtp)
        
        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts


        var shift_statisticsPie = [];

        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }

        let cyclonegraphbuffer;



        shift_statisticsPie = { shift_statisticsPie }

        tonnage = clearHashKeys(tonnage);

        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };


        return combinedObject;

    } catch (error) {
        console.log(`Error processing  series scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }
}

module.exports.parallelScale = async (startTime, endTime, scales, monthstart, flowtitle, flowiccid, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints, shiftFtp) => {
    try {


        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 

        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();


        let newscales = samePlantCalc_ProcessScales(scales);


        //get   flow graphs
        const myflowBuffer = await flowutility(postgress_start, postgress_end, startdate, enddate, newscales, canvas);

        const myflowObject = await flowObjectValues(postgress_start, postgress_end, startdate, enddate, runningtph, newscales);

        //check if site ran
        let flow_Values = await parallelcaleCalcsFunc(shift, postgress_start, postgress_end, flowtitle, flowiccid, startdate, enddate, runningtph, maxUtilization, scales, primaryScalesArray)

        //handle shift tons 
        let tonnage = await handleShiftons(myflowBuffer, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization, shiftFtp)


        let cyclonegraphbuffer;

        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts

        var shift_statisticsPie = [];

        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }


        shift_statisticsPie = { shift_statisticsPie }

        tonnage = clearHashKeys(tonnage);

        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };



        return combinedObject;





    } catch (error) {
        console.log(`Error processing  parallel scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }

}


module.exports.plcScale = async (startTime, endTime, scales, plcIccid, plcFlow, cyclonegraph, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints) => {
    try {


        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 

        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();

        //get   flow graphs


        const myflowBuffer = await flowDataPLC("flow", postgress_start, postgress_end, startdate, enddate, plcFlow, canvas, plcIccid);


        let cyclonegraphbuffer = (cyclonegraph.length > 0)
            ? await cycloneDataPLC(postgress_start, postgress_end, startdate, enddate, cyclonegraph, canvas, plcIccid)
            : null;


        //check if site ran
        let flow_Values = await plcScale_noTypeCalcsFunc(monthstart, shift, postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, maxUtilization, scales, primaryScalesArray, plcIccid);
        const myflowObject = await flowObjectDataPLC(postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, plcIccid);

        //handle shift tons 
        let tonnage = await handlePlcShiftons(myflowBuffer, plcIccid, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization)



        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts


        var shift_statisticsPie = [];

        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }



        shift_statisticsPie = { shift_statisticsPie }

        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };




        return combinedObject;


    } catch (error) {
        console.log(`Error processing  parallel scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }

}


module.exports.plcParallelScale = async (startTime, endTime, scales, plcIccid, plcFlow, flowtitle, flowiccid, cyclonegraph, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints) => {
    try {


        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 

        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();


        //get   flow graphs
        const myflowBuffer = await flowDataPLC("flow", postgress_start, postgress_end, startdate, enddate, plcFlow, canvas, plcIccid);
        let cyclonegraphbuffer = (cyclonegraph.length > 0)
            ? await cycloneDataPLC(postgress_start, postgress_end, startdate, enddate, cyclonegraph, canvas, plcIccid)
            : null;




        //check if site ran
        let flow_Values = await plcScaleCalcsFunc(monthstart, shift, postgress_start, postgress_end, startdate, enddate, runningtph, maxUtilization, scales, primaryScalesArray, plcIccid, flowtitle, flowiccid)


        const myflowObject = await flowObjectDataPLC(postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, plcIccid);


        //handle shift tons 
        let tonnage = await handlePlcShiftons(myflowBuffer, plcIccid, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization)


        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts

        var shift_statisticsPie = [];
        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }


        shift_statisticsPie = { shift_statisticsPie }
        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };




        return combinedObject;


    } catch (error) {
        console.log(`Error processing  parallel scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }

}

module.exports.plcSeriesScale = async (startTime, endTime, scales, plcIccid, plcFlow, flowtitle, flowiccid, cyclonegraph, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints) => {
    try {


        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        //get start and  end data 

        let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
        let enddate = getCurrentDateFormatted();



        //get   flow graphs
        const myflowBuffer = await flowDataPLC("flow", postgress_start, postgress_end, startdate, enddate, plcFlow, canvas, plcIccid);
        let cyclonegraphbuffer = (cyclonegraph.length > 0)
            ? await cycloneDataPLC(postgress_start, postgress_end, startdate, enddate, cyclonegraph, canvas, plcIccid)
            : null;



        //check if site ran
        let flow_Values = await plcScaleCalcsFunc(monthstart, shift, postgress_start, postgress_end, startdate, enddate, runningtph, maxUtilization, scales, primaryScalesArray, plcIccid, flowtitle, flowiccid)


        const myflowObject = await flowObjectDataPLC(postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, plcIccid);


        //handle shift tons 
        let tonnage = await handlePlcShiftons(myflowBuffer, plcIccid, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization)


        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts

        var shift_statisticsPie = [];
        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }


        shift_statisticsPie = { shift_statisticsPie }
        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };




        return combinedObject;


    } catch (error) {
        console.log(`Error processing  parallel scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }

}


module.exports.reportStatusUtility = async (startTime, endTime, triggerStart, triggerEnd, scales, shift) => {
    //pass correct dt  time
    var postgress_start = subtractTwoHours(startTime);
    var postgress_end = subtractTwoHours(endTime);


    //trigger postgress start

    var triggerpostgress_start = subtractTwoHours(triggerStart);
    var triggerpostgress_end = subtractTwoHours(triggerEnd);


    //get start and  end data 

    let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
    let enddate = getCurrentDateFormatted();


    let statusData = await internalreportStatusCalcsFunc(triggerpostgress_start, triggerpostgress_end, postgress_start, postgress_end, startdate, enddate, null, scales);



    // Convert it into an array of rows (in this case, 1 row):
    statusData = [statusData];



    return statusData;

}

module.exports.reportStatusUtilityPlc = async (startTime, endTime, triggerStart, triggerEnd, scales, plcIccid, shift) => {
    //pass correct dt  time
    var postgress_start = subtractTwoHours(startTime);
    var postgress_end = subtractTwoHours(endTime);


    //trigger postgress start

    var triggerpostgress_start = subtractTwoHours(triggerStart);
    var triggerpostgress_end = subtractTwoHours(triggerEnd);


    //get start and  end data 

    let startdate = (shift === 'day') ? getCurrentDateFormatted() : getPreviousDateFormatted();
    let enddate = getCurrentDateFormatted();



    let statusData = await internalreportStatusCalcsFunc(triggerpostgress_start, triggerpostgress_end, postgress_start, postgress_end, startdate, enddate, plcIccid, scales);



    // Convert it into an array of rows (in this case, 1 row):
    statusData = [statusData];



    return statusData;

}


module.exports.StockpileScales = async (startTime, endTime, scales, primaryScalesArray, spNum, position, progressiveDay,progressiveRawtons,progressiveWashtons, plcIccid, shift, formulas, setpoints) => {
    try {
        // Adjust time for Postgres
        const postgressStart = subtractTwoHours(startTime);
        const postgressEnd = subtractTwoHours(endTime);

        // Determine start and end dates based on shift
        const startDate = shift === 'day' ? getCurrentDateFormatted() : getPreviousDateFormatted();
        const endDate = getCurrentDateFormatted();

        // Fetch stockpile data
        const stockpileData = await StockpileValues(spNum, position, plcIccid);

        // Handle tonnage calculations
        const tonnage = await handleStockpileShiftons(postgressStart, postgressEnd, startDate, endDate, scales, primaryScalesArray, plcIccid, shift, parseFormulas(setpoints));

        // Organize tonnage data
        const tonnages = {
            total_shifttons: tonnage.lasthour.total_shifttons,
            mtdsTons: tonnage.progressive.mtdsObject
        };

        // Calculate shift stats and setpoint values
        const shiftStats = await calculatorCalculations(formulas, tonnages, null);
        const setpointValues = await calculatorCalculationsStockpile(formulas, tonnage.setpoint.setpoint_Vals);

        // Helper function to determine totalizer time
        const determineTotalizerTime = async (totalizer, plcIccid, totalizerType = null) => {
            const jhbTime = new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" });
            const targetDate = new Date(jhbTime);
            const currentHour = targetDate.getHours();

            if (currentHour <= 6) {
                targetDate.setDate(targetDate.getDate() - 1); // Adjust for the previous day
            }

            const formattedDate = `${targetDate.toISOString().split('T')[0]} 04:00`;

            if (totalizerType === "mtd") {
                const progressiveDayTons = await getProgressiveValues(totalizer, formattedDate, plcIccid);
                return progressiveDayTons['Totalizer Difference'];
            } else {
                const progressiveDayTons = await getTotalizerProgressiveValues(totalizer, formattedDate, plcIccid);
                const totalizerValue = progressiveDayTons.reduce((acc, curr, idx, arr) => {
                    if (idx === 0) return acc;
                    if (curr.value === 0) return acc; // Reset detected, stop summing
                    if (curr.value < arr[idx - 1].value) acc += arr[idx - 1].value - curr.value;
                    return acc;
                }, 0);

                return (totalizerValue || parseFloat(progressiveDayTons[0].value)).toFixed(2);
            }
        };

        // Determine progressive day value
        const progressiveDayValue = parseFloat(await determineTotalizerTime(progressiveDay, plcIccid, "mtd")) || 0.00;
        const progressiveRawtonsValue = parseFloat(await determineTotalizerTime(progressiveRawtons, plcIccid, "mtd")) || 0.00;
        const progressiveWashtonsValue = parseFloat(await determineTotalizerTime(progressiveWashtons, plcIccid, "mtd")) || 0.00;



        // Combine all data into a single object
        const combinedObject = {
            site_had_production: parseFloat(tonnage.lasthour['S/P tons']) > 0 ? 'yes' : 'no',
            productionType: 'Blending coal',
            position: stockpileData.position,
            reportTitle: stockpileData.SpNum,
            lastHourSPTons: tonnage.lasthour['S/P tons'],
            lastHourRawBlend: getValueByKey(shiftStats.shiftstats, 'Raw Blending Ratio'),
            lastHourWashBlend: getValueByKey(shiftStats.shiftstats, 'Product Blending Ratio'),
            stockpileRawratio: getValueByKey(setpointValues, 'Raw Blending Ratio'),
            stockpileProductratio: getValueByKey(setpointValues, 'Product Blending Ratio'),
            progressiveSPTons: tonnage.progressive['S/P tons'],
            progressiveRawBlend: getValueByKey(shiftStats.mtdstat, 'Raw Blending Ratio'),
            progressiveWashBlend: getValueByKey(shiftStats.mtdstat, 'Product Blending Ratio'),
            progressiveDay: progressiveDayValue,
            progressiveRawtons: progressiveRawtonsValue,
            progressiveWashtons: progressiveWashtonsValue,
            // progressiveRawtons: (progressiveShiftTons.find(item => item.key === 'CV10')?.ProgressiveTons) || 0.00,
            // progressiveWashtons: (progressiveShiftTons.find(item => item.key === 'CV11')?.ProgressiveTons) || 0.00,
        };

        return combinedObject;

    } catch (error) {
        console.error(`Error processing parallel scale in shift utility: ${error}`);
        throw error;
    }
};

module.exports.alarmPdfStockPile = async (openTime, closeTime, scales, plcIccid, plcFlow, cyclonegraph, monthstart, shift, primaryScalesArray, runningtph, maxUtilization, mtd_target, scaleType, canvas, formulas, virtualDatapoints) => {

    try {

       
        let stockpiledate, Sptime;

        const parseCloseTime = (stockpiletime) => {
            const [date, time] = stockpiletime.split(" ");
            return {
                stockpiledate: date,
                Sptime: time.slice(0, 5) // Extract HH:MM
            };
        };

        //-----------------------------------------------------------------------------------------//
        ({ stockpiledate, Sptime } = parseCloseTime(openTime));
        startTime = Sptime;

        let startdate = stockpiledate;

        //-----------------------------------------------------------------------------------------//


        ({ stockpiledate, Sptime } = parseCloseTime(closeTime));
        endTime = Sptime;

        let enddate = stockpiledate;

     

        //pass correct dt  time
        var postgress_start = subtractTwoHours(startTime);
        var postgress_end = subtractTwoHours(endTime);

        

        //get   flow graphs
        const myflowBuffer = await flowDataPLC("flow", postgress_start, postgress_end, startdate, enddate, plcFlow, canvas, plcIccid);


        let cyclonegraphbuffer = (cyclonegraph.length > 0)
            ? await cycloneDataPLC(postgress_start, postgress_end, startdate, enddate, cyclonegraph, canvas, plcIccid)
            : null;


        //check if site ran
        let flow_Values = await plcScale_noTypeCalcsFunc(monthstart, shift, postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, maxUtilization, scales, primaryScalesArray, plcIccid);
        const myflowObject = await flowObjectDataPLC(postgress_start, postgress_end, startdate, enddate, plcFlow, runningtph, plcIccid);


        //handle shift tons 
        let tonnage = await handleAlarmStockpileShiftons(myflowBuffer, plcIccid, shift, postgress_start, postgress_end, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization);

        let shiftStats = await calculatorCalculations(formulas, tonnage, flow_Values)
        //plot pie charts


        var shift_statisticsPie = [];

        if (tonnage.site_had_production) {
            shift_statisticsPie = await createDonutChart(shiftStats.shiftstats, canvas);

        }


        shift_statisticsPie = { shift_statisticsPie }

        const combinedObject = { ...flow_Values, ...{ cyclonegraphbuffer }, ...tonnage, ...shift_statisticsPie, ...{ primaryScalesArray }, ...shiftStats, ...{ myflowObject } };


        return combinedObject;


    } catch (error) {
        console.log(`Error processing  parallel scale in shift utility: ${error} `)
        throw error; // Optionally rethrow to propagate the error further
    }

}

