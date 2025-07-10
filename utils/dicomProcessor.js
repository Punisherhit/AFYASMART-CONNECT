const dicomParser = require('dicom-parser');

module.exports.extractDICOMMetadata = (buffer) => {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    return {
      patientName: dataSet.string('x00100010'),
      studyDate: dataSet.string('x00080020'),
      modality: dataSet.string('x00080060'),
      // Add more DICOM tags as needed
    };
  } catch (error) {
    console.error('DICOM Processing Error:', error);
    return null;
  }
};