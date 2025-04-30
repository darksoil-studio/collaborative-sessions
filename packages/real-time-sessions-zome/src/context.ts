import { createContext } from '@lit/context';
import { RealTimeSessionsStore } from './real-time-sessions-store.js';

export const realTimeSessionsStoreContext = createContext<RealTimeSessionsStore>(
  'real_time_sessions/store'
);

