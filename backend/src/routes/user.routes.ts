import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authService } from '../services/auth.service';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUser(req.userId!);
    res.json(user);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, document, business_name, business_logo } = req.body;
    const user = await authService.updateUser(req.userId!, { name, phone, document, business_name, business_logo });
    res.json(user);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
