const MedicalImage = require('../models/MedicalImage');
const { s3, bucketName } = require('../config/aws.config');
const uuid = require('uuid').v4;

exports.uploadMedicalImage = async (req, res) => {
  try {
    const { file } = req;
    const { patientId, title, description, contentType } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const key = `medical-images/${patientId}/${uuid()}-${file.originalname}`;
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    const s3Upload = await s3.upload(uploadParams).promise();

    // After S3 upload
if (file.mimetype === 'application/dicom') {
  const dicomData = await extractDICOMMetadata(file.buffer);
  if (dicomData) {
    newImage.metadata = dicomData;
  }
}
    
    // Save to DB
    const newImage = new MedicalImage({
      patient: patientId,
      title,
      description,
      imageUrl: s3Upload.Location,
      contentType,
      uploadedBy: req.user.id
    });
    
    await newImage.save();
    
    res.status(201).json(newImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add to your patientRoutes.js
// router.post('/:id/images', auth, upload.single('image'), uploadMedicalImage);