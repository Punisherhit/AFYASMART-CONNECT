const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
    });
    console.log('Successfully connected to MongoDB ✅');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;


// // config/db.js
// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });

//     console.log(`Successfully connected to MongoDB ✅`);
//   } catch (err) {
//     console.error(`Database connection error: ${err.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;