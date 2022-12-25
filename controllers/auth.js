const { validationResult } = require('express-validator')
const Staff = require('../models/staff')

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('viewStaff/login', {
        pageTitle: 'Đăng nhập',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('viewStaff/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        })
    }
    Staff.findOne({ email: email, password: password })
        .then(staff => {
            if (!staff) {
                return res.status(422).render('viewStaff/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Sai email hoặc mật khẩu.',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                })
            } else {
                req.session.isLoggedIn = true;
                req.session.staff = staff;
                req.session.isManager = staff.isManager
                return req.session.save(err => {
                    if (!staff.isManager) {
                        res.redirect('/');
                    } else {
                        res.redirect('/manager')
                    }
                })
            }

        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
}

exports.postLogout = (req, res) => {
    req.session.destroy(err => {
        console.log(err)
        res.redirect('/')
    })
}