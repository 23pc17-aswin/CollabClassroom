import { Router } from 'express';
import { checkRole } from '../middleware/rbac.js';
import {
  getMyProfile, updateMyProfile,
  getMyNotifications, markNotificationsRead,
  getStudentGrades, listUsers, searchUsers
} from '../controllers/userController.js';
// 🔥 UPDATE THIS IMPORT:
import { getDirectMessages, getRecentConversations } from '../controllers/chatController.js';

const router = Router();

router.get('/me',                       getMyProfile);
router.patch('/me',                     updateMyProfile);
router.get('/me/notifications',         getMyNotifications);
router.patch('/me/notifications/read',  markNotificationsRead);

// 🔥 NEW: Fetch recent chats for the sidebar
router.get('/me/conversations',         getRecentConversations);

router.get('/search',                   searchUsers);

router.get('/me/grades',                checkRole(['STUDENT']), (req, res, next) => {
  req.params.userId = req.dbUser.id;
  next();
}, getStudentGrades);

router.get('/:userId/grades',           getStudentGrades);
router.get('/:targetUserId/messages',   getDirectMessages);
router.get('/',                         checkRole(['ADMIN','TEACHER']), listUsers);

export default router;