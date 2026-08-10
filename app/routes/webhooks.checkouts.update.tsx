import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { sendWhatsAppMessage } from "../services/whatsapp.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic !== "CHECKOUTS_UPDATE") {
    return new Response("Unhandled webhook topic", { status: 404 });
  }

  // Check if checkout is abandoned (MVP logic: if it has an email/phone but no completed at)
  if (payload.completed_at) {
     return new Response("Checkout already completed", { status: 200 });
  }

  // 1. Check if the "Abandoned Cart" automation is active for this shop
  const automation = await db.automation.findUnique({
    where: { shop_eventType: { shop, eventType: "CHECKOUTS_UPDATE" } }
  });

  if (automation && automation.isActive) {
    const settings = await db.settings.findUnique({ where: { shop } });
    
    if (settings && settings.accessToken && settings.phoneNumberId) {
      const phone = payload.customer?.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
      
      if (phone) {
        // NOTE: In a production app, you would schedule a background job to wait 30 minutes 
        // before sending this. For MVP, we mock the trigger.
        try {
          await sendWhatsAppMessage({
            phoneNumberId: settings.phoneNumberId,
            accessToken: settings.accessToken,
            to: phone.replace(/\D/g, ''),
            templateName: automation.templateName || "abandoned_cart_reminder"
          });
          console.log(`[Mock Scheduled] Sent abandoned cart WhatsApp to ${phone}`);
        } catch (error) {
          console.error("Failed to send abandoned cart WhatsApp message:", error);
        }
      }
    }
  }

  return new Response("Webhook processed", { status: 200 });
};
