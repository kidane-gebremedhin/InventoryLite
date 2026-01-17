import type { Metadata } from "next";
import { Inter } from "next/font/google";
import HardReload from "@/components/helpers/HardReload";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from "@/lib/app_config/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: `${APP_NAME} - ${APP_TITLE}`,
	description: APP_DESCRIPTION,
	icons: {
		icon: "/images/logos/logo-1.JPG",
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<body className={inter.className} suppressHydrationWarning={true}>
				<AuthProvider>{children}</AuthProvider>
				<HardReload />
			</body>
		</html>
	);
}
