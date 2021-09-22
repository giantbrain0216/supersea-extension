import { extendTheme } from '@chakra-ui/react'

const parseCookies = () => {
  return document.cookie.split(';').reduce<Record<string, any>>((res, c) => {
    const [key, val] = c.trim().split('=').map(decodeURIComponent)
    try {
      return Object.assign(res, { [key]: JSON.parse(val) })
    } catch (e) {
      return Object.assign(res, { [key]: val })
    }
  }, {})
}

const getOpenSeaTheme = () => {
  const { theme } = parseCookies()
  return theme?.theme || 'light'
}

const theme = extendTheme({
  config: {
    useSystemColorMode: false,
    initialColorMode: getOpenSeaTheme(),
  },
})

theme.styles.global = () => ({})
window.localStorage['chakra-ui-color-mode'] = theme.config.initialColorMode

export default theme
