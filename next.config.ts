import type { NextConfig } from 'next';
import { env } from './env';

const nextConfig: NextConfig = {
	/* config options here */ images: {
		remotePatterns: [{ hostname: new URL(env.NEXT_PUBLIC_R2_URL).hostname }],
	},
};

export default nextConfig;
