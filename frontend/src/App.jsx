import { SettingsProvider } from './contexts/SettingsContext'
import { ConnectionProvider } from './contexts/ConnectionContext'
import { WhatsAppProvider } from './contexts/WhatsAppContext'
import Layout from './components/Layout'

export default function App() {
  return (
    <SettingsProvider>
      <ConnectionProvider>
        <WhatsAppProvider>
          <Layout />
        </WhatsAppProvider>
      </ConnectionProvider>
    </SettingsProvider>
  )
}
