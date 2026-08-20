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

function getStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'completed') return 'status-completed';
  if (s === 'sending') return 'status-sending';
  if (s.includes('failed')) return 'status-failed';
  if (s === 'draft') return 'status-draft';
  return 'status-inactive';
}

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
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <div>
              <div className="page-header-title">
                Campaigns
                <span className="page-header-badge">{campaigns.length} total</span>
              </div>
              <div className="page-header-subtitle">Create and manage bulk WhatsApp campaigns</div>
            </div>
          </div>
          <button className="btn-primary" onClick={toggleModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </button>
        </div>
        
        {/* Campaigns Table */}
        <div className="glass-panel">
          <div className="section-header">
            <h2>All Campaigns</h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div className="empty-state-title">No campaigns yet</div>
              <div className="empty-state-desc">Create your first WhatsApp campaign to start engaging with your customers at scale.</div>
              <button className="btn-primary" onClick={toggleModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create First Campaign
              </button>
            </div>
          ) : (
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
                {campaigns.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.audience}</td>
                    <td>{c.sentCount.toLocaleString()}</td>
                    <td><span className={`status-badge ${getStatusClass(c.status)}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input 
                type="text"
                className="form-input"
                value={name} 
                onChange={(e) => handleNameChange(e.target.value)} 
                placeholder="e.g. Summer Sale Announcement" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Audience</label>
              <select 
                className="form-select"
                value={audience} 
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="All Subscribed">All Subscribed Contacts</option>
                <option value="VIP Customers">VIP Customers (5+ orders)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">WhatsApp Template Name</label>
              <input 
                type="text"
                className="form-input"
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                placeholder="marketing_promo" 
              />
              <span className="form-hint">Must match an approved template in your Meta Business Manager.</span>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
