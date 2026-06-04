import { Links, Meta, Scripts } from '@remix-run/react';

import { GA4_ANALYTICS_ID } from '~/env';

import './globals.css';
import './overwrites.css';

const title = 'Dompetku - Track your expenses with ease';
const description = 'Effortlessly Track and Manage Expenses.';

export const links = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
	},
];

export const meta = () => [
	{ title },
	{ name: 'description', content: description },
	{ name: 'manifest', content: 'https://dompetku/manifest.json' },
	{ name: 'twitter:card', content: 'summary_large_image' },
	{ name: 'twitter:title', content: title },
	{ name: 'twitter:description', content: description },
	{ name: 'twitter:creator', content: '@gokul_i' },
	{ property: 'og:image', content: 'https://dompetku/og.jpg' },
	{ property: 'og:title', content: title },
	{ property: 'og:description', content: description },
	{ property: 'og:url', content: 'https://dompetku' },
	{ property: 'og:type', content: 'website' },
	{ name: 'apple-mobile-web-app-title', content: title },
	{ name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
	{ name: 'theme-color', content: '#09090b' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="flex h-full flex-col text-gray-600 antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
				{children}
				{GA_SCRIPT && (
					<script
						dangerouslySetInnerHTML={{
							__html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', '${GA_SCRIPT}');
					`,
						}}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}

const GA_SCRIPT = GA4_ANALYTICS_ID;
