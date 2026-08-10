import { Page, Layout, Banner } from "@shopify/polaris";
import { useActionData, useLoaderData, Form, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.settings.findUnique({ where: { shop: session.shop } });
  return json({ settings });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const provider = formData.get("provider");
  const accessToken = formData.get("accessToken");
  const phoneNumberId = formData.get("phoneNumberId");

  await db.settings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      provider: provider,
      accessToken: accessToken,
      phoneNumberId: phoneNumberId
    },
    update: {
      provider: provider,
      accessToken: accessToken,
      phoneNumberId: phoneNumberId
    }
  });

  return json({ success: true, message: "Settings saved successfully" });
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  return (
    <Page>
      <div className="animate-fade-in">
        <h1 style={{ marginBottom: '24px' }}>Settings</h1>
        
        {actionData?.success && (
          <div style={{ marginBottom: '24px' }}>
            <Banner title={actionData.message} tone="success" />
          </div>
        )}

        <Layout>
          <Layout.Section>
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
              <h2>WhatsApp API Provider</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Configure your WhatsApp Business connection.</p>
              
              <Form method="post">
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Provider</label>
                  <select name="provider" defaultValue={settings?.provider || "Meta"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                    <option value="Meta">Meta Cloud API</option>
                    <option value="Twilio">Twilio</option>
                    <option value="MessageBird">MessageBird</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Access Token</label>
                  <input type="password" name="accessToken" defaultValue={settings?.accessToken || ""} placeholder="••••••••••••••••" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number ID</label>
                  <input type="text" name="phoneNumberId" defaultValue={settings?.phoneNumberId || ""} placeholder="1092384710923" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>

                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </Form>
            </div>
          </Layout.Section>
        </Layout>
      </div>
    </Page>
  );
}
