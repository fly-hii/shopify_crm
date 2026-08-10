import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  // Only allow POST
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Ensure this is an authenticated request from the Shopify Admin UI
  // (Alternatively, this could be triggered by a Shopify Webhook internally)
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const template = formData.get("template");
  const phone = formData.get("phone");

  // TODO: Implement actual WhatsApp provider API call (Meta/Twilio/etc)
  console.log(`Sending template ${template} to ${phone} for store ${session.shop}`);

  return json({ success: true, message: "Message queued" });
};
