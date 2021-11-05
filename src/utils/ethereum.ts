const WEI_PER_ETH = Math.pow(10, 18)
export const weiToEth = (wei: number) => {
  return wei / WEI_PER_ETH
}
export const readableEthValue = (wei: number) => {
  return Math.round(weiToEth(wei) * 10000) / 10000
}
