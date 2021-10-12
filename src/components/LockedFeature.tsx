import { LockIcon } from '@chakra-ui/icons'
import { Link, HStack, Box, Tag, useColorModeValue } from '@chakra-ui/react'

const LockedFeature = ({
  level = 'subscriber',
}: {
  level?: 'subscriber' | 'founder'
}) => {
  return (
    <Link
      href="https://nonfungible.tools/connect"
      _hover={{ textDecoration: 'none' }}
    >
      <Tag
        bg={useColorModeValue(
          level === 'founder' ? 'orange.200' : 'blue.200',
          level === 'founder' ? 'orange.500' : 'blue.500',
        )}
        size="sm"
        px="4px"
        pointerEvents="none"
      >
        <HStack spacing="2px">
          <LockIcon height="10px" mt="-1px" />
          <Box>{level === 'subscriber' ? 'Member' : 'Founding Member'}</Box>
        </HStack>
      </Tag>
    </Link>
  )
}
export default LockedFeature
