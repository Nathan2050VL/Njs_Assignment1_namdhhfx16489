const path = require('path');

const express = require('express');

const staffController = require('../controllers/staff');

const isAuth = require('../middleware/is-auth')

const router = express.Router();

router.get('/', isAuth, staffController.getIndex)

router.get('/staff', isAuth, staffController.getStaff)

router.get('/work', isAuth, staffController.getWork)

router.get('/covid', isAuth, staffController.getCovid)

router.get('/covid/:covidId', isAuth, staffController.getCovidPdf)

router.get('/manager', isAuth, staffController.getManager)

router.get('/manager/:staffId', isAuth, staffController.getStaffManager)

router.get('/covid-manager/:staffId', isAuth, staffController.getCovidManager)

router.post('/covid', isAuth, staffController.postCovid)

router.post('/post-image', isAuth, staffController.postImage)

router.post('/start-work', isAuth, staffController.postWorking)

router.post('/end-work', isAuth, staffController.postEndWorking)

router.post('/end-day-work', isAuth, staffController.postEndDayWork)

router.post('/off-work', isAuth, staffController.postOffWork)

router.post('/work', isAuth, staffController.postWork)

router.post('/delete', isAuth, staffController.postDelete)

router.post('/confirm', isAuth, staffController.postConfirm)

router.post('/select-month', isAuth, staffController.postSelectMonth)

// router.post('/covid-manager', isAuth, staffController.postCovidManager)

module.exports = router;