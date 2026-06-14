import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import { getChatHistory, deleteMessage } from '../controllers/chatController.js';

const router = Router({ mergeParams: true });

router.get('/',                              getChatHistory);
router.delete('/:messageId', checkRole(['ADMIN']), deleteMessage);

export default router;
