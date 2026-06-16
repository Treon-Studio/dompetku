"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { views } from "~/shared/constants/table";
import { getApiUrl } from "~/shared/constants/url";
import fetcher from "~/shared/lib/fetcher";

const DataContext = createContext(null);

type Props = {
	children: React.ReactNode;
	name: string;
	isNotRange?: boolean;
};

export const DataContextProvider = (props: Props) => {
	const { children, name, isNotRange = false } = props;
	const [filter, setFilter] = useState(views.thisMonth.key);
	const [categories, setCategories] = useState<string[]>([]);

	const apiUrl = getApiUrl(filter, name, categories, isNotRange);
	const {
		data = [],
		refetch: mutate,
		isLoading,
	} = useQuery({
		queryKey: [name, apiUrl],
		queryFn: () => fetcher(apiUrl),
	});

	const onFilter = useCallback((categories: string[] = []) => {
		setCategories(categories);
	}, []);

	const value = useMemo(
		() => ({ data, loading: isLoading, filter: { name: filter, setFilter, onFilter }, mutate }),
		[data, isLoading, filter, mutate, onFilter],
	);

	return <DataContext.Provider value={value as any}>{children}</DataContext.Provider>;
};

export const useData = () => {
	const context = useContext<any>(DataContext);
	if (context === undefined) {
		throw new Error(`useData must be used within a DataContext.`);
	}
	return context;
};
