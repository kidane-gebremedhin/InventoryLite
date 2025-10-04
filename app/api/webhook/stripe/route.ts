
import { STRIPE_PAYMENT_EVENT, DATABASE_TABLE } from "@/lib/Enums";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { headers } from 'next/headers';
import { Stripe } from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Do not export this, only use it for webhooks
const createServerClientWithServiceKey = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(req) {
    const supabase = createServerClientWithServiceKey();
    const body: string = await req.text();
    const signature: string | null = headers().get('stripe-signature');

    let event: Stripe.Event;

    // Verify Stripe event is legit
    try {
        if (!signature) {
            throw new Error('No signature header provided');
        }
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('Webhook secret is not set');
        }
        event = Stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`Webhook signature verification failed. ${err.message}`);
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 400 });
    }

    const data: Stripe.Event.Data = event.data;
    const eventType: string = event.type;
    
    try {
        switch (eventType) {
            case STRIPE_PAYMENT_EVENT.CHECKOUT_SESSION_COMPLETED: {
                // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
                // ✅ Grant access to the product
                let user;
                const session: Stripe.Checkout.Session = await stripe.checkout.sessions.retrieve(
                    (data.object as Stripe.Checkout.Session).id,
                    {
                        expand: ['line_items']
                    }
                ) as Stripe.Checkout.Session;

                const customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null = session?.customer;
                if (!customerId || typeof customerId !== 'string') {
                    throw new Error('Customer ID is missing or invalid.');
                }
                
                const customer: Stripe.Customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

                const priceId: string | undefined = session?.line_items?.data?.[0]?.price?.id;
                const { data: tenants, error } = await supabase
                    .from(DATABASE_TABLE.tenants)
                    .insert({name: priceId+' '+customerId, domain: customer.email +' '+customer.name, status: 'active', price_id: eventType + ' ' +customer.email});
                /*
                if (customer.email) {
                    user = await User.findOne({ email: customer.email });

                    if (!user) {
                        user = await User.create({
                            email: customer.email,
                            name: customer.name,
                            customerId
                        });

                        await user.save();
                    }
                } else {
                    console.error('No user found');
                    throw new Error('No user found');
                }

                // Update user data + Grant user access to your product. It's a boolean in the database, but could be a number of credits, etc...
                user.priceId = priceId;
                user.hasAccess = true;
                await user.save();
                */

                // Extra: >>>>> send email to dashboard <<<<
                break;
            }

            case STRIPE_PAYMENT_EVENT.CUSTOMER_SUBSCRIPTION_DELETED: {
                /*
                // ❌ Revoke access to the product
                // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
                const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
                    (data.object as Stripe.Subscription).id
                ) as Stripe.Subscription;

                const user = await User.findOne({
                    customerId: subscription.customer
                });

                if (user) {
                    // Revoke access to your product
                    user.hasAccess = false;
                    await user.save();
                }

                break;
                */
               break;
            }

            default:
                // Unhandled event type
                break;
        }
    } catch (e: unknown) {
    }

    return NextResponse.json({ received: true });
}

