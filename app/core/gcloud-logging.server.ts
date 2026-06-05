const SCOPE = 'https://www.googleapis.com/auth/logging.write';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const LOGGING_URL = 'https://logging.googleapis.com/v2/entries:write';

let cachedToken: { token: string; expiry: number } | null = null;

function base64url(str: string): string {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
	const b64 = pem
		.replace(/-----BEGIN.*?-----/, '')
		.replace(/-----END.*?-----/, '')
		.replace(/\s/g, '');
	const binary = atob(b64);
	const buffer = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		buffer[i] = binary.charCodeAt(i);
	}
	return buffer.buffer;
}

async function createJwt(clientEmail: string, privateKey: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'RS256', typ: 'JWT' };
	const payload = { iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };

	const encodedHeader = base64url(JSON.stringify(header));
	const encodedPayload = base64url(JSON.stringify(payload));
	const input = `${encodedHeader}.${encodedPayload}`;

	const keyData = pemToArrayBuffer(privateKey);
	const key = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
		'sign',
	]);

	const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
	return `${input}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
	if (cachedToken && cachedToken.expiry > Date.now()) {
		return cachedToken.token;
	}

	const jwt = await createJwt(clientEmail, privateKey);
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
	});

	if (!res.ok) {
		throw new Error(`Failed to get access token: ${res.status}`);
	}

	const data = (await res.json()) as any;
	cachedToken = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 };
	return data.access_token;
}

export async function writeLog(
	projectId: string,
	clientEmail: string,
	privateKey: string,
	severity: string,
	message: string,
	context?: Record<string, any>
) {
	try {
		const token = await getAccessToken(clientEmail, privateKey);
		const entry = {
			entries: [
				{
					logName: `projects/${projectId}/logs/dompetku`,
					resource: { type: 'global', labels: { project_id: projectId } },
					severity,
					jsonPayload: {
						message,
						...context,
						timestamp: new Date().toISOString(),
					},
				},
			],
		};

		await fetch(LOGGING_URL, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(entry),
		});
	} catch {
		// silently fail - don't break the app if logging fails
	}
}
