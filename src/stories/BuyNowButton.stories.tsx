import React from 'react'
import { Story } from '@storybook/react'
import { Center } from '@chakra-ui/react'

import { BuyNowButtonUI as BuyNowButton } from '../components/AssetInfo/BuyNowButton'

export default {
  title: 'BuyNowButton',
  component: BuyNowButton,
}

const Template: Story<React.ComponentProps<typeof BuyNowButton>> = (args) => (
  <Center height="100%">
    <BuyNowButton {...args} />
  </Center>
)

export const Default = Template.bind({})
Default.args = {
  address: '',
  tokenId: '',
  active: true,
}
