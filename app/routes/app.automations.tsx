import { Page, Modal } from "@shopify/polaris";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const automations = await db.automation.findMany({ where: { shop: session.shop } });
  return json({ automations });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const eventType = formData.get("eventType") as string;
  const actionType = formData.get("actionType") as string;
  
  if (actionType === "toggle") {
    const isActive = formData.get("isActive") === "true";
    await db.automation.upsert({
      where: { shop_eventType: { shop: session.shop, eventType } },
      create: { shop: session.shop, eventType, isActive },
      update: { isActive }
    });
  } else if (actionType === "configure") {
    const templateName = formData.get("templateName") as string;
    await db.automation.upsert({
      where: { shop_eventType: { shop: session.shop, eventType } },
      create: { shop: session.shop, eventType, templateName },
      update: { templateName }
    });
  }
  
  return json({ success: true });
};

const automationConfigs = [
  {
    title: "Abandoned Cart",
    type: "CHECKOUTS_UPDATE",
    description: "Automatically sends a WhatsApp reminder 30 minutes after a customer abandons their cart, recovering lost sales.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    title: "Order Confirmation",
    type: "ORDERS_CREATE",
    description: "Sends an instant receipt and thank-you message via WhatsApp immediately after a customer completes a purchase.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "Shipping Update",
    type: "FULFILLMENTS_CREATE",
    description: "Notifies customers via WhatsApp when their order has been fulfilled and shipped, including tracking details.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

export default function Automations() {
  const { automations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [templateInput, setTemplateInput] = useState("");

  const getAutomation = (type: string) => automations.find((a: any) => a.eventType === type);
  const getStatus = (type: string) => getAutomation(type)?.isActive ?? false;

  const toggleAutomation = (eventType: string, currentlyActive: boolean) => {
    fetcher.submit(
      { eventType, actionType: "toggle", isActive: (!currentlyActive).toString() },
      { method: "post" }
    );
  };

  const openConfig = (type: string) => {
    const auto = getAutomation(type);
    setTemplateInput(auto?.templateName || "");
    setActiveModal(type);
  };

  const saveConfig = () => {
    if (activeModal) {
      fetcher.submit(
        { eventType: activeModal, actionType: "configure", templateName: templateInput },
        { method: "post" }
      );
      setActiveModal(null);
    }
  };

  return (
    <Page fullWidth>
      <div className="animate-fade-in">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <div className="page-header-title">Automations</div>
              <div className="page-header-subtitle">Event-driven WhatsApp messages triggered by store activity</div>
            </div>
          </div>
        </div>

        {/* Automation Cards */}
        <div className="card-grid-3 stagger-children">
          {automationConfigs.map(({ title, type, description, icon }) => {
            const isActive = getStatus(type);
            return (
              <div
                className={`glass-panel automation-card ${isActive ? 'automation-card--active' : 'automation-card--inactive'}`}
                key={type}
              >
                <div className="automation-card-header">
                  <div className="automation-card-icon">
                    {icon}
                  </div>
                  <div className="automation-card-info">
                    <div className="automation-card-title">{title}</div>
                    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <p className="automation-card-desc">{description}</p>
                <div className="automation-card-actions">
                  <button
                    className={isActive ? "btn-danger" : "btn-primary"}
                    onClick={() => toggleAutomation(type, isActive)}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-secondary" onClick={() => openConfig(type)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configure Modal */}
      <Modal
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title="Configure Automation"
        primaryAction={{
          content: 'Save Configuration',
          onAction: saveConfig,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setActiveModal(null),
          },
        ]}
      >
        <Modal.Section>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">WhatsApp Template Name</label>
            <input 
              type="text"
              className="form-input"
              value={templateInput} 
              onChange={(e) => setTemplateInput(e.target.value)} 
              placeholder="e.g. order_confirmation" 
            />
            <span className="form-hint">Must match an approved template in your Meta Business Manager for this event type.</span>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
