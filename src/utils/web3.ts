import Web3 from 'web3'

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    'wss://mainnet.infura.io/ws/v3/d0b2b7a59f94446e9f6f6753c55764fe',
  ),
)

export const fetchMetadataUri = async (address: string, tokenId: number) => {
  const contract = new web3.eth.Contract(
    [
      {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address,
  )

  return contract.methods.tokenURI(tokenId).call()
}
