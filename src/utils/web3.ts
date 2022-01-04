import Web3 from 'web3'

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://mainnet.infura.io/v3/ee4107ea6ef147a29cc4b81672ac5d02',
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
