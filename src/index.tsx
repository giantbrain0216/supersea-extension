import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom'
import Popup from './components/Popup/Popup'
import { UserProvider } from './utils/user'

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider
      resetCSS
      theme={extendTheme({
        config: {
          initialColorMode: 'dark',
          useSystemColorMode: false,
        },
      })}
    >
      <ColorModeScript initialColorMode="dark" />
      <UserProvider
        allowNullUser
        loadFromBackgroundScript
        mockUser={
          process.env.NODE_ENV === 'development'
            ? { role: 'SUBSCRIBER' }
            : undefined
        }
      >
        <Popup />
      </UserProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)
