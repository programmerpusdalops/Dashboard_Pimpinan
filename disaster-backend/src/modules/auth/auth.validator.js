'use strict';
const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password minimal 6 karakter',
        'any.required': 'Password wajib diisi',
    }),
});

const changePasswordSchema = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
    confirm_password: Joi.any().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Konfirmasi password tidak cocok',
    }),
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map((d) => d.message);
        return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
    }
    next();
};

module.exports = { loginSchema, changePasswordSchema, validate };
