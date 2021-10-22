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
        const order = await seaport.api.getOrder({
          asset_contract_address: event.data.params.address,
          token_id: event.data.params.tokenId,
          side: OrderSide.Sell,
        })
        await seaport.fulfillOrder({
          order,
          accountAddress: (window as any).ethereum.selectedAddress,
        })
        window.postMessage({
          method: 'SuperSea__Buy__Success',
          params: { ...event.data.params },
        })
      } catch (error: any) {
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
    }
  })

  if (window.next && window.next.router) {
    window.next.router.events.on('routeChangeComplete', (url: string) => {
      window.postMessage({
        method: 'SuperSea__Next__routeChangeComplete',
        params: { url: url },
      })
    })
    window.next.router.events.on('routeChangeStart', (url: string) => {
      window.postMessage({
        method: 'SuperSea__Next__routeChangeStart',
        params: { url: url },
      })
    })
  }
})(window)
