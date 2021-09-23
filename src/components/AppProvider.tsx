import React from 'react'
import { IdProvider, ColorModeProvider } from '@chakra-ui/react'
import { toCSSVar } from '@chakra-ui/styled-system'
import {
  ThemeProvider as EmotionThemeProvider,
  ThemeProviderProps as EmotionThemeProviderProps,
} from '@emotion/react'
import theme from '../theme'
import { SCOPED_CLASS_NAME } from './ScopedCSSReset'
import { User, UserProvider } from '../utils/user'

export const ThemeProvider = (props: EmotionThemeProviderProps) => {
  const { theme, children } = props
  const computedTheme = React.useMemo(() => toCSSVar(theme), [theme])
  return (
    <EmotionThemeProvider theme={computedTheme}>
      {children}
    </EmotionThemeProvider>
  )
}

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

// Providers from ChakraProvider, without the global styles (we add these separately once)
const AppProvider = ({
  children,
  user,
}: React.PropsWithChildren<{ user: User }>) => {
  return (
    <UserProvider value={user}>
      <LeanChakraProvider>{children}</LeanChakraProvider>
    </UserProvider>
  )
}

export default AppProvider
