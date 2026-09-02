// Vercel detects files in `api/` as serverless HTTP entrypoints. The actual
// Express app remains in src so local development continues to use it unchanged.
export { default } from "../src/index";
