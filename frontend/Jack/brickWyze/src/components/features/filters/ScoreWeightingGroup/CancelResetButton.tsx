'use client';

import { Button } from '@chakra-ui/react';
import { forwardRef } from 'react';

interface CancelResetButtonProps {
  onClick: () => void;
}

// ✅ Forward the ref so it works with Chakra's AlertDialog
const CancelResetButton = forwardRef<HTMLButtonElement, CancelResetButtonProps>(
  ({ onClick }, ref) => (
    <Button ref={ref} onClick={onClick}>
      Cancel
    </Button>
  )
);

CancelResetButton.displayName = 'CancelResetButton';

export default CancelResetButton;
