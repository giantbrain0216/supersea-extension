import React from 'react'
import { Story } from '@storybook/react'
import { Center, Box } from '@chakra-ui/react'

import QuickBuySettings from '../components/Popup/QuickBuySettings'

export default {
  title: 'QuickBuySettings',
  component: QuickBuySettings,
}

const Template: Story<React.ComponentProps<typeof QuickBuySettings>> = (
  args,
) => (
  <Center height="100%">
    <Box width="400px" px="4" color="white" bg="gray.800">
      <QuickBuySettings {...args} />
    </Box>
  </Center>
)

export const Default = Template.bind({})
Default.args = {
  isChecked: true,
  isDisabled: false,
  user: {
    isSubscriber: true,
    isFounder: false,
    role: 'SUBSCRIBER',
    membershipType: 'SUBSCRIPTION',
  },
}
