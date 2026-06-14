import Message from '../models/messageModel.js';
import prisma from '../config/prisma.js';

/**
 * Get chat history for a classroom. Paginated via cursor.
 * @route GET /api/v2/classrooms/:classroomId/chat
 */
export const getChatHistory = async (req, res) => {
  const { classroomId } = req.params;
  const { before, limit = 50 } = req.query;
  const { id: userId, role } = req.dbUser;

  if (role !== 'ADMIN') {
    const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { teacherId: true } });
    const isTeacher = classroom?.teacherId === userId;
    const isStudent = await prisma.classroomEnrollment.findUnique({
      where: { userId_classroomId: { userId, classroomId } },
    });
    if (!isTeacher && !isStudent) return res.status(403).json({ error: 'Not a member of this classroom' });
  }

  const query = {
    classroomId,
    ...(before && { createdAt: { $lt: new Date(before) } }),
  };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(messages.reverse());
};

/**
 * Delete a chat message. Admin only (moderation).
 * @route DELETE /api/v2/classrooms/:classroomId/chat/:messageId
 */
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  await Message.findByIdAndDelete(messageId);
  res.json({ message: 'Message deleted' });
};

/**
 * Get private chat history between current user and target user.
 * Paginated via cursor.
 * @route GET /api/v2/users/:targetUserId/messages
 */
export const getDirectMessages = async (req, res) => {
  const { targetUserId } = req.params;
  const { before, limit = 50 } = req.query;
  const currentUserId = req.dbUser.id;

  const query = {
    $or: [
      { senderId: currentUserId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: currentUserId }
    ],
    ...(before && { createdAt: { $lt: new Date(before) } }),
  };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(messages.reverse());
};

/**
 * Get recent conversations for the sidebar.
 * @route GET /api/v2/users/me/conversations
 */
export const getRecentConversations = async (req, res) => {
  const currentUserId = req.dbUser.id;

  try {
    const conversations = await Message.aggregate([
      { 
        $match: { 
          // 🔥 CRITICAL FIX: Only grab Direct Messages, ignore Classroom messages!
          receiverId: { $exists: true, $ne: null }, 
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }] 
        } 
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", currentUserId] }, "$receiverId", "$senderId"] },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } }
    ]);

    // If there are no DMs yet, return an empty array safely
    if (!conversations || conversations.length === 0) {
        return res.json([]);
    }

    const userIds = conversations.map(c => c._id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true, email: true }
    });

    const result = conversations.map(c => ({
      user: users.find(u => u.id === c._id),
      lastMessage: c.lastMessage
    })).filter(c => c.user);

    res.json(result);
  } catch (err) {
    console.error("Recent Chats Error:", err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};