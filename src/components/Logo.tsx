import React from 'react'
import { Icon, useColorModeValue } from '@chakra-ui/react'
import LogoSvg from '../assets/logo.svg'
import LogoFlippedSvg from '../assets/logo-flipped.svg'

const Logo = (
  props: React.ComponentProps<typeof Icon> & { flipped?: boolean },
) => {
  return (
    // @ts-ignore
    <Icon
      as={(props.flipped ? LogoFlippedSvg : LogoSvg) as any}
      color={useColorModeValue('gray.400', 'white')}
      {...props}
    />
  )
}

export default Logo
