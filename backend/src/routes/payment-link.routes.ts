import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { paymentLinkService } from '../services/payment-link.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const links = await paymentLinkService.list(req.userId!);
    res.json(links);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, amount, product_id, slug, max_payments } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'Título e valor são obrigatórios' });
    const link = await paymentLinkService.create(req.userId!, { title, description, amount, product_id, slug, max_payments });
    res.status(201).json(link);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const link = await paymentLinkService.update(req.params.id, req.userId!, req.body);
    res.json(link);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await paymentLinkService.remove(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
