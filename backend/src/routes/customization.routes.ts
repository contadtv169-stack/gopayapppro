import { Router, Response } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { customizationService } from '../services/customization.service';

const router = Router();

// Product checkout customization
router.get('/checkout/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await customizationService.getCheckoutCustomization(req.userId!, req.params.productId);
    res.json(data || {});
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/checkout/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await customizationService.saveCheckoutCustomization(req.userId!, req.params.productId, req.body);
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.get('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await customizationService.getAllCheckoutCustomizations(req.userId!);
    res.json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// Public: get checkout customization by product
router.get('/public/:productId', async (req, res: Response) => {
  try {
    const data = await customizationService.getPublicCheckoutCustomization(req.params.productId);
    res.json(data || {});
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// Page customization (for payment links)
router.get('/page/:pageType/:pageId?', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = await customizationService.getPageCustomization(req.userId!, req.params.pageType, req.params.pageId);
    res.json(data || {});
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/page/:pageType/:pageId?', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await customizationService.savePageCustomization(req.userId!, req.params.pageType, req.body, req.params.pageId);
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// Upload image to gallery
router.post('/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { image, filename } = req.body;
    const result = await customizationService.uploadImage(req.userId!, image, filename);
    res.json(result);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
