import { useState } from 'react'
import { Text, HStack, Box } from '@chakra-ui/react'
import Logo from './Logo'
const CollectionMenuItem = ({
  type,
  onClick,
}: {
  type: 'items'
  onClick: () => void
}) => {
  return (
    <HStack
      height="100%"
      spacing="4"
      px="30px"
      onClick={onClick}
      cursor="pointer"
    >
      <Logo width="24px" height="24px" color="white" />
      <Text fontWeight="600" fontFamily="Poppins, sans-serif;" color="white">
        Top Ranked
      </Text>
    </HStack>
  )
}

export default CollectionMenuItem
