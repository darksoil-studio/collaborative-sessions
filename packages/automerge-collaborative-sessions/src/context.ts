import { createContext } from '@lit/context';

import { CollaborativeDocument } from './collaborative-document.js';

export const collaborativeDocumentContext = createContext<
	CollaborativeDocument<unknown>
>('collaborative_document');
