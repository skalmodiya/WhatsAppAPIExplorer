const express = require('express')
const router = express.Router()
const MetaWhatsApp = require('../services/metaWhatsApp')
const baileysService = require('../services/baileysService')

router.post('/api/comparison/send', async (req, res) => {
  const { to, text } = req.body
  if (!to || !text) return res.status(400).json({ error: 'to and text required' })

  const token = req.headers['x-wa-token'] || process.env.WHATSAPP_TOKEN
  const phoneNumberId = req.headers['x-phone-number-id'] || process.env.WHATSAPP_PHONE_NUMBER_ID

  const results = { meta: null, baileys: null }
  const t0Meta = Date.now()
  const t0Baileys = Date.now()

  const [metaResult, baileysResult] = await Promise.allSettled([
    (async () => {
      const start = Date.now()
      const meta = new MetaWhatsApp({ token, phoneNumberId })
      const data = await meta.sendText(to, text)
      return { ...data, latencyMs: Date.now() - start }
    })(),
    (async () => {
      const start = Date.now()
      if (baileysService.getState() !== 'connected') throw new Error('Baileys not connected')
      const data = await baileysService.sendText(to, text)
      return { ...data, latencyMs: Date.now() - start }
    })()
  ])

  results.meta = metaResult.status === 'fulfilled'
    ? { success: true, ...metaResult.value }
    : { success: false, error: metaResult.reason?.response?.data || metaResult.reason?.message }

  results.baileys = baileysResult.status === 'fulfilled'
    ? { success: true, ...baileysResult.value }
    : { success: false, error: baileysResult.reason?.message }

  res.json(results)
})

module.exports = router
