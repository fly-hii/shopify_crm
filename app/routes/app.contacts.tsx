import { Page } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const contacts = await db.contact.findMany({ where: { shop: session.shop } });
  return json({ contacts });
};

export default function Contacts() {
  const { contacts } = useLoaderData<typeof loader>();
  
  return (
    <Page fullWidth>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Contacts</h1>
          <button className="btn-secondary">Sync from Shopify</button>
        </div>
        
        <div className="glass-panel">
          <input 
            type="text" 
            placeholder="Search contacts by name or number..." 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: '16px' }} 
          />
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Orders</th>
                <th>Opt-in Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                 <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "32px" }}>No contacts found. Sync from Shopify to get started.</td>
                 </tr>
              ) : (
                contacts.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.totalOrders}</td>
                    <td><span className={`status-badge ${c.optInStatus === 'Subscribed' ? 'status-active' : 'status-draft'}`}>{c.optInStatus}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
