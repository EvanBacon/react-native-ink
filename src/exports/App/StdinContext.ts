import React from 'react';

export default React.createContext({
  stdin: undefined,
  isRawModeSupported: false as boolean,
  setRawMode: undefined as (undefined | ((isEnabled?: boolean) => void)),
});
