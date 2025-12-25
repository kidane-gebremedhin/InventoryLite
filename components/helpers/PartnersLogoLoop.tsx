import {
	SiNextdotjs,
	SiReact,
	SiTailwindcss,
	SiTypescript,
} from "react-icons/si";
import LogoLoop from "./logo_loop/LogoLoop";

const techLogos = [
	{ id: 1, node: <SiReact />, title: "React", href: "https://react.dev" },
	{
		id: 2,
		node: <SiNextdotjs />,
		title: "Next.js",
		href: "https://nextjs.org",
	},
	{
		id: 3,
		node: <SiTypescript />,
		title: "TypeScript",
		href: "https://www.typescriptlang.org",
	},
	{
		id: 4,
		node: <SiTailwindcss />,
		title: "Tailwind CSS",
		href: "https://tailwindcss.com",
	},
];

export default function PartnersLogoLoop() {
	return (
		<div
			className="pt-5"
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
