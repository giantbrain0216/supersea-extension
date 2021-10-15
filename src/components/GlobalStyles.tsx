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
          '*[class*="ActivitySearch"] div[role="listitem"]': {
            minHeight: 95,
          },
          '*[class*="ActivitySearch"] *[class*="FeatureTableCell"]:nth-child(2)': {
            width: '500px !important',
            flex: '0 0 500px !important',
          },
        })}
      />
      <ScopedCSSReset />,
    </>
  )
}

export default GlobalStyles
