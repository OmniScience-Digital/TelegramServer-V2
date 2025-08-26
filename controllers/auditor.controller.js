const {auditorService} = require('../services/auditor.service');


exports.runauditReport = async (req, res) => {
    try {

        const {sitedata , startTime ,endTime} =req.body;

        let scales = sitedata.scales;
        
        let postgressStarttime =subtractTwoHours(startTime);
        let postgressEndtime =subtractTwoHours(endTime);

   
        //pull data for all scales from the backend.
        let allscalesFlowData = await auditorService(scales,postgressStarttime,postgressEndtime);

        
        //match correct jhb time
        const adjustedData = addTwoHoursToDates(allscalesFlowData);
       
        //use scalenames instead of iccids
        const scaledData = replaceIccidWithScalename(adjustedData, scales);

        //add times deltas
        const timedData = addTimeDeltas(scaledData);

        //exclude all negative flow.
        const cleanData = excludeNegativeFlow(timedData);
        console.log(calculateTotalHours(cleanData));
        


    } catch (error) {
        console.error('Error in auditdata:', error); // Log the error
        throw error; //  rethrow to propagate the error further
        
    }

    res.status(200).send('Data sent');
}



function subtractTwoHours(dateStr) {
    const date = new Date(dateStr);
    date.setHours(date.getHours() - 2);
 
    const pad = (num) => num.toString().padStart(2, '0');
    const formattedDate = 
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    
    return formattedDate;
}
  

function addTwoHoursToDates(data) {
    // Create a deep copy of the original data to avoid mutation
    const result = JSON.parse(JSON.stringify(data));
    
    // Iterate through each scale (ICCID) in the object
    for (const iccid in result) {
      if (result.hasOwnProperty(iccid)) {
        // Iterate through each entry in the scale's array
        result[iccid].forEach(entry => {
          // Convert the date string to a Date object if it isn't already
          const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
          
          // Add 2 hours (7200000 milliseconds)
          date.setTime(date.getTime() + 7200000);
          
          // Update the entry's date
          entry.date = date;
        });
      }
    }
    
    return result;
  }

  function replaceIccidWithScalename(allscalesFlowData, scales) {
    // Create a mapping object for quick lookup (iccid -> scalename)
    const scaleMap = {};
    scales.forEach(scale => {
      scaleMap[scale.iccid] = scale.scalename;
    });
  
    const result = {};
    
    // Iterate through each iccid in the original data
    for (const iccid in allscalesFlowData) {
      if (allscalesFlowData.hasOwnProperty(iccid)) {
        // Get the corresponding scalename
        const scalename = scaleMap[iccid];
        
        // Only process if we found a matching scalename
        if (scalename) {
          // Add the data with the new scalename key
          result[scalename] = allscalesFlowData[iccid];
          
          // Optionally: Also update the iccid inside each entry if needed
          result[scalename] = result[scalename].map(entry => ({
            ...entry,
            scalename: scalename // Add scalename to each entry (optional)
          }));
        } else {
          // If no matching scalename found, keep the original iccid
          result[iccid] = allscalesFlowData[iccid];
        }
      }
    }
    
    return result;
  }
  

  function addTimeDeltas(allscalesFlowData) {
    const result = {};
    
    for (const [scalename, entries] of Object.entries(allscalesFlowData)) {
      result[scalename] = entries.map((entry, index, array) => {
        if (index < array.length - 1) {
          // Compare with NEXT entry (which is OLDER in DESC order)
          const currentDate = new Date(entry.date);
          const nextDate = new Date(array[index + 1].date);
          const deltaMinutes = (currentDate - nextDate) / (1000 * 60); // Always positive
  
          return {
            ...entry,
            timeDeltaMinutes: deltaMinutes,
            timeDeltaHuman: formatDelta(deltaMinutes),
          };
        }
        
        // Last entry has no next entry to compare with
        return {
          ...entry,
          timeDeltaMinutes: null,
          timeDeltaHuman: 'Last reading',
        };
      });
    }
    
    return result;
  }
  
  // Helper: Format minutes as "Xm Ys" (always positive)
  function formatDelta(minutes) {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes % 1) * 60);
    return `${mins}m ${secs}s`;
  }



  function excludeNegativeFlow(allscalesFlowData) {
    const filteredData = {};
  
    // Loop through each scale 
    for (const [scalename, entries] of Object.entries(allscalesFlowData)) {
      // Filter out entries with negative values
      filteredData[scalename] = entries.filter(entry => {
        const value = parseFloat(entry.value); // Convert string to number
        return value > 0; // Keep only non-negative values
      });
    }
  
    return filteredData;
  }


  function calculateTotalHours(cleanData) {
    const result = {};
    
    // Loop through each scale in cleanData (e.g., CV19, CV20)
    for (const scaleName in cleanData) {
      const scaleData = cleanData[scaleName];
      let totalMinutes = 0;
      
      // Sum all timeDeltaMinutes for this scale
      for (const entry of scaleData) {
        totalMinutes += entry.timeDeltaMinutes;
      }
      
      // Convert minutes to hours and add to result
      result[scaleName] = totalMinutes / 60;
    }
    
    return result;
  }


// function calculateTotalMinutes(cleanData) {
//     const result = {};
    
//     // Loop through each scale in cleanData (e.g., CV19, CV20)
//     for (const scaleName in cleanData) {
//       const scaleData = cleanData[scaleName];
//       let totalMinutes = 0;
      
//       // Sum all timeDeltaMinutes for this scale
//       for (const entry of scaleData) {
//         if (entry.timeDeltaMinutes !== null) {  // Skip null values
//           totalMinutes += entry.timeDeltaMinutes;
//         }
//       }
      
//       // Store total minutes (no conversion needed)
//       result[scaleName] = totalMinutes;
//     }
    
//     return result;
//   }

//   const timestamp = "2025-04-12T04:01:21.801Z";
// const ms = new Date(timestamp).getTime(); // 1,746,158,481,801
// console.log(ms); // Proof: Matches our manual calculation!
  




// {
//   "siteId": "site-001",
//   "siteName": "Massive Site A",
//   "date": "2025-04-13",
//   "scales": [
//     {
//       "scaleId": "scale-01",
//       "readings": [
//         { "hour": "00:00", "value": 12.5 },
//         { "hour": "01:00", "value": 13.1 },
//         { "hour": "02:00", "value": 11.9 }
//       ]
//     },
//     {
//       "scaleId": "scale-02",
//       "readings": [
//         { "hour": "00:00", "value": 10.0 },
//         { "hour": "01:00", "value": 10.5 },
//         { "hour": "02:00", "value": 9.8 }
//       ]
//     }
//   ]
// }
