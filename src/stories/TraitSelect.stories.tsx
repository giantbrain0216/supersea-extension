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
      value: 'White Scout',
      trait_type: 'Hat',
      count: 15,
    },
    {
      value: 'Pink Steak Toaster',
      trait_type: 'Hat',
      count: 5,
    },
    {
      value: 'White Yakuza',
      trait_type: 'Shirt',
      count: 52,
    },
    {
      value: 'Red Scuba',
      trait_type: 'Shirt',
      count: 31,
    },
    {
      value: 'Bruiser 1',
      trait_type: 'Tier',
      count: 25,
    },
    {
      value: 'Bigwig 2',
      trait_type: 'Tier',
      count: 7,
    },
  ],
}
