import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import { provisionUser, listUsers, deactivateUser, getPlatformStats } from '../controllers/adminController.js';

const router = Router();
router.use(checkRole(['ADMIN']));

router.post('/users',                 provisionUser);
router.get('/users',                  listUsers);
router.patch('/users/:id/deactivate', deactivateUser);
router.get('/stats',                  getPlatformStats);

export default router;
