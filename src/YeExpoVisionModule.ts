import { NativeModule, requireNativeModule } from 'expo';

import { YeExpoVisionModuleEvents } from './YeExpoVision.types';

declare class YeExpoVisionModule extends NativeModule<YeExpoVisionModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<YeExpoVisionModule>('YeExpoVision');
