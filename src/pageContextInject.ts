import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types'

window.addEventListener('message', async (event: any) => {
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
  }
})
