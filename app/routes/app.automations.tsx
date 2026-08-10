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

  const renderAutomationCard = (title: string, type: string, description: string) => {
    const isActive = getStatus(type);
    
    return (
      <div className="glass-panel" key={type}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>{title}</h2>
          <span className={`status-badge ${isActive ? 'status-active' : 'status-draft'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '24px' }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={isActive ? "btn-secondary" : "btn-primary"}
            onClick={() => toggleAutomation(type, isActive)}
          >
            {isActive ? 'Disable' : 'Enable'}
          </button>
          <button className="btn-secondary" onClick={() => openConfig(type)}>
            Configure
          </button>
        </div>
      </div>
    );
  };

  return (
    <Page fullWidth>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Automations</h1>
        </div>
        
        <div className="card-grid">
          {renderAutomationCard("Abandoned Cart", "CHECKOUTS_UPDATE", "Sends a WhatsApp message 30 minutes after a cart is abandoned.")}
          {renderAutomationCard("Order Confirmation", "ORDERS_CREATE", "Sends a receipt and thank you message immediately after purchase.")}
          {renderAutomationCard("Shipping Update", "FULFILLMENTS_CREATE", "Notifies customers when their order has been fulfilled.")}
        </div>
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>WhatsApp Template Name</label>
              <input 
                type="text" 
                value={templateInput} 
                onChange={(e) => setTemplateInput(e.target.value)} 
                placeholder="e.g. order_confirmation" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} 
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This must exactly match an approved template in your Meta Business Manager for this specific event type.</p>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
