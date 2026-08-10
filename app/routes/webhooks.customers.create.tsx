import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (topic !== "CUSTOMERS_CREATE") {
    return new Response("Unhandled webhook topic", { status: 404 });
  }

  const phone = payload.phone || payload.default_address?.phone;
  const name = `${payload.first_name || ""} ${payload.last_name || ""}`.trim();

  try {
    await db.contact.upsert({
      where: { 
        shop_shopifyCustomerId: { 
          shop, 
          shopifyCustomerId: payload.id.toString() 
        } 
      },
      create: {
        shop,
        shopifyCustomerId: payload.id.toString(),
        name: name || null,
        phone: phone ? phone.replace(/\D/g, '') : null,
        optInStatus: payload.accepts_marketing ? "Subscribed" : "Pending",
        totalOrders: payload.orders_count || 0
      },
      update: {
        name: name || null,
        phone: phone ? phone.replace(/\D/g, '') : null,
        optInStatus: payload.accepts_marketing ? "Subscribed" : "Pending",
        totalOrders: payload.orders_count || 0
      }
    });
    console.log(`Successfully synced customer ${payload.id} for shop ${shop}`);
  } catch (error) {
    console.error(`Failed to sync customer ${payload.id} for shop ${shop}:`, error);
  }

  return new Response("Webhook processed", { status: 200 });
};
