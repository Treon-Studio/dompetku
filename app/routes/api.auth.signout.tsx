import type { ActionFunctionArgs } from '@remix-run/node';
import { signOut } from '~/lib/auth.server';

export async function action({ request }: ActionFunctionArgs) {
	return signOut(request);
}