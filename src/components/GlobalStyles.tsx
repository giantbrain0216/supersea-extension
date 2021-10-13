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
          '.ActivitySearch--history div[role="listitem"]': {
            minHeight: 95,
          },
          '.ActivitySearch--history *[class*="FeatureTableCell"]:nth-child(2)': {
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
