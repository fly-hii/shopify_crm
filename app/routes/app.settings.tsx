import { Page, Layout } from "@shopify/polaris";
import { useActionData, useLoaderData, Form, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.settings.findUnique({ where: { shop: session.shop } });
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const provider = formData.get("provider") as string;
  const accessToken = formData.get("accessToken") as string | null;
  const phoneNumberId = formData.get("phoneNumberId") as string | null;

  await db.settings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      provider,
      accessToken,
      phoneNumberId
    },
    update: {
      provider,
      accessToken,
      phoneNumberId
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
    <Page fullWidth>
      <div className="animate-fade-in">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div>
              <div className="page-header-title">Settings</div>
              <div className="page-header-subtitle">Configure your WhatsApp Business API connection</div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {actionData?.success && (
          <div className="toast-success">
            <svg className="toast-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="toast-success-text">{actionData.message}</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="glass-panel">
          <Form method="post">
            {/* Provider Section */}
            <div className="settings-section">
              <div className="settings-section-title">API Provider</div>
              <div className="form-group">
                <label className="form-label">Provider</label>
                <select
                  name="provider"
                  className="form-select"
                  defaultValue={settings?.provider || "Meta"}
                >
                  <option value="Meta">Meta Cloud API (Official)</option>
                  <option value="Twilio">Twilio</option>
                  <option value="MessageBird">MessageBird</option>
                </select>
                <span className="form-hint">Select the WhatsApp Business API provider you are using.</span>
              </div>
            </div>

            <hr className="section-divider" />

            {/* Credentials Section */}
            <div className="settings-section">
              <div className="settings-section-title">API Credentials</div>
              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Access Token
                  </span>
                </label>
                <input
                  type="password"
                  name="accessToken"
                  className="form-input"
                  defaultValue={settings?.accessToken || ""}
                  placeholder="Paste your API access token"
                />
                <span className="form-hint">Your permanent access token from Meta Business Manager or your provider's dashboard.</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Phone Number ID
                  </span>
                </label>
                <input
                  type="text"
                  name="phoneNumberId"
                  className="form-input"
                  defaultValue={settings?.phoneNumberId || ""}
                  placeholder="e.g. 109238471092"
                />
                <span className="form-hint">The Phone Number ID from your WhatsApp Business API configuration.</span>
              </div>
            </div>

            <hr className="section-divider" />

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Page>
  );
}
