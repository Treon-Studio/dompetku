import { getRangeDateForFilter } from './date';
import { views } from './table';

const isProduction = typeof import.meta !== 'undefined' ? import.meta.env.PROD : false;

const domain = 'dompetku';
const local = 'localhost:3000';
const home = isProduction ? domain : local;

const url = {
	homeWithoutApp: home,
	home: `//${home}`,
	api: `/api`,
	serverApi: `${isProduction ? 'https://' : 'http://'}${home}`,
	app: {
		signin: `/signin`,
		signup: `/signup`,
		forgotPassword: `/forgot-password`,
		resetPassword: `/reset-password`,
		overview: `/dashboard`,
	},
	twitter: 'https://twitter.com/gokul_i',
	github: 'https://github.com/gokulkrishh/dompetku',
};

export const getApiUrl = (filterKey: string, apiPath: string, categories: string[] = [], isNotRange = false) => {
	if (isNotRange) {
		return `/api/${apiPath}`;
	}

	if (filterKey === views.all.key) {
		return `/api/${apiPath}?categories=${categories?.join(',')}`;
	}

	const [start, end] = getRangeDateForFilter(filterKey);
	return `/api/${apiPath}?from=${start}&to=${end}&categories=${categories?.join(',')}`;
};

export default url;
