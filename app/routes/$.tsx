import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ error: 'Not Found' }, { status: 404 });
}

export default function CatchAll() {
  return null;
}
