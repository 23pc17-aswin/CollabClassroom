import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import multerUpload from '../utils/fileUpload.js';
import {
  createAssignment, getAssignments, getAssignmentById,
  updateAssignment, deleteAssignment,
} from '../controllers/assignmentController.js';
import {
  submitAssignment, gradeSubmission,
  getSubmissionsForAssignment, getSubmissionDownloadUrl,
} from '../controllers/submissionController.js';

// mergeParams: true lets us access :classroomId from parent router
const router = Router({ mergeParams: true });

router.post('/',      checkRole(['ADMIN','TEACHER']), createAssignment);
router.get('/',       getAssignments);
router.get('/:id',    getAssignmentById);
router.patch('/:id',  checkRole(['ADMIN','TEACHER']), updateAssignment);
router.delete('/:id', checkRole(['ADMIN','TEACHER']), deleteAssignment);

// Submissions — nested under assignment
router.get('/:assignmentId/submissions',
  checkRole(['ADMIN','TEACHER']),
  getSubmissionsForAssignment);

router.post('/:assignmentId/submit',
  checkRole(['STUDENT']),
  multerUpload.single('file'),
  submitAssignment);

router.patch('/:assignmentId/submissions/:submissionId/grade',
  checkRole(['ADMIN','TEACHER']),
  gradeSubmission);

export default router;
