import { createRequestHandler } from '@remix-run/cloudflare';
import * as build from './build/server/index.js';

export default {
  fetch(request, env, ctx) {
    const loadContext = {
      cloudflare: { env, ctx, cf: request.cf },
    };
    return createRequestHandler(build)(request, loadContext);
  },
};
