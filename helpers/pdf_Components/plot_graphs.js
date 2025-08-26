
async function generateflowShifttonsGraph(doc, flowBuffer,cyclonebuffer, flowheight, shiftheight) {
    if (flowBuffer) {
      doc.image(flowBuffer, 25, flowheight, { width: 545, height: 150});
    } else {
      console.error('Error: flowbuffer is undefined.');
      return;
    }
  
    if (cyclonebuffer) {
      doc.image(cyclonebuffer, 25, shiftheight, { width: 545 , height: 150 });
    }
    else {
  
      doc.image("./assets/shift.png", 23, shiftheight, { width: 550, height: 150 })
        .fillColor("#61677A")
        .moveDown();
   }
  
  
  
  }


  async function generateTotalizerGraph(doc, totalizerbuffer,  shiftheight) {


          doc.image(totalizerbuffer, 25, shiftheight, { width: 545 , height: 150 });
     
            
   }


  async function drawPieCharts(doc, pieCharts) {

    
    // Iterate over pieCharts
    for (const pieChart of pieCharts) {
      const { buffer, cordx, cordy } = pieChart;
  
  
      // Check if both buffer and cordx, cordy are defined
      if (buffer && cordx !== undefined && cordy !== undefined) {
        // Use doc.image to embed the image in the PDF with width and height options
        doc.image(buffer, cordx, cordy, { width: 300, height: 115 }); // Adjust width and height as needed
      }
    }
  }
  module.exports={
    drawPieCharts,
    generateflowShifttonsGraph,generateTotalizerGraph
  }