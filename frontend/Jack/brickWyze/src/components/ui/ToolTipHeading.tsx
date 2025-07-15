import { Box, Heading } from '@chakra-ui/react'
import React from 'react'
import MyToolTip from './MyToolTip'
import { IoIosInformationCircle } from 'react-icons/io'

function ToolTipHeading() {
  return ( <>
        <Heading as="h4" size="md">
        Price Range
        </Heading>
            <MyToolTip label='Hello  World'>
                <Box as="span" cursor="pointer">
                    <IoIosInformationCircle />
                </Box>
            </MyToolTip>
        
    </>
  )
}

export default ToolTipHeading