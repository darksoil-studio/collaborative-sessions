import { createContext } from '@lit/context';

import { ExampleStore } from './example-store.js';

export const exampleStoreContext = createContext<ExampleStore>(
	'real_time_sessions/store',
);
