import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.list(req.userId!, unreadOnly);
    res.json(notifications);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markRead(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllRead(req.userId!);
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
