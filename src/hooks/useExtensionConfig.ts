import { useEffect, useState } from 'react'
import {
  ExtensionConfig,
  getExtensionConfig,
  saveExtensionConfig,
} from '../utils/extensionConfig'

const useExtensionConfig = () => {
  const [config, setConfig] = useState<null | ExtensionConfig>(null)
  useEffect(() => {
    ;(async () => {
      setConfig(await getExtensionConfig())
    })()
  }, [])

  return [
    config,
    (updatedConfig: ExtensionConfig) => {
      setConfig(updatedConfig)
      saveExtensionConfig(updatedConfig)
    },
  ] as const
}

export default useExtensionConfig
