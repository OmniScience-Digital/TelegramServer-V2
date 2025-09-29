const { monthToDate, monthToDatewithOpeningsToDate, monthToDatePlcwithOpeningsToDate,StockpileMtd, graphQueryPlcShiftons, monthToPlcDate, hourlyShifttons, hourlyPlcShifttons, graphQueryShiftons, hourlyStockPileShifttons, progressiveStockpile, getSetpointValues, hourlyAlarmShifttons } = require('../repositories/postgress_repository');
const { generateAndSaveLineChart } = require('../helpers/charts/chart_helper');
const { groupByTimeIntervals } = require('../resources/report.resource')

const { calculateTimeIntervals, addTwoHours, calculateNormalsitesTimeIntervals } = require('./time.utility')
const { calculateDataPoints, parseFormulas, virtualCalculations } = require('./formulas.utility');



async function handleShiftons(myflowBuffer, shift, startTime, endTime, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization, shiftFtp) {
    try {
        let mtdsStarttime = (shift === 'day') ? startTime : endTime;

        //handle virtual datapoints
        let virtualformulas = parseFormulas(virtualDatapoints)

        //calculate mtd achieved
        let mtdsObject = [];
        let mtd_achieved = 0;
        //Daily shift tons 
        var dailytons = 0;


        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object

            let data = {
                scaleName: scale.scaleName.S,
                iccid: scale.iccid.S,
                openingScaletons: scale.openingScaletons.S
            };


            if (!scale.scaleName.S) {
                data = {
                    scaleName: scale.scaleName,
                    iccid: scale.iccid,
                    openingScaletons: scale.openingScaletons
                };
            }


            if (data.openingScaletons !== '') {

                const mtdTonns = await monthToDatewithOpeningsToDate(endTime, enddate, data.iccid, data.openingScaletons, shiftFtp)

                if (mtdTonns[0]) {
                    mtdsObject.push({ key: data.scaleName, month_to_date: Number(mtdTonns[0].month_to_date).toFixed(2) });



                    if (primaryScalesArray.includes(data.scaleName)) {
                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date)
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }


            } else {

                const mtdTonns = await monthToDate(mtdsStarttime, endTime, monthstart, enddate, data.iccid, shiftFtp)
                if (mtdTonns[0]) {

                    mtdsObject.push({ key: data.scaleName, month_to_date: Number(mtdTonns[0].month_to_date).toFixed(2) });



                    if (primaryScalesArray.includes(data.scaleName)) {
                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date)
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }



            }



        }

        

        mtdsObject = await virtualCalculations(mtdsObject, virtualformulas)
        //handle total sshift tons
        let total_shifttons = [];



        //shifttons by  time intervals 
        const timeintervals = calculateNormalsitesTimeIntervals(startTime, endTime);
        var primaryScaleslen = primaryScalesArray.length


        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object
            const data = {
                scaleName: scale.scaleName.S || scale.scaleName, // Initialize to empty string if null
                iccid: scale.iccid.S || scale.iccid,

            };



            let shift_tons = await hourlyShifttons(shift, startTime, endTime, startdate, enddate, data.iccid, shiftFtp);



            var shiftonsranges = groupByTimeIntervals(timeintervals, shift_tons.hourlytons);


            // Check if the first Shifttons value is less than 0
            if (parseFloat(shift_tons.Shifttons[0]) < 0) {
                shift_tons.Shifttons[0] = parseFloat(shift_tons.Accumulating_Sum);
            }



            if (primaryScalesArray.includes(data.scaleName)) {

                if (shift_tons.Shifttons[0]) {
                    dailytons += parseFloat(shift_tons.Shifttons[0]);

                }


            }






            const formattedData = {
                key: data.scaleName, // Assign to ScaleName instead of data.scaleName
                Shifttons: shiftonsranges,
                Daytons: shift_tons.Shifttons[0] || 0, // Initialize to 0 if null or NaN
            };

            total_shifttons.push(formattedData);
        }

        if (scaleType === 'parallel') {

            mtd_achieved = parseFloat(mtd_achieved / primaryScaleslen)
            dailytons = parseFloat(dailytons / primaryScaleslen)
        }


        var site_had_production = (parseFloat(dailytons) > parseFloat(maxUtilization)) ? true : false;


        //Use Promise.all for parallel processing
        let shiftonsGraphPromises = scales.map(async (scale) => {
            // Check if the required properties exist
            if (!scale.scaleName || !scale.iccid) {
                console.error('Missing properties in scale:', scale);
                return { key: 'Unknown', error: 'Missing properties' };  // Return a default object to avoid breaking the map
            }

            const data = {
                scaleName: scale.scaleName.S || scale.scaleName,
                iccid: scale.iccid.S || scale.iccid,
            };
            const key = data.scaleName;
            const iccid = data.iccid;

            try {
                let graphShiftons = await graphQueryShiftons(startTime, endTime, startdate, enddate, iccid);
                return { key, data: graphShiftons };  // Use key instead of iccid
            } catch (error) {
                // Log or handle individual errors
                console.error(`Error for ICCID ${iccid}:`, error);
                return { key, error: error.message };  // Use key instead of iccid
            }
        });

        // Wait for all promises to resolve
        let shiftonsGraphDataArray = await Promise.all(shiftonsGraphPromises);

        const shiftonsBuffer = await generateAndSaveLineChart("shift", shiftonsGraphDataArray, canvas)
            .catch(error => {
                console.error('Error generating and saving line chart:', error);
            });



        total_shifttons = virtualformulas.length > 0 ? calculateDataPoints(virtualformulas, total_shifttons) : total_shifttons;

        total_shifttons = total_shifttons.map(shiftton => {
            const correspondingMtds = mtdsObject.find(mtd => mtd.key === shiftton.key);
            if (correspondingMtds) {
                shiftton.month_to_date = parseFloat(correspondingMtds.month_to_date);
            }
            return shiftton;
        });


        let shifttonsObject = {
            'montTodate_Target': parseFloat(mtd_target).toFixed(2),
            'mtd_achieved': parseFloat(mtd_achieved).toFixed(2),
            'mtdsTons': mtdsObject,
            'total_shifttons': total_shifttons,
            "flowGraphBuffer": myflowBuffer,
            "shiftgraphBuffer": shiftonsBuffer,
            'shifttons': parseFloat(dailytons).toFixed(2),
            'site_had_production': site_had_production

        }

        return shifttonsObject

    } catch (error) {
        console.error(`Error in handleShifttons:`, error);
        throw error; // Optionally rethrow to propagate the error further
    }

}

async function handlePlcShiftons(myflowBuffer, plcIccid, shift, startTime, endTime, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization) {
    try {

        let mtdsStarttime = (shift === 'day') ? startTime : endTime;



        //calculate mtd achieved
        let mtdsObject = [];
        let mtd_achieved = 0;
        //Daily shift tons 
        var dailytons = 0;



        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object


            let data = {
                scaleName: scale.scaleName.S,
                iccid: scale.iccid.S,
                openingScaletons: scale.openingScaletons.S
            };


            if (!scale.scaleName.S) {
                data = {
                    scaleName: scale.scaleName,
                    iccid: scale.iccid,
                    openingScaletons: scale.openingScaletons
                };
            }



            if (data.openingScaletons !== '') {
            
                const mtdTonns = await monthToDatePlcwithOpeningsToDate(endTime, enddate, data.iccid, plcIccid, data.openingScaletons)

                if (mtdTonns[0]) {
                    mtdsObject.push({ key: data.scaleName, month_to_date: parseFloat(mtdTonns[0].month_to_date).toFixed(1) });

                    if (primaryScalesArray.includes(data.scaleName)) {

                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date);
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }


            } else {
                
                const mtdTonns = await monthToPlcDate(mtdsStarttime, endTime, monthstart, enddate, data.iccid, plcIccid)
                if (mtdTonns[0]) {
                    mtdsObject.push({ key: data.scaleName, month_to_date: mtdTonns[0].month_to_date });
                    if (primaryScalesArray.includes(data.scaleName)) {

                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date);
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }



            }



        }


        //handle total sshift tons
        let total_shifttons = [];

        //shifttona by by time intervals 

        const timeintervals = calculateNormalsitesTimeIntervals(startTime, endTime);

        var primaryScaleslen = primaryScalesArray.length



        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object
            const data = {
                scaleName: scale.scaleName.S || scale.scaleName, // Initialize to empty string if null
                iccid: scale.iccid.S || scale.iccid,

            };


            let shift_tons = await hourlyPlcShifttons(shift, startTime, endTime, startdate, enddate, data.iccid, plcIccid);



            var shiftonsranges = groupByTimeIntervals(timeintervals, shift_tons.hourlytons);


            // Check if the first Shifttons value is less than 0
            if (parseFloat(shift_tons.Shifttons[0]) < 0) {
                shift_tons.Shifttons[0] = parseFloat(shift_tons.Accumulating_Sum);
            }



            if (primaryScalesArray.includes(data.scaleName)) {

                if (shift_tons.Shifttons[0]) {
                    dailytons += parseFloat(shift_tons.Shifttons[0]);

                }

            }



            const formattedData = {
                key: data.scaleName, // Assign to ScaleName instead of data.scaleName
                Shifttons: shiftonsranges,
                Daytons: shift_tons.Shifttons[0] || 0, // Initialize to 0 if null or NaN
            };

            total_shifttons.push(formattedData);
        }



        if (scaleType === 'parallel') {

            mtd_achieved = parseFloat(mtd_achieved / primaryScaleslen)
            dailytons = parseFloat(dailytons / primaryScaleslen)
        }


        // // Use Promise.all for parallel processing
        let shiftonsGraphPromises = scales.map(async (scale) => {
            // Check if the required properties exist
            if (!scale.scaleName || !scale.iccid) {
                console.error('Missing properties in scale:', scale);
                return { key: 'Unknown', error: 'Missing properties' };  // Return a default object to avoid breaking the map
            }

            const data = {
                scaleName: scale.scaleName.S || scale.scaleName,
                iccid: scale.iccid.S || scale.iccid,
            };
            const key = data.scaleName;
            const iccid = data.iccid;

            try {

                let graphShiftons = await graphQueryPlcShiftons(startTime, endTime, startdate, enddate, iccid, plcIccid);
                return { key, data: graphShiftons };  // Use key instead of iccid
            } catch (error) {
                // Log or handle individual errors
                console.error(`Error for ICCID ${iccid}:`, error);
                return { key, error: error.message };  // Use key instead of iccid
            }
        });

        // Wait for all promises to resolve
        let shiftonsGraphDataArray = await Promise.all(shiftonsGraphPromises);



        const shiftonsBuffer = await generateAndSaveLineChart("shift", shiftonsGraphDataArray, canvas)
            .catch(error => {
                console.error('Error generating and saving line chart:', error);
            });


        //handle virtual datapoints
        let virtualformulas = parseFormulas(virtualDatapoints)


        total_shifttons = virtualformulas.length > 0 ? calculateDataPoints(virtualformulas, total_shifttons) : total_shifttons;



        var site_had_production = (parseFloat(dailytons) > parseFloat(maxUtilization)) ? true : false;

        total_shifttons = total_shifttons.map(shiftton => {
            const correspondingMtds = mtdsObject.find(mtd => mtd.key === shiftton.key);
            if (correspondingMtds) {
                shiftton.month_to_date = parseFloat(correspondingMtds.month_to_date);
            }
            return shiftton;
        });


        let shifttonsObject = {
            'montTodate_Target': parseFloat(mtd_target).toFixed(2),
            'mtd_achieved': parseFloat(mtd_achieved).toFixed(2),
            'mtdsTons': mtdsObject,
            'total_shifttons': total_shifttons,
            "flowGraphBuffer": myflowBuffer,
            "shiftgraphBuffer": shiftonsBuffer,
            'shifttons': parseFloat(dailytons).toFixed(2),
            'site_had_production': site_had_production

        }


        return shifttonsObject

    } catch (error) {
        console.error(`Error in handlePlcShifttons:`, error);
        throw error; // Optionally rethrow to propagate the error further
    }


}

async function handleStockpileShiftons(startTime, endTime, startdate, enddate, scales, primaryScalesArray, plcIccid, shift, setpointArray) {
    try {


        //calculate mtd achieved
        let mtdsObject = [];
        let mtd_achieved = 0;


        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object


            let data = {
                scaleName: scale.scaleName.S,
                iccid: scale.iccid.S,
            };


            if (!scale.scaleName.S) {
                data = {
                    scaleName: scale.scaleName,
                    iccid: scale.iccid,

                };
            }



            const mtdTonns = await progressiveStockpile(data.iccid, plcIccid);

            mtdsObject.push({
                key: data.scaleName,
                month_to_date: mtdTonns['value'] ?? 0  // Default to 0 if null, undefined, or empty
            });


            if (primaryScalesArray.includes(data.scaleName)) {
                mtd_achieved += parseFloat(mtdTonns['value'])
            }



        }


        //handle total shift tons
        let total_shifttons = [];

        //Hour tons
        var Hourtons = 0;


        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object
            const data = {
                scaleName: scale.scaleName.S || scale.scaleName, // Initialize to empty string if null
                iccid: scale.iccid.S || scale.iccid,

            };

            let shift_tons = await hourlyStockPileShifttons(shift, startTime, endTime, startdate, enddate, data.iccid, plcIccid);



            // Check if the first Shifttons value is less than 0
            if (parseFloat(shift_tons.Shifttons[0]) < 0) {
                shift_tons.Shifttons[0] = parseFloat(shift_tons.Accumulating_Sum);
            }



            if (primaryScalesArray.includes(data.scaleName)) {

                if (shift_tons.Shifttons[0]) {
                    Hourtons += parseFloat(shift_tons.Shifttons[0]);

                }

            }



            const formattedData = {
                key: data.scaleName, // Assign to ScaleName instead of data.scaleName
                Daytons: shift_tons.Shifttons[0] || 0, // Initialize to 0 if null or NaN
            };

            total_shifttons.push(formattedData);
        }



        let setpoint_Vals = {};

        for (const setPoint of setpointArray) {
            const mykey = Object.keys(setPoint)[0];
            const value = setPoint[mykey];

            const setpointVal = await getSetpointValues(value, plcIccid);

            setpoint_Vals[mykey] = setpointVal; // Store in a single object
        }



        let lasthour = {
            'S/P tons': parseFloat(Hourtons).toFixed(2),
            total_shifttons,

        }

        let setpoint = {
            setpoint_Vals
        }

        let progressive = {
            'S/P tons': parseFloat(mtd_achieved).toFixed(2),
            mtdsObject
        };

        let combinedObject = {
            lasthour,
            setpoint,
            progressive
        }

        return combinedObject;

    } catch (error) {
        console.error(`Error in seriescaleCalcsFunc:`, error);
        throw error; // Optionally rethrow to propagate the error further
    }


}


async function handleAlarmStockpileShiftons(myflowBuffer, plcIccid, shift, startTime, endTime, startdate, enddate, scales, monthstart, primaryScalesArray, mtd_target, scaleType, canvas, virtualDatapoints, maxUtilization) {
    try {

        let mtdsStarttime = (shift === 'day') ? startTime : endTime;



        //calculate mtd achieved
        let mtdsObject = [];
        let mtd_achieved = 0;
        //Daily shift tons 
        var dailytons = 0;



        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object


            let data = {
                scaleName: scale.scaleName.S,
                iccid: scale.iccid.S,
                openingScaletons: scale.openingScaletons.S
            };

            

            if (!scale.scaleName.S) {
                data = {
                    scaleName: scale.scaleName,
                    iccid: scale.iccid,
                    openingScaletons: scale.openingScaletons
                };
            }


            if (data.openingScaletons !== '') {
                const mtdTonns = await monthToDatePlcwithOpeningsToDate(endTime, enddate, data.iccid, plcIccid, data.openingScaletons)

        

                if (mtdTonns[0]) {
                    mtdsObject.push({ key: data.scaleName, month_to_date: mtdTonns[0].month_to_date });

                    if (primaryScalesArray.includes(data.scaleName)) {
                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date)
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }


            } else {
                
                const mtdTonns = await monthToPlcDate(mtdsStarttime, endTime, monthstart, enddate, data.iccid, plcIccid);
                
                if (mtdTonns[0]) {
                    mtdsObject.push({ key: data.scaleName, month_to_date: mtdTonns[0].month_to_date });
                    if (primaryScalesArray.includes(data.scaleName)) {
                        mtd_achieved += parseFloat(mtdTonns[0].month_to_date)
                    }
                } else {
                    mtdsObject.push({ key: data.scaleName, month_to_date: 0 });

                }



            }





        }


        //handle total sshift tons
        let total_shifttons = [];

        const reportStarttime = addTwoHours(startTime);
        const reportEndtime = addTwoHours(endTime);


        //shifttons by b time intervals 
        const timeintervals = calculateTimeIntervals(startdate, reportStarttime, enddate, reportEndtime);


        var primaryScaleslen = primaryScalesArray.length

        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object
            const data = {
                scaleName: scale.scaleName.S || scale.scaleName, // Initialize to empty string if null
                iccid: scale.iccid.S || scale.iccid,

            };


            let shift_tons = await hourlyAlarmShifttons(startTime, endTime, startdate, enddate, data.iccid, plcIccid);

            var shiftonsranges = groupByTimeIntervals(timeintervals, shift_tons.hourlytons);




            // Check if the first Shifttons value is less than 0
            if (parseFloat(shift_tons.Shifttons[0]) < 0) {
                shift_tons.Shifttons[0] = parseFloat(shift_tons.Accumulating_Sum);
            }



            if (primaryScalesArray.includes(data.scaleName)) {

                if (shift_tons.Shifttons[0]) {
                    dailytons += parseFloat(shift_tons.Accumulating_Sum);

                }

            }


            const formattedData = {
                key: data.scaleName, // Assign to ScaleName instead of data.scaleName
                Shifttons: shiftonsranges,
                Daytons: shift_tons.Accumulating_Sum || 0, // Initialize to 0 if null or NaN
            };

            total_shifttons.push(formattedData);
        }


        if (scaleType === 'parallel') {

            mtd_achieved = parseFloat(mtd_achieved / primaryScaleslen)
            dailytons = parseFloat(dailytons / primaryScaleslen)
        }


        //Use Promise.all for parallel processing
        let shiftonsGraphPromises = scales.map(async (scale) => {
            // Check if the required properties exist
            if (!scale.scaleName || !scale.iccid) {
                console.error('Missing properties in scale:', scale);
                return { key: 'Unknown', error: 'Missing properties' };  // Return a default object to avoid breaking the map
            }

            const data = {
                scaleName: scale.scaleName.S || scale.scaleName,
                iccid: scale.iccid.S || scale.iccid,
            };
            const key = data.scaleName;
            const iccid = data.iccid;

            try {

                let graphShiftons = await graphQueryPlcShiftons(startTime, endTime, startdate, enddate, iccid, plcIccid);
                return { key, data: graphShiftons };  // Use key instead of iccid
            } catch (error) {
                // Log or handle individual errors
                console.error(`Error for ICCID ${iccid}:`, error);
                return { key, error: error.message };  // Use key instead of iccid
            }
        });

        // Wait for all promises to resolve
        let shiftonsGraphDataArray = await Promise.all(shiftonsGraphPromises);


        const shiftonsBuffer = await generateAndSaveLineChart("shift", shiftonsGraphDataArray, canvas)
            .catch(error => {
                console.error('Error generating and saving line chart:', error);
            });


        //handle virtual datapoints
        let virtualformulas = parseFormulas(virtualDatapoints)


        total_shifttons = virtualformulas.length > 0 ? calculateDataPoints(virtualformulas, total_shifttons) : total_shifttons;



        var site_had_production = (parseFloat(dailytons) > parseFloat(maxUtilization)) ? true : false;

        total_shifttons = total_shifttons.map(shiftton => {
            const correspondingMtds = mtdsObject.find(mtd => mtd.key === shiftton.key);
            if (correspondingMtds) {
                shiftton.month_to_date = parseFloat(correspondingMtds.month_to_date);
            }
            return shiftton;
        });

        let data ={ scaleName: 'CV06', iccid: 'modbus-8-0', openingScaletons: '' }

         mtd_achieved = await StockpileMtd(mtdsStarttime, endTime, monthstart, enddate, data.iccid, plcIccid);

       


        let shifttonsObject = {
            'montTodate_Target': parseFloat(mtd_target).toFixed(2),
            'mtd_achieved': parseFloat(mtd_achieved).toFixed(2),
            'mtdsTons': mtdsObject,
            'total_shifttons': total_shifttons,
            "flowGraphBuffer": myflowBuffer,
            "shiftgraphBuffer": shiftonsBuffer,
            'shifttons': parseFloat(dailytons).toFixed(2),
            'site_had_production': site_had_production

        }

         

        return shifttonsObject

    } catch (error) {
        console.error(`Error in handlePlcShifttons:`, error);
        throw error; // Optionally rethrow to propagate the error further
    }


}


async function handleHourlyShiftons(startTime, endTime, startdate, enddate, scales, primaryScalesArray, plcIccid, shift, formulas) {
    try {

        //handle total shift tons
        let total_shifttons = [];
        let progressiveObject=[];

        //Hour tons
        var Hourtons = 0;


        for (const scale of scales) {
            // Extract scaleName, iccid, and openingScaletons from the scale object
            const data = {
                scaleName: scale.scaleName.S || scale.scaleName, // Initialize to empty string if null
                iccid: scale.iccid.S || scale.iccid,

            };
            

            let shift_tons = await hourlyStockPileShifttons(shift, startTime, endTime, startdate, enddate, data.iccid, plcIccid);

            // Check if the first Shifttons value is less than 0
            if (parseFloat(shift_tons.Shifttons[0]) < 0) {
                shift_tons.Shifttons[0] = parseFloat(shift_tons.Accumulating_Sum);
            }


            if (primaryScalesArray.includes(data.scaleName)) {

                if (shift_tons.Shifttons[0]) {
                    Hourtons += parseFloat(shift_tons.Shifttons[0]);
                }

            }


            const formattedData = {
                key: data.scaleName, // Assign to ScaleName instead of data.scaleName
                Daytons: shift_tons.Shifttons[0] || 0, // Initialize to 0 if null or NaN
            };

            total_shifttons.push(formattedData);
        }


        let lasthour = { total_shifttons };

        let progressive = {  progressiveObject };

        let combinedObject = {
            lasthour,
            progressive
        }

         return combinedObject;

    } catch (error) {
        console.error(`Error in seriescaleCalcsFunc:`, error);
        throw error; // Optionally rethrow to propagate the error further
    }


}



module.exports = { handleShiftons, handlePlcShiftons, handleHourlyShiftons, handleStockpileShiftons, handleAlarmStockpileShiftons }
