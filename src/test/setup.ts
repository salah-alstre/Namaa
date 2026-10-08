// Shared vitest setup. jsdom provides window/localStorage; nothing else needs mocking
// because the app has no network layer and the DB adapter is swapped for sql.js in tests.
import { afterEach } from 'vitest';

afterEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* jsdom without storage */
  }
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
});
