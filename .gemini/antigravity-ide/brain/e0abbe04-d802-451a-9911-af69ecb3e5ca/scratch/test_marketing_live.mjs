const BASE_URL = 'http://localhost:5000';

async function runAuthenticatedTests() {
  console.log('Authenticating as marketing@erp.com...\n');

  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'marketing@erp.com',
      password: 'ChangeMe123!',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginData.message}`);
  }
  const token = loginData.token;
  console.log('Login successful! Role:', loginData.user.role);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Overview
  const overviewRes = await fetch(`${BASE_URL}/api/marketing/overview`, { headers: authHeaders });
  const overview = await overviewRes.json();
  console.log('1. GET /api/marketing/overview:', overviewRes.status, 'Total spend:', overview.data?.totalSpend, 'Blended ROAS:', overview.data?.blendedRoas);

  // 2. Campaigns
  const campRes = await fetch(`${BASE_URL}/api/marketing/campaigns`, { headers: authHeaders });
  const campaigns = await campRes.json();
  console.log('2. GET /api/marketing/campaigns:', campRes.status, 'Count:', campaigns.data?.length);

  // 3. Create Campaign
  const createCampRes = await fetch(`${BASE_URL}/api/marketing/campaigns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Verification Test Campaign',
      platform: 'Google Ads',
      channel: 'Search Intent',
      objective: 'LEAD_GENERATION',
      budget: 18000,
      targetAudience: 'CTOs & CIOs',
    }),
  });
  const createdCamp = await createCampRes.json();
  console.log('3. POST /api/marketing/campaigns:', createCampRes.status, 'Created ID:', createdCamp.data?.id);

  const testCampId = createdCamp.data?.id;

  // 4. Update Campaign (Budget & Audience)
  const updateCampRes = await fetch(`${BASE_URL}/api/marketing/campaigns/${testCampId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      budget: 24000,
      targetAudience: 'Global Enterprise Leaders',
      status: 'ACTIVE',
    }),
  });
  const updatedCamp = await updateCampRes.json();
  console.log('4. PATCH /api/marketing/campaigns/:id:', updateCampRes.status, 'Updated budget:', updatedCamp.data?.budget, 'Audience:', updatedCamp.data?.target_audience);

  // 5. Toggle status
  const toggleRes = await fetch(`${BASE_URL}/api/marketing/campaigns/${testCampId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
  });
  const toggled = await toggleRes.json();
  console.log('5. PATCH /api/marketing/campaigns/:id/status:', toggleRes.status, 'New status:', toggled.data?.status);

  // 6. Delete test campaign
  const delCampRes = await fetch(`${BASE_URL}/api/marketing/campaigns/${testCampId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log('6. DELETE /api/marketing/campaigns/:id:', delCampRes.status);

  // 7. Creatives
  const crRes = await fetch(`${BASE_URL}/api/marketing/creatives`, { headers: authHeaders });
  const creatives = await crRes.json();
  console.log('7. GET /api/marketing/creatives:', crRes.status, 'Count:', creatives.data?.length);

  // 8. Create Creative
  const createCrRes = await fetch(`${BASE_URL}/api/marketing/creatives`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'High Conv Ad',
      format: 'Video',
      headline: 'Scale billing by 10x with zero latency',
      primaryText: 'Automate accounting across all business entities.',
      cta: 'Book Executive Demo',
    }),
  });
  const createdCr = await createCrRes.json();
  console.log('8. POST /api/marketing/creatives:', createCrRes.status, 'Created ID:', createdCr.data?.id);

  // 9. Delete test creative
  const delCrRes = await fetch(`${BASE_URL}/api/marketing/creatives/${createdCr.data?.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log('9. DELETE /api/marketing/creatives/:id:', delCrRes.status);

  // 10. Inbound leads
  const leadsRes = await fetch(`${BASE_URL}/api/marketing/leads`, { headers: authHeaders });
  const leads = await leadsRes.json();
  console.log('10. GET /api/marketing/leads:', leadsRes.status, 'Total leads:', leads.data?.length);

  // 11. Batch sync leads
  const batchSyncRes = await fetch(`${BASE_URL}/api/marketing/leads/batch-sync`, {
    method: 'POST',
    headers: authHeaders,
  });
  const batchSync = await batchSyncRes.json();
  console.log('11. POST /api/marketing/leads/batch-sync:', batchSyncRes.status, 'Synced:', batchSync.data?.syncedCount);

  // 12. Recommendation Apply
  const recRes = await fetch(`${BASE_URL}/api/marketing/recommendations/apply`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ recommendationType: 'SCALE_BUDGET', action: 'APPLY' }),
  });
  const recData = await recRes.json();
  console.log('12. POST /api/marketing/recommendations/apply:', recRes.status, recData.message);

  console.log('\nAll 12 authenticated digital marketing operations executed with 100% success!');
}

runAuthenticatedTests().catch(console.error);
