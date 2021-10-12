import {
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Text,
  Link,
} from '@chakra-ui/react'
import React from 'react'

const QuickBuyToggle = ({
  isChecked,
  isDisabled,
  onChange,
  switchRef,
  ...rest
}: {
  isChecked: boolean
  isDisabled: boolean
  onChange: (isChecked: boolean) => void
  switchRef: React.RefObject<HTMLInputElement>
} & Omit<React.ComponentProps<typeof FormControl>, 'onChange'>) => {
  return (
    <FormControl {...rest} opacity={isDisabled ? 0.5 : 1}>
      <FormLabel htmlFor="quick-buy" fontSize="sm">
        Enable Quick Buy
      </FormLabel>
      <Switch
        id="quick-buy"
        isDisabled={isDisabled}
        isChecked={isChecked}
        ref={switchRef}
        onChange={() => {
          onChange(!isChecked)
        }}
      />
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
