const handleTelegramNotification = require('../helpers/telegram/telegram.helper');
const PDFTableGenerator = require('../helpers/pdf_templates/template_Stockpile');
const handleEmailNotification = require('../helpers/email/email_helper')



async function populateObjects(text, chatId ) {
  try {
    // Send to Telegram based on the flag
   
      await handleTelegramNotification(chatId, text);
    
 
  } catch (error) {
    // Handle errors during Telegram notification
    console.error('Error sending Telegram notification:', error);
  }
}




async function stockpilepopulateObjects(reportdata,sitedata, chatId, sitename, reportHeaderRenames, reportTime, reportTo, email, messageResult, flag) {

  const pdfname = sitename.replaceAll('/', '-');

    const report_name = `${pdfname}.pdf`;

  

    //creating pdf report here
    PDFTableGenerator(reportdata,sitedata, sitename, report_name, reportHeaderRenames,messageResult)
        .then(async (pdfBuffer) => {

    
            switch (reportTo) {
                case 'Email':
                    // Email helper
                    await handleEmailNotification(email, reportTime, pdfBuffer, sitename, report_name);
                    break;

                case 'Telegram':
                    // Send to Telegram based on the flag
                    flag === "test"
                        ? await handleTelegramNotification((process.env.chartIDTest), pdfBuffer, report_name)
                        : await handleTelegramNotification(chatId, pdfBuffer, report_name);
                    break;

                case 'Telegram & Email':
                    // Send to both Telegram and Email based on the flag
                    flag === "test"
                        ? (await handleEmailNotification("report-testing@omniscience.digital", reportTime, pdfBuffer, sitename, report_name),
                          await handleTelegramNotification((process.env.chartIDTest), pdfBuffer, report_name))
                        
                        : (await handleEmailNotification(email, reportTime, pdfBuffer, sitename, report_name),
                            await handleTelegramNotification(chatId, pdfBuffer, report_name));
                    break;

                default:
                    // Handle cases where reportTo doesn't match any expected values
                    console.error("Invalid reportTo value:", reportTo);
                    break;
            }


        })
        .catch((error) => {
            // Handle errors during PDF generation
            console.error('Error creating PDF:', error);
        });


}



module.exports = {
  populateObjects,stockpilepopulateObjects
};
