import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import {
  createClassroom, getMyClassrooms, getClassroomById,
  joinByCode, enrollStudents, removeStudent, archiveClassroom,
} from '../controllers/classroomController.js';

const router = Router();

router.get('/',                                          getMyClassrooms);
router.post('/',          checkRole(['ADMIN','TEACHER']), createClassroom);
router.post('/join',      checkRole(['STUDENT']),          joinByCode);
router.get('/:id',                                       getClassroomById);
router.post('/:id/enroll',         checkRole(['ADMIN','TEACHER']), enrollStudents);
router.delete('/:id/enroll/:studentId', checkRole(['ADMIN','TEACHER']), removeStudent);
router.patch('/:id/archive',       checkRole(['ADMIN','TEACHER']), archiveClassroom);

export default router;