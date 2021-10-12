import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom'
import Popup from './components/Popup/Popup'

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
      <Popup />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)
