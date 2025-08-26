const { getFlowValues,getPlcFlowValues,getPlcCycloneValues,runtimeFlowValues,runtimePlcAllscalesFlow ,getStockpileValues} = require('../repositories/postgress_repository');
const { generateAndSaveLineChart } = require('../helpers/charts/chart_helper');

module.exports.flowutility = async (startTime, endTime, startdate, enddate, scales, canvas) => {


    // // Use Promise.all for parallel processing
    const reportPromises = scales.map(async (scale) => {

        
     // Check if the required properties exist
        if (!scale.scaleName || !scale.iccid) {
            console.error('Missing properties in scale for flow graph plot:', scale);
            return { key: 'Unknown', error: 'Missing properties' };  // Return a default object to avoid breaking the map
        }

        const data = {
            scaleName: scale.scaleName.S||scale.scaleName,
            iccid: scale.iccid.S || scale.iccid,

        };
        const key = data.scaleName;
        const iccid = data.iccid;

        


        try {



            let myflowData = await getFlowValues(startTime, endTime, startdate, enddate, iccid);


            return { key, data: myflowData };  // Use key instead of iccid
        } catch (error) {
            // Log or handle individual errors
            console.error(`Error for ICCID ${iccid}:`, error);
            return { key, error: error.message };  // Use key instead of iccid
        }
    });


    // Wait for all promises to resolve
    var flowDataArray = await Promise.all(reportPromises);




    var flowImage = await generateAndSaveLineChart("flow", flowDataArray, canvas)
        .catch(error => {
            console.error('Error generating and saving line chart:', error);
        });


    return flowImage;




}

//genarate flow images for pigeon iccids
module.exports.flowObjectValues = async (startTime, endTime, startdate, enddate,runningtph, scales) => {


    // // Use Promise.all for parallel processing
    const reportPromises = scales.map(async (scale) => {
        // Check if the required properties exist
        if (!scale.scaleName  || !scale.iccid ) {
            console.error('Missing properties in scale for flow graph plot:', scale);
            return { key: 'Unknown', error: 'Missing properties' };  // Return a default object to avoid breaking the map
        }
        const data = {
            scaleName: scale.scaleName.S||scale.scaleName,
            iccid: scale.iccid.S||scale.iccid,

        };
        const key = data.scaleName;
        const iccid = data.iccid;


        try {



        let myflowData = await runtimeFlowValues(startTime, endTime, startdate, enddate, runningtph, iccid);


            return { key, flowData: myflowData[0]  };  // Use key instead of iccid
        } catch (error) {
            // Log or handle individual errors
            console.error(`Error for ICCID ${iccid}:`, error);
            return { key, error: error.message };  // Use key instead of iccid
        }
    });


    // Wait for all promises to resolve
    var flowDataArray = await Promise.all(reportPromises);


 return flowDataArray;


}

//genarate flow images for plcs 
module.exports.flowDataPLC = async(graphtitle,startTime, endTime,startdate,enddate, plcflowArray, canvas,plcIccid)=>{

    
    // // Use Promise.all for parallel processing
    const reportPromises = plcflowArray.map(async (scale) => {
    const key = Object.keys(scale)[0];
    const title = scale[key];
    

   

   
    try {
        
        let myflowData=await getPlcFlowValues(startTime, endTime, startdate, enddate,title, plcIccid);
     

        
        return { key, data: myflowData };  // Use key instead of iccid
    } catch (error) {
        // Log or handle individual errors
        console.error(`Error for ICCID ${plcIccid}:`, error);
        return { key, error: error.message };  // Use key instead of iccid
    }
});

    // Wait for all promises to resolve
    var flowDataArray = await Promise.all(reportPromises);

 
      
    var flowImage = await generateAndSaveLineChart(graphtitle,flowDataArray,canvas,startTime,endTime)



    return flowImage;
    
}


module.exports.flowObjectDataPLC = async (startTime, endTime, startdate, enddate, plcflowArray, runningtph,plcIccid) => {


    // Use Promise.all for parallel processing
    const reportPromises = plcflowArray.map(async (scale) => {
        const key = Object.keys(scale)[0];
        const title = scale[key];

    

        try {

        

            // Assuming runtimePlcFlow is a defined function that returns flow data
          let myflowData = await runtimePlcAllscalesFlow(startTime, endTime, startdate, enddate,plcIccid, title, runningtph);
            return { key, flowData: myflowData[0] };  // Use key instead of iccid
        } catch (error) {
            // Log or handle individual errors
            console.error(`Error for ICCID ${title}:`, error);
            return { key, error: error.message };  // Use key instead of iccid
        }
    });

    // Wait for all promises to resolve
    var flowDataArray = await Promise.all(reportPromises);

    return flowDataArray;
}


module.exports.cycloneDataPLC = async(postgress_start, postgress_end, startdate, enddate, cyclonegraph, canvas,plcIccid)=>{

    
    // // Use Promise.all for parallel processing
    const reportPromises = cyclonegraph.map(async (scale) => {
    const key = Object.keys(scale)[0];
    const title = scale[key];

  
    try {
        
        let myflowData = await getPlcCycloneValues(postgress_start, postgress_end, startdate, enddate,title, plcIccid);

   

        
        return { key, data: myflowData };  // Use key instead of iccid
    } catch (error) {
        // Log or handle individual errors
        console.error(`Error for ICCID ${plcIccid}:`, error);
        return { key, error: error.message };  // Use key instead of iccid
    }
});

    // Wait for all promises to resolve
    var flowDataArray = await Promise.all(reportPromises);

    var flowImage = await generateAndSaveLineChart("flow2",flowDataArray,canvas,postgress_start,postgress_end)


    return flowImage;
    
}


module.exports.StockpileValues = async (spNum, position, plcIccid) => {
    try {
        // Assuming getStockpileValues is a function that takes these parameters and returns stockpile data
        let stockpileData = await getStockpileValues(spNum, position, plcIccid);
        
        return stockpileData;  // Return the fetched stockpile data

    } catch (error) {
        // Handle and log the error
        console.error(`Error fetching stockpile data for ICCID ${plcIccid}:`, error);
        return { error: error.message };  // Return the error message for further handling
    }
};
