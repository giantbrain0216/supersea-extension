import { WarningTwoIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Flex, Text, Icon, useColorModeValue } from '@chakra-ui/react'
import LogoSvg from '../assets/logo-flipped.svg'

const BundleVerification = ({ numAddresses }: { numAddresses: number }) => {
  const verified = numAddresses === 1
  const verifiedColor = useColorModeValue('blue.400', 'blue.500')
  const unverifiedColor = useColorModeValue('orange.400', 'orange.500')
  return (
    <Flex
      backgroundColor={verified ? verifiedColor : unverifiedColor}
      px={3}
      py={4}
      position="relative"
      overflow="hidden"
    >
      <Flex alignItems="center">
        {verified ? (
          <CheckCircleIcon mr={2} color="white" />
        ) : (
          <WarningTwoIcon mr={2} color="white" />
        )}
        <Text as="div" color="white" fontWeight="500">
          {verified
            ? 'Every item in this bundle belongs to the same collection.'
            : `Beware, this bundle contains items from ${numAddresses} different collections.`}
        </Text>
      </Flex>
      <Icon
        as={LogoSvg as any}
        position="absolute"
        opacity="0.6"
        color="white"
        width="40px"
        height="40px"
        top="50%"
        right="4px"
        transform="translateY(-50%)"
      />
    </Flex>
  )
}

export default BundleVerification
