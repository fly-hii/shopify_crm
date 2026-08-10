import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendWhatsAppMessage } from "../services/whatsapp.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (topic !== "ORDERS_CREATE") {
    return new Response("Unhandled webhook topic", { status: 404 });
  }

  // 1. Check if the "Order Confirmation" automation is active for this shop
  const automation = await db.automation.findUnique({
    where: { shop_eventType: { shop, eventType: "ORDERS_CREATE" } }
  });

  if (automation && automation.isActive) {
    // 2. Get API credentials
    const settings = await db.settings.findUnique({ where: { shop } });
    
    if (settings && settings.accessToken && settings.phoneNumberId) {
      // 3. Extract customer phone number from the Shopify order payload
      const phone = payload.customer?.phone || payload.shipping_address?.phone;
      
      if (phone) {
        // 4. Send WhatsApp message
        try {
          await sendWhatsAppMessage({
            phoneNumberId: settings.phoneNumberId,
            accessToken: settings.accessToken,
            to: phone.replace(/\D/g, ''), // Strip non-numeric chars
            templateName: "order_confirmation_template" // Should be a valid template in Meta
          });
          console.log(`Sent order confirmation WhatsApp to ${phone} for order ${payload.name}`);
        } catch (error) {
          console.error("Failed to send automated WhatsApp message:", error);
        }
      } else {
        console.log(`Order ${payload.name} does not have a valid phone number attached.`);
      }
    } else {
      console.log(`Settings not configured for shop ${shop}. Cannot send WhatsApp message.`);
    }
  }

  return new Response("Webhook processed", { status: 200 });
};
