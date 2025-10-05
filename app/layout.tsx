import type { Metadata } from 'next';
import { Geist, Geist_Mono,Outfit,EB_Garamond } from 'next/font/google';

import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

const outfit = Outfit({
	variable: '--font-outfit',
	subsets: ['latin'],
});

const ebGaramond = EB_Garamond({
	variable: '--font-eb-garamond',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Career Bridge',
	description: 'Find your next career opportunity with Career Bridge',
	appleWebApp: {
		title: 'Career Bridge',
	},
	manifest: '/manifest.json',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`${geistSans.className} ${geistMono.variable} ${outfit.variable} ${ebGaramond.variable} 	antialiased`}>{children}</body>
		</html>
	);
}
