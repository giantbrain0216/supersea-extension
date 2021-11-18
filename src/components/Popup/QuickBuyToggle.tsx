import {
  Switch,
  FormControl,
  FormLabel,
  HStack,
  Alert,
  AlertIcon,
  Box,
  Text,
  Link,
} from '@chakra-ui/react'
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
    <FormControl {...rest} opacity={isDisabled ? 0.5 : 1}>
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
    </FormControl>
  )
}

export default QuickBuyToggle
