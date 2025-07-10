const PDFDocument = require('pdfkit');

module.exports.generatePDF = (prescription) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.fontSize(20).text('AfyaSmart E-Prescription', { align: 'center' });
      doc.moveDown();
      
      // Add prescription details
      doc.fontSize(14).text(`Patient: ${prescription.patient.name}`);
      doc.text(`Doctor: ${prescription.doctor.name}`);
      doc.text(`Date: ${prescription.issueDate.toDateString()}`);
      doc.moveDown();
      
      // Add medications
      doc.fontSize(16).text('Medications:');
      prescription.medications.forEach(med => {
        doc.text(`${med.name} - ${med.dosage}`);
        doc.text(`Frequency: ${med.frequency}, Duration: ${med.duration}`);
        doc.moveDown();
      });
      
      // Add warnings if any
      if (prescription.interactions.length > 0) {
        doc.fontSize(14).fillColor('red').text('Warnings:');
        prescription.interactions.forEach(warning => {
          doc.text(`⚠️ ${warning}`);
        });
      }
      
      doc.end();
      
      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    } catch (err) {
      reject(err);
    }
  });
};