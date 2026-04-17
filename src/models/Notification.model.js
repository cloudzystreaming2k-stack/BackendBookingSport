import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
         index: true,
      },
      title: {
         type: String,
         required: true,
      },
      message: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ['booking', 'system'],
         default: 'booking',
      },
      bookingId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Booking',
         default: null,
      },
      isRead: {
         type: Boolean,
         default: false,
      },
   },
   { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
