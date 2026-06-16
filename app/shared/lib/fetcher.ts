export default async function fetcher<JSON = unknown>(input: RequestInfo, init?: RequestInit): Promise<JSON> {
	const res = await fetch(input, init);

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		const error = new Error(
			(errorData as Record<string, string>).message || "An error occurred while fetching the data.",
		);
		(error as Record<string, unknown>).status = res.status;
		(error as Record<string, unknown>).data = errorData;
		throw error;
	}

	return res.json() as Promise<JSON>;
}
