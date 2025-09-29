const { processData } = require('../services/mqtt.service');



exports.Mqttcontroller = async (req, res) => {
    try {
        // Access the id from the request body
        const { csvData, adMapping, address } = req.body;

        console.log(req.body);

        let date;
        let iccid;

        const headers = csvData[0];


        const headerIndexMap = {};
        headers.forEach((header, index) => {
            headerIndexMap[header] = index;
        });


        // delete adMapping['Name'];

        let jsonResult = {
            "modbus-dev": {
                "addr": address,
                "pts": [],
            },
        };

        let combinedResult = [];


        

        // Loop through each row in csvData (excluding headers)
        for (let i = 1; i < csvData.length; i++) {

            const row = csvData[i];


            //reset obj
            jsonResult = {
                "modbus-dev": {
                    "addr": address,
                    "pts": [],
                },
            };



            for (let key in adMapping) {
                if (key === "Name") {
                    delete adMapping[key];
                }

                if (adMapping.hasOwnProperty(key)) {

                    if (row[0]) {

                        iccid = row[0];
                    }

                    date = row[1];
                    
                    const adValue = adMapping[key];
                    const columnIndex = headerIndexMap[key];

                    if (columnIndex !== undefined) {
                        jsonResult["modbus-dev"]["pts"].push({
                            "ad": adValue,
                            "rt": 3.0,
                            "va": row[columnIndex],
                        });
                    } else {
                        console.warn(`Column ${key} not found in headers`);
                    }
                }
            }

            if(!date)continue;
            jsonResult['date'] = parseDate(date);
            
            

            let databaseJson = JSON.stringify(jsonResult);
            console.log(databaseJson)

            combinedResult.push(databaseJson)


        }



        try {

           // console.log(iccid)
             //console.log(combinedResult)
            // Publish MQTT message
            // await processData(combinedResult, '7082229037010123040');
          // await processData(combinedResult, iccid);
        } catch (error) {
            console.error(`Error publishing MQTT message: ${error}`);
            throw error; // Optionally rethrow to propagate the error further
        }



        res.status(200).send('Data Published');
    } catch (error) {
        console.error('Error in Mqttcontroller:', error);
        res.status(500).send('Internal server error');
    }
}



function parseDate(dateString) {
    // Trim whitespace first
    dateString = dateString.trim();

    // If it's already in ISO format, return as-is
    if (dateString.endsWith('Z') || dateString.includes('T')) {
        return dateString;
    }

    // Handle formats with YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2} \d{1,2}:\d{2}/.test(dateString)) {
        // Normalize the time part (fix "4:000" to "04:00")
        const [datePart, timePart] = dateString.split(' ');
        let [hours, minutes] = timePart.split(':');
        hours = hours.padStart(2, '0');
        minutes = minutes.substring(0, 2).padStart(2, '0'); // Take first 2 digits if more exist
        const normalizedTime = `${hours}:${minutes}`;
        
        return new Date(`${datePart.replace(/\//g, '-')}T${normalizedTime}:00`).toISOString();
    }
    
    // Handle formats with DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}/.test(dateString)) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        let [hours, minutes] = timePart.split(':');
        hours = hours.padStart(2, '0');
        minutes = minutes.substring(0, 2).padStart(2, '0');
        const normalizedTime = `${hours}:${minutes}`;
        
        return new Date(`${year}-${month}-${day}T${normalizedTime}:00`).toISOString();
    }

    // Handle formats with YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}/.test(dateString)) {
        const normalized = dateString.replace(' ', 'T') + ':00';
        return new Date(normalized).toISOString();
    }

    throw new Error(`Unsupported date format: ${dateString}`);
}