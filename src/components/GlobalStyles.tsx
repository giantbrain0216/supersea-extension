import { Global } from '@emotion/react'
import ScopedCSSReset from './ScopedCSSReset'

const GlobalStyles = () => {
  return (
    <>
      <Global
        styles={(theme: any) => ({
          ':host, :root': theme.__cssVars,
        })}
      />
      <ScopedCSSReset />
    </>
  )
}

export default GlobalStyles
