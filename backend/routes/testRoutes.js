import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import {
  createTest, getTests, publishTest,
  getTestForStudent, submitTest, getTestResults,
} from '../controllers/testController.js';

const router = Router({ mergeParams: true });

router.post('/',              checkRole(['ADMIN','TEACHER']), createTest);
router.get('/',               getTests);
router.patch('/:id/publish',  checkRole(['ADMIN','TEACHER']), publishTest);
router.get('/:id/take',       checkRole(['STUDENT']),         getTestForStudent);
router.post('/:id/submit',    checkRole(['STUDENT']),         submitTest);
router.get('/:id/results',    getTestResults);

export default router;
