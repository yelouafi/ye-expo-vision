import * as React from 'react';

import { YeExpoVisionViewProps } from './YeExpoVision.types';

export default function YeExpoVisionView(props: YeExpoVisionViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
