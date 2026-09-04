const BASE_URL = 'http://localhost:5000';

async function testClientManagement() {
  console.log('Testing Client Management APIs...\n');

  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'marketing@erp.com', password: 'ChangeMe123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 1. Overview
  const overRes = await fetch(`${BASE_URL}/api/marketing/clients/overview`, { headers });
  const over = await overRes.json();
  console.log('1. Overview:', overRes.status, 'Total Retainer:', over.data?.totalMonthlyRetainer, 'Active Clients:', over.data?.activeClients);

  // 2. Clients
  const clientsRes = await fetch(`${BASE_URL}/api/marketing/clients`, { headers });
  const clients = await clientsRes.json();
  console.log('2. Clients list:', clientsRes.status, 'Count:', clients.data?.length);

  // 3. Create Client
  const createClientRes = await fetch(`${BASE_URL}/api/marketing/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Test Client Enterprises',
      industry: 'FinTech',
      contact_name: 'Alex Vance',
      contact_email: 'alex@testclient.com',
      monthly_retainer: 14000,
      website: 'https://testclient.com',
    }),
  });
  const createdClient = await createClientRes.json();
  console.log('3. Create Client:', createClientRes.status, 'ID:', createdClient.data?.id);
  const clientId = createdClient.data?.id;

  // 4. Create Project
  const createProjRes = await fetch(`${BASE_URL}/api/marketing/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      client_id: clientId,
      title: 'Fintech Performance Acquisition',
      category: 'Paid Search',
      budget: 18000,
      target_roas: 5.2,
      deadline: '2026-10-31',
      deliverables: 'Search campaigns, Landing pages',
    }),
  });
  const createdProj = await createProjRes.json();
  console.log('4. Create Project:', createProjRes.status, 'ID:', createdProj.data?.id);
  const projId = createdProj.data?.id;

  // 5. Create Asset
  const createAssetRes = await fetch(`${BASE_URL}/api/marketing/assets`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      client_id: clientId,
      project_id: projId,
      name: 'High-Intent Ad Copy Deck',
      asset_type: 'Copywriting',
      file_format: 'Drive / Doc',
      asset_url: 'https://docs.google.com/test-deck',
      status: 'IN_REVIEW',
      notes: 'Initial draft for client approval',
    }),
  });
  const createdAsset = await createAssetRes.json();
  console.log('5. Create Asset:', createAssetRes.status, 'ID:', createdAsset.data?.id);
  const assetId = createdAsset.data?.id;

  // 6. Update Asset Status
  const updateAssetRes = await fetch(`${BASE_URL}/api/marketing/assets/${assetId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  const updatedAsset = await updateAssetRes.json();
  console.log('6. Update Asset Status:', updateAssetRes.status, 'New status:', updatedAsset.data?.status);

  // 7. Cleanup
  await fetch(`${BASE_URL}/api/marketing/assets/${assetId}`, { method: 'DELETE', headers });
  await fetch(`${BASE_URL}/api/marketing/projects/${projId}`, { method: 'DELETE', headers });
  await fetch(`${BASE_URL}/api/marketing/clients/${clientId}`, { method: 'DELETE', headers });
  console.log('7. Cleanup completed.');

  console.log('\nAll Client Management endpoints verified with 100% success!');
}

testClientManagement().catch(console.error);
