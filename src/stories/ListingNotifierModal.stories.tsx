import React from 'react'
import { Story } from '@storybook/react'
import { Center } from '@chakra-ui/react'

import ListingNotifierModal from '../components/ListingNotifier/ListingNotifierModal'

export default {
  title: 'ListingNotifierModal',
  component: ListingNotifierModal,
}

const Template: Story<React.ComponentProps<typeof ListingNotifierModal>> = (
  args,
) => (
  <Center height="100%">
    <ListingNotifierModal {...args} />
  </Center>
)

export const Default = Template.bind({})
Default.args = {
  isOpen: true,
  addedNotifiers: [
    {
      id: 'A',
      minPrice: null,
      maxPrice: null,
      lowestRarity: 'Common',
      traits: [],
    },
  ],
  onAddNotifier: () => {},
  matchedAssets: [],
}
