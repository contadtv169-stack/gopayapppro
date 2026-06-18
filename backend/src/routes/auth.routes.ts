import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    const result = await authService.register(name, email, password);
    res.status(201).json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) { res.status(401).json({ error: error.message }); }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token é obrigatório' });
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error: any) { res.status(401).json({ error: error.message }); }
});

export default router;
