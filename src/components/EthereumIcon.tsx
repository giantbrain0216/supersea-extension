import EthereumLightSVG from '../assets/ethereum_light.svg'
import EthereumDarkSVG from '../assets/ethereum_dark.svg'
import { useColorModeValue, Icon } from '@chakra-ui/react'
import React from 'react'

const EthereumIcon = (props: React.ComponentProps<typeof Icon>) => {
  return (
    // @ts-ignore
    <Icon
      as={useColorModeValue(EthereumLightSVG, EthereumDarkSVG) as any}
      width="0.5em"
      mr="0.25em"
      verticalAlign="middle"
      display="inline-block"
      {...props}
    />
  )
}

export default EthereumIcon
