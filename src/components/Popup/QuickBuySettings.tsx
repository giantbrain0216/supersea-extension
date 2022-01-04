import {
  Switch,
  FormControl,
  FormLabel,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  Box,
  Flex,
  Text,
  Input,
  Link,
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'
import React from 'react'
import { User } from '../../utils/user'
import LockedFeature from '../LockedFeature'

const QuickBuyToggle = ({
  isChecked,
  isDisabled,
  user,
  onChange,
  switchRef,
  ...rest
}: {
  isChecked: boolean
  isDisabled: boolean
  user: User
  onChange: (isChecked: boolean) => void
  switchRef: React.RefObject<HTMLInputElement>
} & Omit<React.ComponentProps<typeof FormControl>, 'onChange'>) => {
  return (
    <Box opacity={isDisabled ? 0.5 : 1}>
      <FormControl {...rest}>
        <FormLabel htmlFor="quick-buy" fontSize="sm">
          Enable Quick Buy
        </FormLabel>
        <HStack spacing="3" alignItems="center">
          <Switch
            id="quick-buy"
            isDisabled={isDisabled || !user.isSubscriber}
            isChecked={isChecked}
            ref={switchRef}
            onChange={() => {
              if (user.isSubscriber) {
                onChange(!isChecked)
              }
            }}
          />
          {!user.isSubscriber && (
            <Box top="1px" position="relative">
              <LockedFeature level="subscriber" />
            </Box>
          )}
        </HStack>
      </FormControl>
      <FormControl my="3">
        <FormLabel fontSize="sm">Gas Preset</FormLabel>
        <VStack spacing="2" alignItems="stretch">
          <HStack
            borderRadius="md"
            borderColor="blue.600"
            borderWidth="1px"
            bg="blue.600"
            px="3"
            py="2"
          >
            <Box flex="1 1 auto">
              <Text fontWeight="bold">None</Text>
              <Text opacity="0.65" fontSize="sm">
                MetaMask decides gas.
              </Text>
            </Box>
            <Flex height="100%" px="2">
              <CheckIcon color="white" w="16px" height="16px" />
            </Flex>
          </HStack>{' '}
          <HStack
            borderRadius="md"
            borderColor="gray.700"
            borderWidth="1px"
            px="3"
            py="2"
          >
            <Box flex="1 1 auto">
              <Text fontWeight="bold">Fixed</Text>
              <Text opacity="0.65" fontSize="sm">
                Fixed gas presets decided by you (in gwei).
              </Text>
              <HStack spacing="2" mt="3" alignItems="flex-start">
                <FormControl maxWidth="120px" isDisabled>
                  <FormLabel fontSize="xs" opacity="0.85">
                    Max Priority Fee
                  </FormLabel>
                  <Input value="20" size="sm" borderColor="whiteAlpha.300" />
                </FormControl>{' '}
                <FormControl opacity="0.85" maxWidth="120px" isDisabled>
                  <FormLabel fontSize="xs">Max Fee</FormLabel>
                  <Input value="300" size="sm" borderColor="whiteAlpha.300" />
                </FormControl>
              </HStack>
            </Box>
            <Flex height="100%" px="2" visibility="hidden">
              <CheckIcon color="white" w="16px" height="16px" />
            </Flex>
          </HStack>{' '}
          <HStack
            borderRadius="md"
            borderColor="gray.700"
            borderWidth="1px"
            px="3"
            py="2"
          >
            <Box flex="1 1 auto">
              <Text fontWeight="bold">
                Optimal <LockedFeature mx="1" level="founder" mt="1px" />
              </Text>
              <Text opacity="0.65" fontSize="sm">
                Transaction gas set automatically to have a 99% chance of being
                included in the next block.
              </Text>
            </Box>
            <Flex height="100%" px="2" visibility="hidden">
              <CheckIcon color="white" w="16px" height="16px" />
            </Flex>
          </HStack>
        </VStack>
      </FormControl>
      <Alert
        fontSize="sm"
        status="warning"
        borderRadius="sm"
        p="2"
        pr="4"
        my="3"
      >
        <AlertIcon />
        <Text>
          Enabling Quick Buy allows SuperSea to directly initialize transactions
          through the{' '}
          <Link
            href="https://github.com/ProjectOpenSea/opensea-js"
            target="_blank"
            color="blue.300"
          >
            opensea-js library
          </Link>
          . Always verify all transactions before confirming them in your
          wallet. SuperSea takes no responsibility for any gas fee losses due to
          potential malformed transactions.
        </Text>
      </Alert>
    </Box>
  )
}

export default QuickBuyToggle
