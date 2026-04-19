const express = require('express');
const router = express.Router();
const { Notification } = require('../../models');
const R = require('../../utils/responseHelper');
const { authenticate } = require('../../middlewares/auth.middleware');
const { Op } = require('sequelize');

router.get('/', authenticate, async (req, res, next) => {
    try {
        const whereClause = req.user.role === 'superadmin' 
            ? {} 
            : { target_role: { [Op.in]: ['all', req.user.role] } };

        const notifs = await Notification.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        R.success(res, notifs);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
