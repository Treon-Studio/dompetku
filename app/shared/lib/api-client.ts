export const createResourceApi = (endpoint: string) => ({
	add: async (data: any) => {
		const res = await fetch(endpoint, {
			method: 'POST',
			body: JSON.stringify(data),
		});
		if (!res.ok) throw new Error('Request failed');
		return res;
	},
	edit: async (data: any) => {
		const res = await fetch(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
		if (!res.ok) throw new Error('Request failed');
		return res;
	},
	delete: async (id: string | string[]) => {
		const res = await fetch(endpoint, {
			method: 'DELETE',
			body: JSON.stringify({ id: Array.isArray(id) ? id : [id] }),
		});
		if (!res.ok) throw new Error('Request failed');
		return res;
	},
});
