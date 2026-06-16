import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import urls from "~/shared/constants/url";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const isProduction = typeof import.meta !== "undefined" ? import.meta.env.PROD : false;

export const getRedirectUrl = () => {
	let url = import.meta.env.VITE_SITE_URL ?? urls.app.overview;
	// Make sure to include `https://` when not localhost.
	url = isProduction ? `https:${url}` : `http://app.${url}`;
	// Make sure to including trailing `/`.
	url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
	return url;
};
