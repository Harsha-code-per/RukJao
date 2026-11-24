import { serve } from '@hono/node-server';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createReviewer, geminiGenerate } from './ai/gemini';
import { createApp } from './app';
import { createChecker } from './checker';
import { loadConfig } from './config';
import { firestoreStore, memoryStore } from './store/patterns';

const config = loadConfig();

// On Cloud Run, Firestore authenticates as the service account: no key files anywhere.
const store = config.onCloudRun ? firestoreStore(getFirestore(initializeApp())) : memoryStore();
const review = config.geminiKey === '' ? null : createReviewer(geminiGenerate(config.geminiKey), config.models);

const app = createApp({
  check: createChecker({ review, store, cacheSize: config.cacheSize }),
  ratePerMinute: config.ratePerMinute,
  staticRoot: './dist',
});

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.warn(`RukJao listening on :${port} (AI ${review ? 'on' : 'off'}, store ${config.onCloudRun ? 'firestore' : 'memory'})`);
});
