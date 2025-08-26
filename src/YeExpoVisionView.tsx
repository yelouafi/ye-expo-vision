import { requireNativeView } from 'expo';
import * as React from 'react';

import { YeExpoVisionViewProps } from './YeExpoVision.types';

const NativeView: React.ComponentType<YeExpoVisionViewProps> =
  requireNativeView('YeExpoVision');

export default function YeExpoVisionView(props: YeExpoVisionViewProps) {
  return <NativeView {...props} />;
}
