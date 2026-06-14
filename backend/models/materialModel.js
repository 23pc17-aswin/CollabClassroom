import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  classroomId:   { type: String, required: true, index: true },
  uploaderId:    { type: String, required: true },
  uploaderName:  { type: String, required: true },
  title:         { type: String, required: true },
  description:   { type: String },
  fileKey:       { type: String, required: true },
  fileName:      { type: String, required: true },
  fileType:      { type: String, required: true },
  fileSize:      { type: Number, required: true },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

materialSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.model('Material', materialSchema);
