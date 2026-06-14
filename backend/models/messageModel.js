import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Made optional so we can support Private Direct Messages (DMs)
  classroomId: { type: String, index: true },
  
  // Added for Private DMs between two specific users
  receiverId:  { type: String, index: true },
  
  senderId:    { type: String, required: true },
  senderName:  { type: String, required: true },
  senderRole:  { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'], required: true },
  text:        { type: String, required: true, maxlength: 2000 },
  type:        { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  
  // Added to trigger red notification badges for unread DMs
  read:        { type: Boolean, default: false }, 
  
  fileKey:     { type: String },
  fileName:    { type: String },
}, { timestamps: true });

// Compound indexes for lightning-fast queries
messageSchema.index({ classroomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);