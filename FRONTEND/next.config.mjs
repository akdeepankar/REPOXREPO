/** @type {import('next').NextConfig} */
const nextConfig = {
	outputFileTracingRoot: import.meta.dirname,
		images: {
			remotePatterns: [
				{
					protocol: 'https',
					hostname: 'upload.wikimedia.org',
				},
			],
		},
};

export default nextConfig;
