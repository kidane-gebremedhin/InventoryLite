import Image from "next/image";
import LogoLoop from "./logo_loop/LogoLoop";

const techLogos = [
	{
		id: 1,
		node: (
			<Image
				src="/images/logos/partner-companies/icon-d.JPG"
				width={80}
				height={80}
				alt="PL"
				className="rounded-lg shadow-lg"
				unoptimized
			/>
		),
		title: "React",
		href: "https://react.dev",
	},
	{
		id: 2,
		node: (
			<Image
				src="/images/logos/partner-companies/icon-t.JPG"
				width={80}
				height={80}
				alt="PL"
				className="rounded-lg shadow-lg"
				unoptimized
			/>
		),
		title: "Next.js",
		href: "https://nextjs.org",
	},
	{
		id: 3,
		node: (
			<Image
				src="/images/logos/partner-companies/icon-n.JPG"
				width={80}
				height={80}
				alt="PL"
				className="rounded-lg shadow-lg"
				unoptimized
			/>
		),
		title: "TypeScript",
		href: "https://www.typescriptlang.org",
	},
	{
		id: 4,
		node: (
			<Image
				src="/images/logos/partner-companies/icon-e.JPG"
				width={80}
				height={80}
				alt="PL"
				className="rounded-lg shadow-lg"
				unoptimized
			/>
		),
		title: "Tailwind CSS",
		href: "https://tailwindcss.com",
	},
];

export default function PartnersLogoLoop() {
	return (
		<div
			className="pt-1"
			style={{ height: "100px", position: "relative", overflow: "hidden" }}
		>
			<LogoLoop
				logos={techLogos}
				speed={120}
				direction="left"
				logoHeight={48}
				gap={40}
				pauseOnHover
				scaleOnHover
				fadeOut
				fadeOutColor="#ffffff"
				ariaLabel="Technology partners"
			/>
		</div>
	);
}
