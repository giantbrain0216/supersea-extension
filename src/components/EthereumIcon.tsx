import EthereumLightSVG from '../assets/ethereum_light.svg'
import EthereumDarkSVG from '../assets/ethereum_dark.svg'
import WrappedEthereumSVG from '../assets/wrapped_ethereum.svg'
import { useColorModeValue, Icon } from '@chakra-ui/react'
import React from 'react'

const EthereumIcon = ({
  wrapped = false,
  ...rest
}: { wrapped?: boolean } & React.ComponentProps<typeof Icon>) => {
  return (
    // @ts-ignore
    <Icon
      as={
        useColorModeValue(
          wrapped ? WrappedEthereumSVG : EthereumLightSVG,
          wrapped ? WrappedEthereumSVG : EthereumDarkSVG,
        ) as any
      }
      width="0.5em"
      mr="0.25em"
      verticalAlign="middle"
      display="inline-block"
      {...rest}
    />
  )
}

export default EthereumIcon
