import { registerWebModule, NativeModule } from 'expo';

import { YeExpoVisionModuleEvents } from './YeExpoVision.types';

class YeExpoVisionModule extends NativeModule<YeExpoVisionModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(YeExpoVisionModule, 'YeExpoVisionModule');
