import "./../globals.css";
import PartnersLogoLoop from "@/components/helpers/PartnersLogoLoop";
import CallToAction from "@/components/layout/CallToAction";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen">
			{/* Navbar */}
			<Navbar />
			<div className="bg-gray-50 font-sans text-gray-800 antialiased">
				{children}
			</div>
			<PartnersLogoLoop />
			{/* Call to Action Section */}
			<CallToAction />
			<Footer />
		</div>
	);
}
