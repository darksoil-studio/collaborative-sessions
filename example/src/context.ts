import { createContext } from '@lit/context';

import { ExampleStore } from './example-store.js';

export const exampleStoreContext = createContext<ExampleStore>(
	'collaborative_sessions/store',
);
