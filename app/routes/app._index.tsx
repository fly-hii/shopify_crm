import { Page, Layout } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {
    metrics: {
      messagesSent: 12450,
      deliveryRate: '98%',
      readRate: '75%',
      activeCampaigns: 3
    }
  };
};

export default function Index() {
  const { metrics } = useLoaderData<typeof loader>();

  return (
    <Page fullWidth>
      <div className="animate-fade-in">
        <h1 style={{ marginBottom: '24px' }}>WhatsApp CRM Dashboard</h1>
        
        <div className="card-grid">
          <div className="glass-panel">
            <div className="metric-label">Total Messages Sent</div>
            <div className="metric-value">{metrics.messagesSent.toLocaleString()}</div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>↑ 12% from last week</div>
          </div>
          
          <div className="glass-panel">
            <div className="metric-label">Delivery Rate</div>
            <div className="metric-value">{metrics.deliveryRate}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Industry average: 92%</div>
          </div>
          
          <div className="glass-panel">
            <div className="metric-label">Read Rate</div>
            <div className="metric-value">{metrics.readRate}</div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>↑ 5% from last week</div>
          </div>
          
          <div className="glass-panel">
            <div className="metric-label">Active Campaigns</div>
            <div className="metric-value">{metrics.activeCampaigns}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Running currently</div>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <Layout>
            <Layout.Section>
              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Recent Activity</h2>
                  <button className="btn-secondary">View All</button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign/Automation</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Abandoned Cart Reminder</td>
                      <td>Automation</td>
                      <td><span className="status-badge status-active">Active</span></td>
                      <td>Today, 10:23 AM</td>
                    </tr>
                    <tr>
                      <td>Summer Sale Announcement</td>
                      <td>Bulk Campaign</td>
                      <td><span className="status-badge status-active">Sending</span></td>
                      <td>Today, 09:00 AM</td>
                    </tr>
                    <tr>
                      <td>Order Confirmation - #1024</td>
                      <td>Transactional</td>
                      <td><span className="status-badge status-draft">Delivered</span></td>
                      <td>Yesterday</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Layout.Section>
          </Layout>
        </div>
      </div>
    </Page>
  );
}
