import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { requireAuth } from '@/middlewares/auth.middleware';

const router = Router();

// Auth Routes Definition
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.post('/change-password', requireAuth, AuthController.changePassword);

export default router;
