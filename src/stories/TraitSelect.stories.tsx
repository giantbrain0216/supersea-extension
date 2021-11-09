import React, { useState } from 'react'
import { Story } from '@storybook/react'
import { Center, Box } from '@chakra-ui/react'

import TraitSelect from '../components/SearchResults/TraitSelect'

export default {
  title: 'TraitSelect',
  component: TraitSelect,
}

const Template: Story<React.ComponentProps<typeof TraitSelect>> = (args) => {
  const [value, setValue] = useState<string[]>([])

  return (
    <Center height="100%">
      <Box width="300px">
        <TraitSelect {...args} value={value} onChange={setValue} />
      </Box>
    </Center>
  )
}

export const Default = Template.bind({})

Default.args = {
  traits: [
    {
      _id: {
        name: 'White Scout',
        group: 'Hat',
      },
      sum: 15,
    },
    {
      _id: {
        name: 'Pink Steak Toaster',
        group: 'Hat',
      },
      sum: 5,
    },
    {
      _id: {
        name: 'White Yakuza',
        group: 'Shirt',
      },
      sum: 52,
    },
    {
      _id: {
        name: 'Red Scuba',
        group: 'Shirt',
      },
      sum: 31,
    },
    {
      _id: {
        name: 'Bruiser 1',
        group: 'Tier',
      },
      sum: 25,
    },
    {
      _id: {
        name: 'Bigwig 2',
        group: 'Tier',
      },
      sum: 7,
    },
  ],
}
