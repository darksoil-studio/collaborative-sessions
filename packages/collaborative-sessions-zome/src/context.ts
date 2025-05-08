import { createContext } from '@lit/context';

import { CollaborativeSessionsClient } from './collaborative-sessions-client.js';

export const collaborativeSessionsClientContext =
	createContext<CollaborativeSessionsClient>('collaborative_sessions/client');
