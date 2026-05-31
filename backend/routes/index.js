const express = require('express')
const router = express.Router()

const healthRouter = require('./health')
const settingsRouter = require('./settings')
const webhookRouter = require('./webhook')
const messagesRouter = require('./messages')
const conversationsRouter = require('./conversations')
const contactsRouter = require('./contacts')
const aiRouter = require('./ai')
const baileysRouter = require('./baileys')
const comparisonRouter = require('./comparison')

router.use(healthRouter)
router.use(settingsRouter)
router.use(webhookRouter)
router.use(messagesRouter)
router.use(conversationsRouter)
router.use(contactsRouter)
router.use(aiRouter)
router.use(baileysRouter)
router.use(comparisonRouter)

module.exports = router
