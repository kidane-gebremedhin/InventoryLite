import { NextResponse } from "next/server";
import { getCurrentDateTime } from "@/lib/helpers/Helper";
import { sendUpcomingPaymentDueNotificationMail } from "@/lib/server_actions/mail";

export async function POST(req: Request) {
	console.log("Cron 1", req);
	// 1. Verify Authorization Header
	const authHeader = req.headers.get("Authorization");
	if (authHeader !== `Bearer ${process.env.SUPABASE_CRON_SECRET}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const bodyPlain: string = await req.text();
		console.log("Cron 2", bodyPlain);
		const bodyJson = JSON.parse(bodyPlain);
		console.log("Cron 3", bodyPlain);

		let successCount = 0,
			errorCount = 0;
		await bodyJson.data.forEach(async (obj) => {
			console.log("Cron 3", obj);
			const { data: _, error: emailError } =
				await sendUpcomingPaymentDueNotificationMail({
					email: obj.email,
					tenantName: obj.tenantName,
					paymentAmount: obj.paymentAmount,
					currencyType: obj.currencyType,
					dueDate: obj.dueDate,
				});
			if (emailError) {
				console.log(
					`Failed to send upcoming payment due notification email to ${obj.tenantName}(${obj.email})`,
				);
				errorCount += 1;
			} else {
				console.log("Cron 4");
				successCount += 1;
			}
		});

		if (errorCount > 0) {
			console.log(
				`[ERROR] - ${errorCount} payment due notification emails failed to be sent at ${getCurrentDateTime()}`,
			);
		}

		console.log("Cron 5");
		return NextResponse.json({
			success: true,
			message: `${successCount} payment due notification emails sent at ${getCurrentDateTime()}`,
		});
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
