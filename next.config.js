/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "localhost",
				port: "",
				pathname: "/images/**",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
			},
		],
	},
};

module.exports = nextConfig;
