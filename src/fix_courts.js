import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Court from './models/Court.model.js';

const fixCourts = async () => {
   try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');

      // Update all courts to have empty facilities if they contain old string data
      // We will just empty every court's facilities array for safety, and user can reassign
      await Court.updateMany({}, { $set: { facilities: [] } });
      console.log('Successfully cleared facilities field for all courts.');
      
      process.exit(0);
   } catch (error) {
      console.error('Error fixing database:', error);
      process.exit(1);
   }
};

fixCourts();
