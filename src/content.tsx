import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import AppProvider from './components/AppProvider'
import BundleVerification from './components/BundleVerification'
import AssetInfo from './components/AssetInfo'
import ProfileSummary from './components/ProfileSummary'
import GlobalStyles from './components/GlobalStyles'
import { getExtensionConfig } from './utils/extensionConfig'

const NODE_BUNDLE_PROCESSED_DATA_KEY = '__Processed__Bundle'
const NODE_ASSET_PROCESSED_DATA_KEY = '__Processed__Asset'
const NODE_TABLE_PROCESSED_DATA_KEY = '__Processed__Table'
const NODE_PROFILE_PROCESSED_DATA_KEY = '__Processed__Profile'

const getPage = () => {
  const path = window.location.pathname.split('/')
  if (path[1] === 'collection') {
    const collectionAssetHref =
      document
        .querySelector('.AssetSearchView--results .Asset--anchor')
        ?.getAttribute('href') || ''

    return {
      type: 'collection',
      ethAddress: collectionAssetHref.split('/')[2],
    }
  } else if (path[1] === 'assets') {
    const [tokenType, address, tokenId] = path.slice(-3)
    return {
      type: 'asset',
      ethAddress: address.toLowerCase(),
      chain:
        tokenType === 'matic' ? ('polygon' as const) : ('ethereum' as const),
      tokenId,
    }
  }
}

const addGlobalStyle = () => {
  const globalContainer = document.createElement('div')
  document.body.appendChild(globalContainer)
  injectReact(<GlobalStyles />, globalContainer)
}

const injectAssetInfo = () => {
  const gridNodes = Array.from(
    document.querySelectorAll('article.AssetSearchList--asset'),
  )
  const listNodesV1 = Array.from(
    document.querySelectorAll('.EventHistory--row'),
  )
  const listNodesV2 = Array.from(
    document.querySelectorAll('div[role="listitem"] .AssetCell--container'),
  )
  const itemNode = document.querySelector('.item--summary > article')
  const nodes = [
    ...gridNodes.map((node) => ({ node, type: 'grid' })),
    ...listNodesV1.map((node) => ({ node, type: 'list', version: 1 })),
    ...listNodesV2.map((node) => ({ node, type: 'list', version: 2 })),
    ...(itemNode ? [{ node: itemNode, type: 'item' }] : []),
  ] as {
    node: HTMLElement
    version?: number
    type: React.ComponentProps<typeof AssetInfo>['type']
  }[]

  nodes.forEach(({ node, type, version }) => {
    if (node.dataset[NODE_ASSET_PROCESSED_DATA_KEY]) return
    node.dataset[NODE_ASSET_PROCESSED_DATA_KEY] = '1'

    const { address, tokenId, chain } = (() => {
      if (type === 'item') {
        const page = getPage()
        return {
          address: page?.ethAddress.toLowerCase(),
          tokenId: page?.tokenId,
          chain: page?.chain,
        }
      }
      let link = null
      if (type === 'grid') {
        link =
          node.closest('.Asset--anchor') || node.querySelector('.Asset--anchor')
      } else if (type === 'list') {
        link =
          node.closest('.AssetCell--link') ||
          node.querySelector('.AssetCell--link')
      } else {
        link = node.querySelector('.AssetCell--link')
      }
      if (link) {
        const [tokenType, address, tokenId] =
          link
            .getAttribute('href')
            ?.split('/')
            .filter((s) => s.length)
            .slice(-3) || []

        return {
          address,
          tokenId,
          chain:
            tokenType === 'matic'
              ? ('polygon' as const)
              : ('ethereum' as const),
        }
      }
      return {}
    })()
    if (!(address && tokenId && chain)) return

    const container = document.createElement('div')
    container.classList.add('SuperSea__AssetInfo')
    container.classList.add('SuperSea__AssetInfo--Unrendered')
    if (type === 'grid') {
      // Disable hover transforms, since it causes issues with popover and makes
      // things more annoying to click
      node.style.transform = 'none'
      node.appendChild(container)
    } else if (type === 'item') {
      const image = node.querySelector('.Image--image')
      const imageContainer = image?.parentElement
      if (imageContainer) {
        // AssetInfo looks better without rounded corners on the image on single items
        imageContainer.style.borderRadius = '0'
      }
      node.appendChild(container)
    } else if (type === 'list' && version === 1) {
      const itemColHeader = node.parentElement!.querySelector(
        '.EventHistory--item-col',
      )! as HTMLElement
      if (!itemColHeader.dataset[NODE_TABLE_PROCESSED_DATA_KEY]) {
        itemColHeader.dataset[NODE_TABLE_PROCESSED_DATA_KEY] = '1'
        const headerColumn = document.createElement('div')
        headerColumn.classList.add('Row--cell')
        headerColumn.style.flex = '0 0 200px'
        itemColHeader.parentNode!.insertBefore(headerColumn, itemColHeader)
      }
      container.classList.add('Row--cell')
      container.style.flex = '0 0 200px'
      container.style.overflow = 'visible'
      container.style.padding = '0 10px'
      node.insertBefore(
        container,
        node.querySelector('.EventHistory--item-col'),
      )
    } else if (type === 'list' && version === 2) {
      container.style.zIndex = '1'
      container.style.minWidth = '165px'
      node.prepend(container)
    }
    container.dataset['address'] = address
    container.dataset['tokenId'] = tokenId
    container.dataset['chain'] = chain
    container.dataset['type'] = type
  })
}

let injectedReactContainers: ReactDOM.Container[] = []
const injectReact = (
  content: React.ReactElement,
  target: ReactDOM.Container,
  callback?: () => void,
) => {
  injectedReactContainers.push(target)
  ReactDOM.render(<AppProvider>{content}</AppProvider>, target, callback)
}

const destroyRemovedInjections = () => {
  window.requestIdleCallback(() => {
    injectedReactContainers = injectedReactContainers.filter((container) => {
      if (!document.body.contains(container)) {
        ReactDOM.unmountComponentAtNode(container as Element)
        return false
      }
      return true
    })
  })
}

const injectBundleVerification = () => {
  const bundleFrames = Array.from(
    document.querySelectorAll('.Bundle--summary-frame'),
  ) as HTMLElement[]

  bundleFrames.forEach((bundleFrame) => {
    if (!bundleFrame || bundleFrame.dataset[NODE_BUNDLE_PROCESSED_DATA_KEY])
      return

    bundleFrame.dataset[NODE_BUNDLE_PROCESSED_DATA_KEY] = '1'
    const assets = Array.from(
      bundleFrame.querySelectorAll('.Bundle--items-list > a'),
    ) as HTMLAnchorElement[]
    if (assets.length) {
      const addresses = _.groupBy(
        assets,
        // @ts-ignore
        (asset) => asset.attributes.href.value.split('/')[2],
      )
      const numAddresses = Object.keys(addresses).length

      const header = bundleFrame.querySelector('header')
      if (header) {
        const container = document.createElement('div')
        header.parentNode?.insertBefore(container, header.nextSibling)
        injectReact(
          <BundleVerification numAddresses={numAddresses} />,
          container,
        )
      }
    }
  })
}

const injectProfileSummary = () => {
  const accountTitle = document.querySelector(
    '.AccountHeader--title',
  ) as HTMLElement
  const accountBanner = accountTitle?.parentElement

  if (!accountBanner || accountBanner.dataset[NODE_PROFILE_PROCESSED_DATA_KEY])
    return

  const userName = accountTitle.innerText
  const ensName = (accountBanner.querySelector(
    '.AccountHeader--name',
  ) as HTMLElement | null)?.innerText
  const addressSlug = window.location.pathname.split('/')[1]
  const address =
    addressSlug === 'account'
      ? (window as any).ethereum?.selectedAddress
      : addressSlug
  accountBanner.dataset[NODE_PROFILE_PROCESSED_DATA_KEY] = '1'
  const container = document.createElement('div')
  accountBanner.appendChild(container)
  injectReact(
    <ProfileSummary userName={userName} address={address} ensName={ensName} />,
    container,
  )
}

const throttledInjectAssetInfo = _.throttle(injectAssetInfo, 250)
const throttledInjectBundleVerification = _.throttle(
  injectBundleVerification,
  250,
)
const throttledInjectProfileSummary = _.throttle(injectProfileSummary, 250)
const throttledDestroyRemovedInjections = _.throttle(
  destroyRemovedInjections,
  1000,
)

const injectInPageContextScript = () => {
  const s = document.createElement('script')
  s.src = chrome.runtime.getURL('static/js/pageContextInject.js')
  document.head.appendChild(s)
  s.onload = function () {
    s.remove()
  }
}

const setupInjections = async () => {
  injectBundleVerification()
  injectAssetInfo()
  injectProfileSummary()

  const observer = new MutationObserver(() => {
    throttledInjectBundleVerification()
    throttledInjectAssetInfo()
    throttledInjectProfileSummary()
    throttledDestroyRemovedInjections()
  })

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  })
}

const setupAssetInfoRenderer = () => {
  const render = () => {
    try {
      const selectedNodes = document.querySelectorAll(
        '.SuperSea__AssetInfo--Unrendered',
      )
      if (selectedNodes.length !== 0) {
        const nodes = [...Array.from(selectedNodes)] as HTMLElement[]
        nodes.forEach((node: HTMLElement) => {
          const { address, tokenId, chain, type } = node.dataset as any
          injectReact(
            <AssetInfo
              address={address}
              tokenId={tokenId}
              chain={chain}
              type={type}
              container={node.parentElement!}
            />,
            node,
          )
          node.classList.remove('SuperSea__AssetInfo--Unrendered')
        })
      }
    } catch (err) {
      console.error('AssetInfo inject error', err)
    }
    setTimeout(() => {
      window.requestIdleCallback(render, { timeout: 500 })
    }, 250)
  }
  window.requestIdleCallback(render, { timeout: 500 })
}

// We need to keep the background script alive for webRequest handlers
const setupKeepAlivePing = () => {
  setInterval(() => {
    chrome.runtime.sendMessage({
      method: 'ping',
    })
  }, 5000)
}

const initialize = async () => {
  const config = await getExtensionConfig()
  if (config.enabled) {
    setupInjections()
    setupKeepAlivePing()
    addGlobalStyle()
    setupAssetInfoRenderer()
  }
  if (config.quickBuyEnabled) {
    injectInPageContextScript()
  }
}

initialize()
