/**
 * Submission routes.
 * @module routes/submissionRoutes
 */

import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import upload from '../utils/fileUpload.js';
import { submitAssignment, getSubmissions, gradeSubmission } from '../controllers/submissionController.js';

const router = Router();

/** POST /submissions/:assignmentId — student submits file */
router.post('/:assignmentId', checkRole(['STUDENT']), upload.single('file'), submitAssignment);

/** GET /submissions/:assignmentId — teacher/admin view all submissions */
router.get('/:assignmentId', checkRole(['TEACHER', 'ADMIN']), getSubmissions);

/** POST /submissions/:submissionId/grade */
router.post('/:submissionId/grade', checkRole(['TEACHER', 'ADMIN']), gradeSubmission);

export default router;
