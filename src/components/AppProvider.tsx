import React, { useEffect, useState } from 'react'
import { IdProvider, ColorModeProvider } from '@chakra-ui/react'
import { toCSSVar } from '@chakra-ui/styled-system'
import {
  ThemeProvider as EmotionThemeProvider,
  ThemeProviderProps as EmotionThemeProviderProps,
} from '@emotion/react'
import theme from '../theme'
import { SCOPED_CLASS_NAME } from './ScopedCSSReset'
import { MEMBER_ROLES, User, UserProvider } from '../utils/user'
import { getUser } from '../utils/api'
import EventEmitter from 'events'

const ThemeProvider = (props: EmotionThemeProviderProps) => {
  const { theme, children } = props
  const computedTheme = React.useMemo(() => toCSSVar(theme), [theme])
  return (
    <EmotionThemeProvider theme={computedTheme}>
      {children}
    </EmotionThemeProvider>
  )
}

// Providers from ChakraProvider, without the global styles (we add these separately once)
const LeanChakraProvider = ({ children }: React.PropsWithChildren<{}>) => {
  return (
    <IdProvider>
      <ThemeProvider theme={theme}>
        <ColorModeProvider options={theme.config}>
          <span className={SCOPED_CLASS_NAME}>{children}</span>
        </ColorModeProvider>
      </ThemeProvider>
    </IdProvider>
  )
}

const events = new EventEmitter()
events.setMaxListeners(1000)
export const EventEmitterContext = React.createContext(events)
export const GlobalConfigContext = React.createContext({
  autoQueueAddresses: {} as Record<string, boolean>,
  refreshQueued: {} as Record<string, boolean>,
  autoImageReplaceAddresses: {} as Record<string, boolean>,
  imageReplaced: {} as Record<string, boolean>,
})

const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    ;(async () => {
      const user = await getUser()
      setUser({
        isMember: Boolean(user?.role && MEMBER_ROLES.includes(user.role)),
      })
    })()
  }, [])
  if (!user) return null
  return (
    <UserProvider value={user}>
      <LeanChakraProvider>{children}</LeanChakraProvider>
    </UserProvider>
  )
}

export default AppProvider
