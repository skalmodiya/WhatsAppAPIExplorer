const axios = require('axios')

class MetaWhatsApp {
  constructor({ token, phoneNumberId, apiVersion = 'v18.0' }) {
    this.token = token
    this.phoneNumberId = phoneNumberId
    this.baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`
  }

  _headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
  }

  async sendText(to, body) {
    const res = await axios.post(
      `${this.baseUrl}/messages`,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body } },
      { headers: this._headers() }
    )
    return { messageId: res.data.messages?.[0]?.id, timestamp: Date.now() }
  }

  async sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
    const res = await axios.post(
      `${this.baseUrl}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components }
      },
      { headers: this._headers() }
    )
    return { messageId: res.data.messages?.[0]?.id }
  }

  async sendMedia(to, type, url, caption = '') {
    const mediaObj = { link: url }
    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
      mediaObj.caption = caption
    }
    const res = await axios.post(
      `${this.baseUrl}/messages`,
      { messaging_product: 'whatsapp', to, type, [type]: mediaObj },
      { headers: this._headers() }
    )
    return { messageId: res.data.messages?.[0]?.id }
  }

  async sendReaction(to, messageId, emoji) {
    const res = await axios.post(
      `${this.baseUrl}/messages`,
      { messaging_product: 'whatsapp', to, type: 'reaction', reaction: { message_id: messageId, emoji } },
      { headers: this._headers() }
    )
    return { ok: true, data: res.data }
  }
}

module.exports = MetaWhatsApp
