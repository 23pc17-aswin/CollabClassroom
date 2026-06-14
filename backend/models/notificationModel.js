import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId:   { type: String, required: true, index: true },
  type:     { type: String, enum: ['assignment', 'grade', 'announcement', 'enrollment', 'test'], required: true },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  link:     { type: String },
  read:     { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
