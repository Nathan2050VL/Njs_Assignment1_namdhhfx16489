const { check, body } = require('express-validator');

const express = require('express');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin)

router.post('/login', [
    body('email')
    .isEmail()
    .withMessage('Địa chỉ email không hợp lệ.')
    .normalizeEmail(),
    body('password', 'Password has to be valid.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim()
], authController.postLogin)

router.post('/logout', authController.postLogout)


module.exports = router;