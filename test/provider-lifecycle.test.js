/**
 * Provider Workflow Integration Test
 * Verifies:
 * 1. Provider adds new item
 * 2. Provider fetches item inventory with request counts
 * 3. Provider updates item and toggles availability status
 * 4. Renter discovers item and submits rental request
 * 5. Provider receives incoming request
 * 6. Provider approves request (status: accepted)
 * 7. Provider marks completed after return
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTest() {
  console.log('🧪 Starting Provider Management & Request Workflow Integration Test...\n');

  // Step 1: Login or Register Provider
  const providerEmail = `provider_${Date.now()}@example.com`;
  const registerProviderRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Lanka Tool Rentals',
      email: providerEmail,
      password: 'ProviderPass123!',
      phone: '+94 77 123 4567',
      role: 'provider',
      provider_type: 'business',
      business_name: 'Lanka Tool Rentals Ltd',
    }),
  });

  if (!registerProviderRes.data.success) {
    throw new Error('Provider registration failed: ' + registerProviderRes.data.message);
  }
  const providerToken = registerProviderRes.data.data.token;
  const providerUser = registerProviderRes.data.data.user;
  console.log(`✅ 1. Provider registered successfully: ${providerUser.name} (${providerUser.email})`);

  // Step 2: Fetch Categories to get valid category_id
  const catRes = await request('/categories');
  const categories = catRes.data.data;
  const categoryId = categories[0].id;
  console.log(`✅ 2. Retrieved categories. Using category ID ${categoryId} (${categories[0].name})`);

  // Step 3: Provider creates new rental item
  const createItemRes = await request('/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({
      name: 'DeWalt 20V Cordless Brushless Hammer Drill',
      category_id: categoryId,
      description: 'Heavy duty brushless hammer drill with 2 batteries and fast charger.',
      price_per_day: 3500,
      price_per_hour: 500,
      deposit_amount: 10000,
      location: 'Colombo 07, Cinnamon Gardens',
      status: 'available',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
    }),
  });

  if (!createItemRes.data.success) {
    throw new Error('Create item failed: ' + createItemRes.data.message);
  }
  const createdItem = createItemRes.data.data;
  console.log(`✅ 3. Provider listed new item: ID ${createdItem.id} - "${createdItem.name}" at Rs. ${createdItem.price_per_day}/day`);

  // Step 4: Provider views their own inventory
  const myItemsRes = await request('/items/mine', {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  if (!myItemsRes.data.success || myItemsRes.data.data.length === 0) {
    throw new Error('Fetch provider items failed');
  }
  console.log(`✅ 4. Provider inventory verified. Found ${myItemsRes.data.data.length} listing(s).`);

  // Step 5: Provider toggles item status (available -> unavailable -> available)
  const toggleRes = await request(`/items/${createdItem.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ status: 'unavailable' }),
  });
  if (!toggleRes.data.success || toggleRes.data.data.status !== 'unavailable') {
    throw new Error('Toggle status to unavailable failed');
  }
  console.log(`✅ 5a. Provider paused listing: status is now "${toggleRes.data.data.status}"`);

  const toggleBackRes = await request(`/items/${createdItem.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ status: 'available' }),
  });
  if (!toggleBackRes.data.success || toggleBackRes.data.data.status !== 'available') {
    throw new Error('Toggle status back to available failed');
  }
  console.log(`✅ 5b. Provider reactivated listing: status is now "${toggleBackRes.data.data.status}"`);

  // Step 6: Register Renter
  const renterEmail = `renter_${Date.now()}@example.com`;
  const registerRenterRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sunil Perera',
      email: renterEmail,
      password: 'RenterPass123!',
      phone: '+94 71 987 6543',
      role: 'renter',
    }),
  });
  if (!registerRenterRes.data.success) {
    throw new Error('Renter registration failed');
  }
  const renterToken = registerRenterRes.data.data.token;
  console.log(`✅ 6. Renter registered: Sunil Perera (${renterEmail})`);

  // Step 7: Renter sends rental request to provider
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endRental = new Date();
  endRental.setDate(endRental.getDate() + 4);

  const requestRes = await request('/rental-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${renterToken}` },
    body: JSON.stringify({
      item_id: createdItem.id,
      start_date: tomorrow.toISOString().split('T')[0],
      end_date: endRental.toISOString().split('T')[0],
    }),
  });

  if (!requestRes.data.success) {
    throw new Error('Submit rental request failed: ' + requestRes.data.message);
  }
  const rentalRequest = requestRes.data.data;
  console.log(`✅ 7. Renter submitted rental request #REQ-${rentalRequest.id} for item "${createdItem.name}"`);

  // Step 8: Provider checks incoming requests
  const providerRequestsRes = await request('/rental-requests/provider', {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  if (!providerRequestsRes.data.success) {
    throw new Error('Provider get incoming requests failed');
  }
  const incoming = providerRequestsRes.data.data.find((r) => r.id === rentalRequest.id);
  if (!incoming) {
    throw new Error('Incoming rental request not found in provider queue');
  }
  console.log(`✅ 8. Provider received incoming request from renter: ${incoming.renter_name} (Phone: ${incoming.renter_phone}) with status: ${incoming.status}`);

  // Step 9: Provider accepts the request
  const acceptRes = await request(`/rental-requests/${rentalRequest.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ status: 'accepted' }),
  });
  if (!acceptRes.data.success || acceptRes.data.data.status !== 'accepted') {
    throw new Error('Provider accept request failed: ' + acceptRes.data.message);
  }
  console.log(`✅ 9. Provider accepted rental request: status is now "${acceptRes.data.data.status}"`);

  // Step 10: Provider marks completed
  const completeRes = await request(`/rental-requests/${rentalRequest.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ status: 'completed' }),
  });
  if (!completeRes.data.success || completeRes.data.data.status !== 'completed') {
    throw new Error('Provider complete request failed: ' + completeRes.data.message);
  }
  console.log(`✅ 10. Provider completed rental cycle: status is now "${completeRes.data.data.status}"`);

  console.log('\n🎉 ALL 10 PROVIDER MANAGEMENT & REQUEST WORKFLOW TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
