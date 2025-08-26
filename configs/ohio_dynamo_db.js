const { DynamoDBClient, ScanCommand,QueryCommand,UpdateItemCommand } = require("@aws-sdk/client-dynamodb");




const client = new DynamoDBClient({
  region: process.env.AWS_REGION_2, // Replace with your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


const audittable = 'Telegramscales-etq3h3wwqjcijhmtd4mfwfbw4q-staging';


module.exports = {
  ScanCommand,
    audittable,client,QueryCommand,UpdateItemCommand
  };

