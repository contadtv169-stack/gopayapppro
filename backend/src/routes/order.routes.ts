import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { orderService } from '../services/order.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.list(req.userId!, { status: status as string, page: Number(page), limit: Number(limit) });
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await orderService.getStats(req.userId!);
    res.json(stats);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/recent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await orderService.getRecent(req.userId!);
    res.json(orders);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await orderService.getById(req.params.id);
    if (order.user_id !== req.userId) return res.status(403).json({ error: 'Acesso negado' });
    res.json(order);
  } catch (error: any) { res.status(404).json({ error: error.message }); }
});

export default router;
