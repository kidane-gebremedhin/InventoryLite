import Link from "next/link";
import { APP_NAME } from "@/lib/app_config/config";

export default function CallToAction() {
	return (
		<section className="bg-gradient-to-tr from-green-500 to-teal-500 py-20 text-white">
			<div className="container mx-auto px-4 text-center">
				<h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
					Ready to Take Control of Your Inventory?
				</h2>
				<p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
					Join hundreds of businesses already optimizing their operations with{" "}
					{APP_NAME}. Start your free trial today!
				</p>
				<Link
					href="/pricing-plan"
					className="px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
				>
					Get Started
				</Link>
			</div>
		</section>
	);
}
