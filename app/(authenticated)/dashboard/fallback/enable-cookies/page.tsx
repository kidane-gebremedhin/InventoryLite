import CookiesConsent from "@/components/helpers/CookiesConsent";

export default function EnableCookies() {
	return (
		<div className="w-full">
			<div className="flex items-center justify-center h-80">
				<span className="text-xl text-gray-500">
					Please "Accept" cookies below to use this system.
				</span>
			</div>
			<CookiesConsent />
		</div>
	);
}
