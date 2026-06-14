import mongoose from 'mongoose';

/**
 * Study Material Metadata
 * The actual binary lives in MinIO; this doc holds the reference.
 */
const studyMaterialSchema = new mongoose.Schema(
    {
        classroomId: { type: String, required: true, index: true }, // PostgreSQL UUID
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, maxlength: 1000 },
        s3Key: { type: String, required: true },   // MinIO object key
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedById: { type: String, required: true }, // PostgreSQL UUID
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

// CRITICAL: This provides the 'default' export the controller is looking for
export default StudyMaterial;