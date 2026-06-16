export default async function fetcher<JSON = any>(input: RequestInfo, init?: RequestInit): Promise<JSON> {
	const res = await fetch(input, init);

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		const error = new Error((errorData as any).message || 'An error occurred while fetching the data.');
		(error as any).status = res.status;
		(error as any).data = errorData;
		throw error;
	}

	return res.json() as Promise<JSON>;
}
