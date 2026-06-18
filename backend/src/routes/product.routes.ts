import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { productService } from '../services/product.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const products = await productService.list(req.userId!);
    res.json(products);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const product = await productService.getById(req.params.id);
    if (product.user_id !== req.userId) return res.status(403).json({ error: 'Acesso negado' });
    res.json(product);
  } catch (error: any) { res.status(404).json({ error: error.message }); }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, image_url, product_type } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    const product = await productService.create(req.userId!, { name, description, price, image_url, product_type });
    res.status(201).json(product);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const product = await productService.update(req.params.id, req.userId!, req.body);
    res.json(product);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await productService.remove(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
