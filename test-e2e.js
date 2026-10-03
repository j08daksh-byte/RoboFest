async function run() {
  console.log('Testing End-to-End API Integration...');
  const baseUrl = 'http://localhost:3000/api';

  // 1. Authenticate (should create admin user if it doesn't exist)
  console.log('\\n--- 1. Login ---');
  let res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  let data = await res.json();
  if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(data));
  const token = data.token;
  console.log('Login success, got token');

  // 2. Create Mission
  console.log('\\n--- 2. Create Mission ---');
  res = await fetch(`${baseUrl}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      shipName: 'E2E-Ship',
      objective: 'E2E-Scrap',
      hullSection: 'E2E-A1',
      status: 'PLANNED'
    })
  });
  data = await res.json();
  if (res.status !== 201) throw new Error('Mission creation failed: ' + JSON.stringify(data));
  const missionId = data.data.id;
  console.log('Mission created successfully:', missionId);

  // 3. Create Cut Plan
  console.log('\\n--- 3. Create Cut Plan ---');
  res = await fetch(`${baseUrl}/missions/${missionId}/cuts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      geometryJson: '{"type":"Polygon"}'
    })
  });
  data = await res.json();
  if (res.status !== 201) throw new Error('Cut creation failed: ' + JSON.stringify(data));
  console.log('Cut created successfully:', data.data.id);

  // 4. Create Event Log
  console.log('\\n--- 4. Create Event Log ---');
  res = await fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      category: 'SAFETY',
      severity: 'WARNING',
      message: 'Test Event',
      missionId: missionId
    })
  });
  data = await res.json();
  if (res.status !== 201) throw new Error('Event creation failed: ' + JSON.stringify(data));
  console.log('Event created successfully:', data.data.id);

  // 5. Test Unauthorized (no token)
  console.log('\\n--- 5. Test Unauthorized Access ---');
  res = await fetch(`${baseUrl}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipName: 'Fail' })
  });
  if (res.status === 401) {
    console.log('Successfully rejected unauthorized request.');
  } else {
    throw new Error('Expected 401, got ' + res.status);
  }

  // 6. Test Invalid Payload
  console.log('\\n--- 6. Test Invalid Payload ---');
  res = await fetch(`${baseUrl}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ shipName: 'Missing other fields' })
  });
  if (res.status === 400) {
    console.log('Successfully rejected invalid payload.');
  } else {
    throw new Error('Expected 400, got ' + res.status);
  }

  console.log('\\nALL END-TO-END TESTS PASSED!');
}

run().catch(console.error);
