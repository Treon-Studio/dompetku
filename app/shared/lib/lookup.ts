import textFilter from "text-filter";

export const lookup = ({
	data,
	name,
	fields = ["name"],
}: {
	data: Record<string, unknown>[];
	name: string;
	fields?: string[];
}) => {
	const result = data.filter(textFilter({ query: name, fields }));
	if (result.length)
		return Object.values(
			result.reduce((acc: Record<string, Record<string, unknown>>, datum: Record<string, unknown>) => {
				const name = (datum?.name as string | undefined)?.toLowerCase();
				if (name && !acc[name]) {
					acc[name] = datum;
				}
				return acc;
			}, {}),
		);
	return [];
};
