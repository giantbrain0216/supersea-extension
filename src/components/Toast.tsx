import { Box, Text, Icon, useColorModeValue } from '@chakra-ui/react'
import React from 'react'
import LogoSvg from '../assets/logo.svg'

const Toast = ({
  text,
  type = 'success',
}: {
  text: string
  type?: 'success' | 'error'
}) => {
  const bgs: Record<typeof type, React.ComponentProps<typeof Box>['bg']> = {
    success: useColorModeValue('gray.500', 'gray.700'),
    error: useColorModeValue('red.500', 'red.700'),
  }

  return (
    <Box
      bg={bgs[type]}
      borderRadius="md"
      px="6"
      py="2"
      mx="5"
      minWidth="380px"
      position="relative"
      overflow="hidden"
    >
      <Text color="white">{text}</Text>
      <Icon
        as={LogoSvg as any}
        position="absolute"
        opacity={0.35}
        color="white"
        width="80px"
        height="80px"
        top="50%"
        right="-16px"
        transform="translateY(-50%)"
      />
    </Box>
  )
}

export default Toast
