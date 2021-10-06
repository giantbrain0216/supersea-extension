import { Global } from '@emotion/react'
import { HEIGHT as ASSET_INFO_HEIGHT } from './AssetInfo'
import ScopedCSSReset from './ScopedCSSReset'

const GlobalStyles = () => {
  return (
    <>
      <Global
        styles={(theme: any) => ({
          ':host, :root': theme.__cssVars,
          'article.AssetSearchList--asset': {
            paddingBottom: ASSET_INFO_HEIGHT,
            position: 'relative',
          },
        })}
      />
      <ScopedCSSReset />,
    </>
  )
}

export default GlobalStyles
