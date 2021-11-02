const WEI_PER_ETH = Math.pow(10, 18)
export const readableEthValue = (wei: number) => {
  const eth = wei / WEI_PER_ETH
  return Math.round(eth * 10000) / 10000
}
