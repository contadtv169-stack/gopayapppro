import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { gatewayCredentialService } from '../services/gateway-credential.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const creds = await gatewayCredentialService.list(req.userId!);
    res.json(creds);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post('/:gateway', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { gateway } = req.params;
    if (!['abacatepay', 'kryptgateway', 'pixgo'].includes(gateway)) {
      return res.status(400).json({ error: 'Gateway inválido' });
    }
    const { apiKey, secret, clientId, clientSecret } = req.body;
    const result = await gatewayCredentialService.save(req.userId!, gateway, { apiKey, secret, clientId, clientSecret });
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/:gateway', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await gatewayCredentialService.remove(req.userId!, req.params.gateway);
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
