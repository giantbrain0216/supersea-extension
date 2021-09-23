import React from 'react'
import { Icon, useColorModeValue } from '@chakra-ui/react'
import LogoSvg from '../assets/logo.svg'

const Logo = (props: React.ComponentProps<typeof Icon>) => {
  return (
    <Icon
      as={LogoSvg as any}
      color={useColorModeValue('gray.400', 'white')}
      {...props}
    />
  )
}

export default Logo
