'use strict';

/**
 * Global Joi validation middleware
 * Usage: router.post('/', validate(schema), controller)
 * 
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - Request property to validate (default: 'body')
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,       // Kumpulkan semua error, bukan stop di error pertama
        allowUnknown: false,     // Tolak field yang tidak didefinisikan di schema
        stripUnknown: true,      // Hapus field yang tidak dikenal (keamanan)
    });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message.replace(/['"]/g, ''),
        }));
        return res.status(400).json({
            success: false,
            message: 'Validasi gagal',
            errors,
        });
    }

    // Replace req[source] dengan nilai yang sudah dibersihkan oleh Joi
    req[source] = value;
    next();
};

module.exports = { validate };
