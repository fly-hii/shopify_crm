import { Page, Layout } from "@shopify/polaris";
import { useLoaderData, Link } from "@remix-run/react";
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
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div>
              <div className="page-header-title">Dashboard</div>
              <div className="page-header-subtitle">WhatsApp CRM overview & key metrics</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="card-grid stagger-children">
          {/* Messages Sent */}
          <div className="glass-panel metric-card">
            <div className="metric-card-header">
              <div className="metric-label">Messages Sent</div>
              <div className="metric-icon metric-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{metrics.messagesSent.toLocaleString()}</div>
            <div className="metric-trend metric-trend--up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              12% from last week
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="glass-panel metric-card">
            <div className="metric-card-header">
              <div className="metric-label">Delivery Rate</div>
              <div className="metric-icon metric-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{metrics.deliveryRate}</div>
            <div className="metric-trend metric-trend--neutral">Industry avg: 92%</div>
          </div>

          {/* Read Rate */}
          <div className="glass-panel metric-card">
            <div className="metric-card-header">
              <div className="metric-label">Read Rate</div>
              <div className="metric-icon metric-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{metrics.readRate}</div>
            <div className="metric-trend metric-trend--up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              5% from last week
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="glass-panel metric-card">
            <div className="metric-card-header">
              <div className="metric-label">Active Campaigns</div>
              <div className="metric-icon metric-icon--violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="metric-value">{metrics.activeCampaigns}</div>
            <div className="metric-trend metric-trend--neutral">Running now</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ marginTop: '32px' }}>
          <div className="glass-panel">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <Link to="/app/campaigns" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary">View All</button>
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign / Automation</th>
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
                  <td><span className="status-badge status-sending">Sending</span></td>
                  <td>Today, 09:00 AM</td>
                </tr>
                <tr>
                  <td>Order Confirmation — #1024</td>
                  <td>Transactional</td>
                  <td><span className="status-badge status-completed">Delivered</span></td>
                  <td>Yesterday</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions stagger-children" style={{ marginTop: '24px' }}>
          <Link to="/app/campaigns" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'rgba(37, 211, 102, 0.1)', color: 'var(--accent-primary)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <div className="quick-action-label">Create Campaign</div>
              <div className="quick-action-sublabel">Send bulk WhatsApp messages</div>
            </div>
          </Link>

          <Link to="/app/automations" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--blue-glow)', color: 'var(--blue)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <div className="quick-action-label">Manage Automations</div>
              <div className="quick-action-sublabel">Configure event-driven messages</div>
            </div>
          </Link>

          <Link to="/app/contacts" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--violet-glow)', color: 'var(--violet)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="quick-action-label">View Contacts</div>
              <div className="quick-action-sublabel">Manage your subscriber list</div>
            </div>
          </Link>
        </div>
      </div>
    </Page>
  );
}
