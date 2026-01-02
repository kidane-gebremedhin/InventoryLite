import { CheckIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { APP_ACTIVE_CURRENCY } from "@/lib/app_config/config";
import {
	FREE_PLAN_DURATION,
	FREE_PLAN_LABEL,
	PAID_PLAN_MONTHLY,
	PAID_PLAN_YEARLY,
} from "@/lib/Constants";
import { CurrencyType, ROUTE_PATH } from "@/lib/Enums";

const app_prices = {
	ETB: { monthly: 300, yearly: 2500, icon: "ETB" },
	USD: { monthly: 9.99, yearly: 79.99, icon: "$" },
};

const appFeatures = [
	"Unlimited products",
	"Product & SKU management",
	"Product variants (size, color, ...)",
	"Stock tracking (in/out/current quantity)",
	"Multi-store support",
	"Demand monitoring",
	"Low-stock alerts",
	"Supplier management",
	"Purchase orders (POs)",
	"Customer management",
	"Sales orders (SOs)",
	"Reporting",
	"Inventory turnover ratio",
	"Dead stock & slow-moving products",
	"Unlimited users",
	"SSO (OAuth)",
	"Daily backups",
	"Data export & ownership",
	"24/7 support",
];

const tiers = [
	{
		name: "Free Trial",
		id: "tier-starter",
		priceId: "#",
		paymentLink: "#",
		price: "Free",
		description:
			"Get full access for a week just to get a feel of the application.",
		features: appFeatures,
		mostPopular: false,
	},
	{
		name: "Monthly Plan",
		id: "tier-monthly",
		priceId:
			process.env.NODE_ENV === "development"
				? "price_1S8foNBi9Mbeb3tzh9fStzk3"
				: "",
		paymentLink:
			process.env.NODE_ENV === "development"
				? "https://buy.stripe.com/test_3cI28qdtX0jkbZSaTFeIw00"
				: "",
		price: app_prices[APP_ACTIVE_CURRENCY].monthly,
		description:
			"Unlock powerful demand and inventory managment tools for your business.",
		features: appFeatures,
		mostPopular: true,
	},
	{
		name: "Yearly Plan",
		id: "tier-yearly",
		priceId:
			process.env.NODE_ENV === "development"
				? "price_1S8fvJBi9Mbeb3tziMSULl6X"
				: "",
		paymentLink:
			process.env.NODE_ENV === "development"
				? "https://buy.stripe.com/test_8x29AS89D0jk1le2n9eIw01"
				: "",
		price: app_prices[APP_ACTIVE_CURRENCY].yearly,
		description:
			"For businesses that need a comprehensive demand and inventory management solution.",
		features: appFeatures,
		mostPopular: false,
	},
];

export default function PricingPlan() {
	return (
		<>
			<script src="https://cdn.tailwindcss.com"></script>
			<link
				rel="stylesheet"
				href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
				crossOrigin="anonymous"
				referrerPolicy="no-referrer"
			/>
			<style>
				{`
        @import url('https://rsms.me/inter/inter.css');
        :root {
          font-family: 'Inter', sans-serif;
        }
        .bg-gradient {
          background: linear-gradient(135deg, #2a9d8f, #264653);
        }
        .cta-button {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        `}
			</style>
			<div className="bg-white">
				<div className="mx-auto max-w-7xl px-6 py-0 sm:py-0 lg:px-8">
					<div className="bg-gradient-to-br from-green-500 to-teal-500 text-white py-4">
						<div className="mx-auto max-w-4xl text-center">
							<p className="text-base font-semibold leading-7 text-orange-300 text-10xl">
								Pricing
							</p>
							<p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
								Best plans for your modern businesses
							</p>
						</div>
						<p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8">
							Choose a plan that matches with your business needs. Get started
							with a 7-day free trial, no credit card required.
						</p>
					</div>
					{/* This is the container for the pricing tiers. It is now a responsive grid. */}
					<div className="isolate mx-auto mt-16 grid gap-8 sm:mt-20 md:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
						{tiers.map((tier) => (
							<div
								key={tier.id}
								className={`relative flex flex-col rounded-3xl p-8 shadow-lg ring-1 ring-gray-900/10 ${tier.mostPopular ? "bg-green-100" : "bg-white"}`}
							>
								<h3
									id={tier.id}
									className={`text-base font-semibold leading-7 ${tier.mostPopular ? "text-green-600" : "text-gray-900"}`}
								>
									{tier.name}
								</h3>
								<div className="mt-4 flex items-baseline gap-x-2">
									<span className="text-5xl font-bold tracking-tight text-gray-900">
										{tier.price !== FREE_PLAN_LABEL && (
											<span className="text-base font-semibold leading-7 text-gray-600">
												{app_prices[APP_ACTIVE_CURRENCY].icon}
											</span>
										)}
										{tier.price}
									</span>
									<span className="text-base font-semibold leading-7 text-gray-600">
										/
										{tier.price !== FREE_PLAN_LABEL
											? tier.id === "tier-monthly"
												? PAID_PLAN_MONTHLY
												: PAID_PLAN_YEARLY
											: FREE_PLAN_DURATION}
									</span>
								</div>
								<p className="mt-6 text-base leading-7 text-gray-600">
									{tier.description}
								</p>
								<ul className="mt-8 flex flex-col gap-y-3 text-sm leading-6 text-gray-600">
									{tier.features.map((feature) => (
										<li key={feature} className="flex items-center gap-x-3">
											<CheckIcon
												className="h-6 w-5 flex-none text-green-600"
												aria-hidden="true"
											/>
											{feature}
										</li>
									))}
								</ul>
								<Link
									target="_blank"
									href={
										APP_ACTIVE_CURRENCY === CurrencyType.ETB
											? ROUTE_PATH.SIGNIN
											: tier.paymentLink
									}
									aria-describedby={tier.id}
									className={`mt-8 block rounded-md py-0 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-300
                    ${
											tier.mostPopular
												? "bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600"
												: "text-green-600 ring-1 ring-inset ring-green-200 hover:ring-green-300 focus-visible:outline-green-600"
										}`}
								>
									Get Started
								</Link>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
