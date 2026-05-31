import { useCallback } from 'react'
import axios from 'axios'
import { useSettings } from '../contexts/SettingsContext'
import { useConnection } from '../contexts/ConnectionContext'
import { getMock } from '../lib/mockData'

export function useBackendApi() {
  const { backendUrl, waToken, waPhoneNumberId, aiApiKey, aiProxyUrl } = useSettings()
  const { backendOnline } = useConnection()

  const call = useCallback(async (method, path, body = null) => {
    if (!backendOnline) {
      await new Promise(r => setTimeout(r, 200))
      return getMock(path)
    }

    const headers = {}
    if (waToken) headers['X-WA-Token'] = waToken
    if (waPhoneNumberId) headers['X-Phone-Number-Id'] = waPhoneNumberId
    if (aiApiKey) headers['X-AI-Key'] = aiApiKey
    if (aiProxyUrl) headers['X-Proxy-Url'] = aiProxyUrl

    const res = await axios({ method, url: backendUrl + path, data: body, headers })
    return res.data
  }, [backendUrl, backendOnline, waToken, waPhoneNumberId, aiApiKey, aiProxyUrl])

  return { call, isDemo: !backendOnline }
}
