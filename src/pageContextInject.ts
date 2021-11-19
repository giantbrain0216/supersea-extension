import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'
;((window: any) => {
  // Restore console for debugging
  // const i = document.createElement('iframe')
  // i.style.display = 'none'
  // document.body.appendChild(i)
  // window.console = (i.contentWindow as any).console

  window.addEventListener('message', async (event: any) => {
    if (event.origin !== 'https://opensea.io') return
    if (event.data.method === 'SuperSea__Buy') {
      const seaport = new OpenSeaPort((window as any).ethereum, {
        networkName: Network.Main,
      })
      try {
        const asset = await fetch(
          `https://api.opensea.io/api/v1/asset/${event.data.params.address}/${event.data.params.tokenId}`,
        ).then((res) => res.json())
        const order = asset.orders.filter(
          (order: any) => order.side === OrderSide.Sell,
        )[0]
        const formattedOrder = Object.keys(order).reduce((acc: any, key) => {
          const camelCasedKey = key.replace(/_([a-z])/g, (g) =>
            g[1].toUpperCase(),
          )
          acc[camelCasedKey] = order[key]
          return acc
        }, {})
        formattedOrder.maker = formattedOrder.maker.address
        formattedOrder.taker = formattedOrder.taker.address
        formattedOrder.feeRecipient = formattedOrder.feeRecipient.address
        await seaport.fulfillOrder({
          order: formattedOrder,
          accountAddress: (window as any).ethereum.selectedAddress,
        })
        window.postMessage({
          method: 'SuperSea__Buy__Success',
          params: { ...event.data.params },
        })
      } catch (error: any) {
        console.error(error)
        window.postMessage({
          method: 'SuperSea__Buy__Error',
          params: { ...event.data.params, error },
        })
      }
    } else if (event.data.method === 'SuperSea__Navigate') {
      window.next.router.push(
        event.data.params.url,
        event.data.params.as,
        event.data.params.options,
      )
    } else if (event.data.method === 'SuperSea__GetEthAddress') {
      const address =
        (window as any).ethereum?.selectedAddress ||
        (await (window as any).ethereum?.request({ method: 'eth_accounts' }))[0]
      window.postMessage({
        method: 'SuperSea__GetEthAddress__Success',
        params: {
          ethAddress: address,
        },
      })
    }
  })

  if (window.next && window.next.router) {
    window.next.router.events.on('routeChangeComplete', (url: string) => {
      window.postMessage({
        method: 'SuperSea__Next__routeChangeComplete',
        params: { url: url, scrollY: window.scrollY },
      })
    })
    window.next.router.events.on('routeChangeStart', (url: string) => {
      window.postMessage({
        method: 'SuperSea__Next__routeChangeStart',
        params: { url: url, scrollY: window.scrollY },
      })
    })
  }
})(window)
