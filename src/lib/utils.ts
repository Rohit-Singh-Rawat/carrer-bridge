import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateId(): string {
	return nanoid();
}

const PRODUCTION_EMAIL_DOMAINS = [
	// Google
	'gmail.com',
	'googlemail.com',

	// Microsoft
	'outlook.com',
	'hotmail.com',
	'live.com',
	'msn.com',
	'passport.com',

	// Yahoo
	'yahoo.com',
	'yahoo.co.uk',
	'yahoo.ca',
	'yahoo.de',
	'yahoo.fr',
	'yahoo.it',
	'yahoo.es',
	'yahoo.com.au',
	'yahoo.co.jp',
	'yahoo.com.br',
	'yahoo.com.mx',
	'yahoo.in',
	'ymail.com',
	'rocketmail.com',

	// Apple
	'icloud.com',
	'me.com',
	'mac.com',

	// AOL
	'aol.com',
	'aim.com',

	// ProtonMail
	'protonmail.com',
	'proton.me',
	'pm.me',

	// Other major providers
	'mail.com',
	'gmx.com',
	'gmx.net',
	'gmx.de',
	'web.de',
	'zoho.com',
	'yandex.com',
	'yandex.ru',
	'mail.ru',
	'rambler.ru',
	'qq.com',
	'163.com',
	'126.com',
	'sina.com',
	'sohu.com',
	'naver.com',
	'daum.net',
	'hanmail.net',
	'rediffmail.com',
	'inbox.com',
	'fastmail.com',
	'tutanota.com',
	'mailbox.org',
	'disroot.org',
	'cock.li',
	'guerrillamail.com',
	'tempmail.org',
	'10minutemail.com',
	'mailinator.com',
	'guerrillamail.org',
];

export function isValidEmailDomain(email: string): boolean {
	if (process.env.NODE_ENV === 'development') {
		return true;
	}

	const domain = email.split('@')[1]?.toLowerCase();
	return domain ? PRODUCTION_EMAIL_DOMAINS.includes(domain) : false;
}
