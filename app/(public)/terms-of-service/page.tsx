import { APP_EMAIL, APP_NAME } from "@/lib/app_config/config";

export default function TermsAndConditionsPage() {
	return (
		<div className="container mx-auto p-8 max-w-4xl bg-white shadow-lg rounded-lg my-12">
			<h1 className="text-center font-bold text-lg">Terms of Service</h1>
			<h3 className="text-right py-3">Last updated on: 16 January 2026.</h3>
			<p className="w-full py-3">
				1. Acceptance of Terms By creating an account or using {APP_NAME} ("the
				Service"), you agree to be bound by these terms. If you do not agree,
				please do not use the application.
			</p>
			<p className="w-full py-3">
				2. User Responsibilities Account Security: You are responsible for
				maintaining the confidentiality of your login credentials. Accuracy of
				Data: You are responsible for the accuracy of the inventory data,
				pricing, and stock levels entered into the system. Lawful Use: You agree
				not to use the Service for any illegal activities or to store prohibited
				data.
			</p>
			<p className="w-full py-3">
				3. Service Availability & Data Uptime: We strive for 99.9% uptime but do
				not guarantee that the Service will be uninterrupted or error-free. Data
				Backups: While we perform regular backups, you are encouraged to keep
				downloading records of your critical inventory data using the "PDF/Excel
				Export" feature. Modifications: We reserve the right to modify or
				discontinue features of the Service with reasonable notice.
			</p>
			<p className="w-full py-3">
				4. Fees and Payments Subscription: If applicable, fees are billed in
				advance on a [Monthly/Annual] basis. Refunds: Payments are
				non-refundable after the 30-day trial period.
			</p>
			<p className="w-full py-3">
				5. Intellectual Property Our Content: The software, design, and logos
				are the property of {APP_NAME}. Your Content: You retain all rights to
				the data you create. By using the app, you grant us a license to host
				and process this data to provide the Service.
			</p>
			<p className="w-full py-3">
				6. Limitation of Liability {APP_NAME} is provided "as is." We are not
				liable for any financial losses, lost profits, or data inaccuracies
				resulting from the use of the application. Our total liability is
				limited to the amount paid by you in the last 12 months.
			</p>
			<p className="w-full py-3">
				7. Termination We may suspend or terminate your account if you violate
				these terms. You may cancel your account at any time through the account
				settings "Delete My Account" button. 8. Changes to Terms We may update
				these terms from time to time. We will notify you of significant changes
				via email or an in-app notification.
			</p>
			<h2 className="font-bold text-md py-2">End Of Terms Of Service</h2>
			If you have any questions or concerns regarding these terms, please
			contact us at {APP_EMAIL}.
		</div>
	);
}
