import React from 'react'
import { Story } from '@storybook/react'
import { Center } from '@chakra-ui/react'

import RefreshIndicator from '../components/AssetInfo/RefreshIndicator'

export default {
  title: 'RefreshIndicator',
  component: RefreshIndicator,
}

const Template: Story<React.ComponentProps<typeof RefreshIndicator>> = (
  args,
) => (
  <Center height="100%">
    <RefreshIndicator {...args} />
  </Center>
)

export const Default = Template.bind({})
Default.args = { state: 'IDLE' }
