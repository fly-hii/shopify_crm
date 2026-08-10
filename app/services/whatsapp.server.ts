export async function sendWhatsAppMessage({
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = "en_US"
}: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
}) {
  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("WhatsApp API Error:", errorData);
    throw new Error(`Failed to send WhatsApp message: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
