import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!globalThis.document) {
  GlobalRegistrator.register();
}

if (globalThis.document && !globalThis.document.body) {
  const body = globalThis.document.createElement('body');
  globalThis.document.documentElement.appendChild(body);
}

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'bun:test';

afterEach(() => {
  cleanup();
});
