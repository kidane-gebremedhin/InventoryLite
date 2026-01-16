import { APP_EMAIL } from "@/lib/app_config/config";

export default function TermsAndConditionsPage() {
	return (
		<div className="container mx-auto p-8 max-w-4xl bg-white shadow-lg rounded-lg my-12">
			<h1 className="text-center font-bold text-lg">Terms of Service</h1>
			<h3 className="text-right py-3">Last updated on: 16 January 2026.</h3>
			<p className="w-full py-3">
				1. Information We Collect: We collect information to provide a better
				experience and maintain your inventory records.
				<p>Account Data: email address when you register.</p>
				<p>
					Inventory Data: Product names, descriptions, stock levels, and pricing
					that you input.
				</p>
				<p>
					Usage Data: Information on how you interact with the app (e.g.,
					features used, time spent) to help us improve performance.
				</p>
			</p>
			<p className="w-full py-3">
				2. How We Use Your Information: We use the collected data for the
				following purposes:
				<p>To manage your account and provide customer support.</p>
				<p>To sync your inventory across multiple devices.</p>
				<p>
					To send essential service updates (e.g., security alerts or billing
					notices).
				</p>
				<p>
					Note: We do not sell your personal or business data to third parties.
				</p>
			</p>
			<p className="w-full py-3">
				3. Data Storage & Security Cloud Storage: Your data is stored securely
				using Supabase/PostgreSQL with industry-standard encryption. Security
				Measures: We implement technical and organizational measures to protect
				your data against unauthorized access or loss.
			</p>
			<p className="w-full py-3">
				4. Third-Party Services: We may use third-party providers for specific
				functions:
				<p>
					Authentication: Google/Apple/Supabase Auth to verify your identity.
				</p>
				<p>Analytics: Google Analytics/PostHog to understand app usage.</p>
				<p>Hosting: Vercel/AWS to run the application infrastructure.</p>
			</p>
			<p className="w-full py-3">
				5. Your Rights Depending on your location, you may have the right to:
				<p>Access: Request a copy of the data we hold about you.</p>
				<p>Correction: Update any inaccurate information.</p>
				<p>
					Deletion: Request that we delete your account and all associated data.
				</p>
			</p>
			<p className="w-full py-3">
				6. Data Retention: We retain your information as long as your account is
				active. If you delete your account, we will remove your personal data
				from our active databases within 30 days, unless required by law to keep
				it longer.
			</p>
			<p className="w-full py-3">
				7. Contact Us If you have questions about this policy, please contact us
				at:
				{APP_EMAIL}
			</p>
		</div>
	);
}
