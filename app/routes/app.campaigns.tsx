import { Page, Modal } from "@shopify/polaris";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const campaigns = await db.campaign.findMany({ 
    where: { shop: session.shop },
    orderBy: { createdAt: 'desc' }
  });
  return json({ campaigns });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const audience = formData.get("audience") as string;
  const templateName = formData.get("templateName") as string || "marketing_promo";
  
  // 1. Create Campaign Record
  const campaign = await db.campaign.create({
    data: {
      shop: session.shop,
      name,
      audience,
      status: "Sending"
    }
  });

  // 2. Fetch Settings and Contacts
  const settings = await db.settings.findUnique({ where: { shop: session.shop } });
  
  if (!settings || !settings.accessToken || !settings.phoneNumberId) {
    await db.campaign.update({ where: { id: campaign.id }, data: { status: "Failed (No API Keys)" }});
    return json({ error: "WhatsApp Settings not configured" });
  }

  const contacts = await db.contact.findMany({
    where: { shop: session.shop, optInStatus: "Subscribed", phone: { not: null } }
  });

  // 3. Send Bulk Messages
  let sentCount = 0;
  for (const contact of contacts) {
    try {
      if (contact.phone) {
        console.log(`[Mock Bulk Send] Sent ${templateName} to ${contact.phone}`);
        sentCount++;
      }
    } catch (e) {
      console.error(`Failed to send to ${contact.phone}`, e);
    }
  }

  // 4. Update Campaign Record
  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      sentCount,
      status: "Completed"
    }
  });
  
  return json({ success: true });
};

export default function Campaigns() {
  const { campaigns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const submit = useSubmit();
  
  const [active, setActive] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("All Subscribed");
  const [templateName, setTemplateName] = useState("summer_promo");

  const toggleModal = useCallback(() => setActive((active) => !active), []);
  const handleNameChange = useCallback((value: string) => setName(value), []);
  
  const isSubmitting = nav.state === "submitting";

  useEffect(() => {
    if (nav.state === "idle" && actionData?.success) {
      setActive(false);
      setName("");
    }
  }, [nav.state, actionData]);

  const handleCreate = () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("audience", audience);
    formData.append("templateName", templateName);
    submit(formData, { method: "post" });
  };

  return (
    <Page fullWidth>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Campaigns</h1>
          <button className="btn-primary" onClick={toggleModal}>+ New Campaign</button>
        </div>
        
        <div className="glass-panel">
          <h2>All Campaigns</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Audience</th>
                <th>Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                 <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "32px" }}>No campaigns yet. Click New Campaign to get started.</td>
                 </tr>
              ) : (
                campaigns.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.audience}</td>
                    <td>{c.sentCount}</td>
                    <td><span className={`status-badge ${c.status === 'Completed' ? 'status-active' : 'status-draft'}`}>{c.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={active}
        onClose={toggleModal}
        title="Create New WhatsApp Campaign"
        primaryAction={{
          content: isSubmitting ? 'Sending...' : 'Send Campaign',
          onAction: handleCreate,
          disabled: isSubmitting || !name
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: toggleModal,
          },
        ]}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Campaign Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => handleNameChange(e.target.value)} 
                placeholder="e.g. Summer Sale Announcement" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Audience</label>
              <select 
                value={audience} 
                onChange={(e) => setAudience(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <option value="All Subscribed">All Subscribed Contacts</option>
                <option value="VIP Customers">VIP Customers (5+ orders)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>WhatsApp Template Name</label>
              <input 
                type="text" 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                placeholder="marketing_promo" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} 
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This must exactly match an approved template in your Meta Business Manager.</p>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
