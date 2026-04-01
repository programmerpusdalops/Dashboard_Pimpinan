'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { loginSchema, changePasswordSchema, validate } = require('./auth.validator');

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);               // Tidak perlu authenticate — token sudah expired
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);
router.put('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;

