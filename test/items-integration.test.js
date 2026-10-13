import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Items & Search Integration Tests...\n');

  // Test 1: Categories
  console.log('Test 1: Fetch all categories');
  const catRes = await request('/categories');
  assert.equal(catRes.status, 200);
  assert.equal(catRes.data.success, true);
  assert.ok(catRes.data.data.length >= 6);
  console.log(`✅ Received ${catRes.data.data.length} categories\n`);

  // Test 2: Fetch all items
  console.log('Test 2: Fetch all items without filters');
  const allItems = await request('/items');
  assert.equal(allItems.status, 200);
  assert.equal(allItems.data.success, true);
  assert.ok(allItems.data.data.length >= 18);
  const firstItem = allItems.data.data[0];
  assert.ok(firstItem.id);
  assert.ok(firstItem.name);
  assert.ok(firstItem.category_name);
  assert.ok(firstItem.provider_name);
  assert.ok(Array.isArray(firstItem.images), 'Images should be an array');
  console.log(`✅ Received ${allItems.data.data.length} items with complete relations\n`);

  // Test 3: Search by keyword (e.g. "Drill")
  console.log('Test 3: Keyword search for "Drill"');
  const drillRes = await request('/items?keyword=Drill');
  assert.equal(drillRes.status, 200);
  assert.ok(drillRes.data.data.length > 0);
  drillRes.data.data.forEach((it) => {
    const text = `${it.name} ${it.description} ${it.category_name}`.toLowerCase();
    assert.ok(text.includes('drill'), `Item "${it.name}" should contain keyword "drill"`);
  });
  console.log(`✅ Keyword "Drill" matched ${drillRes.data.data.length} item(s)\n`);

  // Test 4: Search by keyword (e.g. "Camera")
  console.log('Test 4: Keyword search for "Camera"');
  const cameraRes = await request('/items?keyword=Camera');
  assert.equal(cameraRes.status, 200);
  assert.ok(cameraRes.data.data.length >= 2);
  console.log(`✅ Keyword "Camera" matched ${cameraRes.data.data.length} item(s)\n`);

  // Test 5: Filter by Category ID
  const campingCat = catRes.data.data.find((c) => c.slug === 'camping-outdoor');
  assert.ok(campingCat, 'Camping category must exist');
  console.log(`Test 5: Filter by Category ID: ${campingCat.id} (${campingCat.name})`);
  const campingRes = await request(`/items?category_id=${campingCat.id}`);
  assert.equal(campingRes.status, 200);
  assert.ok(campingRes.data.data.length > 0);
  campingRes.data.data.forEach((it) => {
    assert.equal(it.category_id, campingCat.id);
  });
  console.log(`✅ Found ${campingRes.data.data.length} items in "${campingCat.name}"\n`);

  // Test 6: Filter by Price Range (min_price=2000, max_price=5000)
  console.log('Test 6: Filter by Price Range: Rs. 2000 - Rs. 5000');
  const priceRes = await request('/items?min_price=2000&max_price=5000');
  assert.equal(priceRes.status, 200);
  assert.ok(priceRes.data.data.length > 0);
  priceRes.data.data.forEach((it) => {
    assert.ok(
      it.price_per_day >= 2000 && it.price_per_day <= 5000,
      `Item price ${it.price_per_day} should be between 2000 and 5000`
    );
  });
  console.log(`✅ Found ${priceRes.data.data.length} items within price range\n`);

  // Test 7: Filter by Location (e.g. "Kandy")
  console.log('Test 7: Filter by Location: "Kandy"');
  const kandyRes = await request('/items?location=Kandy');
  assert.equal(kandyRes.status, 200);
  assert.ok(kandyRes.data.data.length > 0);
  kandyRes.data.data.forEach((it) => {
    assert.ok(it.location.toLowerCase().includes('kandy'));
  });
  console.log(`✅ Found ${kandyRes.data.data.length} items located in Kandy\n`);

  // Test 8: Sorting by Price Ascending
  console.log('Test 8: Sorting by Price (price_asc)');
  const ascRes = await request('/items?sort=price_asc');
  assert.equal(ascRes.status, 200);
  for (let i = 0; i < ascRes.data.data.length - 1; i++) {
    assert.ok(
      ascRes.data.data[i].price_per_day <= ascRes.data.data[i + 1].price_per_day,
      `Sort failed: ${ascRes.data.data[i].price_per_day} > ${ascRes.data.data[i + 1].price_per_day}`
    );
  }
  console.log('✅ Ascending price sorting verified\n');

  // Test 9: Sorting by Price Descending
  console.log('Test 9: Sorting by Price (price_desc)');
  const descRes = await request('/items?sort=price_desc');
  assert.equal(descRes.status, 200);
  for (let i = 0; i < descRes.data.data.length - 1; i++) {
    assert.ok(
      descRes.data.data[i].price_per_day >= descRes.data.data[i + 1].price_per_day,
      `Sort failed: ${descRes.data.data[i].price_per_day} < ${descRes.data.data[i + 1].price_per_day}`
    );
  }
  console.log('✅ Descending price sorting verified\n');

  // Test 10: Multi-parameter search & filter
  console.log('Test 10: Multi-parameter search (keyword="Camping", location="Kandy", max_price=2000)');
  const multiRes = await request('/items?keyword=Camping&location=Kandy&max_price=2000');
  assert.equal(multiRes.status, 200);
  assert.ok(multiRes.data.data.length >= 1);
  const matched = multiRes.data.data[0];
  assert.ok(matched.location.toLowerCase().includes('kandy'));
  assert.ok(matched.price_per_day <= 2000);
  console.log(`✅ Multi-parameter filter matched: "${matched.name}" at Rs. ${matched.price_per_day}/day\n`);

  // Test 11: Single item details
  console.log(`Test 11: Get single item details (ID: ${firstItem.id})`);
  const singleRes = await request(`/items/${firstItem.id}`);
  assert.equal(singleRes.status, 200);
  assert.equal(singleRes.data.data.id, firstItem.id);
  assert.ok(singleRes.data.data.provider_name);
  assert.ok(singleRes.data.data.category_name);
  console.log(`✅ Single item loaded successfully: "${singleRes.data.data.name}"\n`);

  // Test 12: Provider login and CRUD flow
  console.log('Test 12: Provider login and CRUD operations');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'provider_colombo@rentright.lk',
      password: 'password123',
    },
  });
  assert.equal(loginRes.status, 200);
  const providerToken = loginRes.data.data.token;
  assert.ok(providerToken);

  // Fetch provider's own items
  const myItemsRes = await request('/items/mine', {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert.equal(myItemsRes.status, 200);
  assert.ok(myItemsRes.data.data.length >= 1);
  console.log(`✅ Provider has ${myItemsRes.data.data.length} active listings`);

  // Create new item
  const createRes = await request('/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      name: 'DeWalt Cordless Angle Grinder 20V MAX',
      category_id: 1,
      description: 'Heavy duty cordless brushless angle grinder with 2x 5Ah batteries, charger, and abrasive cut-off wheels.',
      price_per_day: 2200.00,
      price_per_hour: 400.00,
      deposit_amount: 5000.00,
      location: 'Colombo 03',
      status: 'available',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
    },
  });
  assert.equal(createRes.status, 201);
  const createdItem = createRes.data.data;
  assert.equal(createdItem.name, 'DeWalt Cordless Angle Grinder 20V MAX');
  console.log(`✅ Created item listing ID: ${createdItem.id}`);

  // Update item
  const updateRes = await request(`/items/${createdItem.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      name: 'DeWalt Cordless Angle Grinder 20V MAX (Updated Kit)',
      price_per_day: 2400.00,
    },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.data.price_per_day, 2400.00);
  console.log('✅ Updated item listing');

  // Delete item
  const deleteRes = await request(`/items/${createdItem.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert.equal(deleteRes.status, 200);
  console.log('✅ Deleted item listing\n');

  console.log('🎉 ALL 12 ITEMS & SEARCH INTEGRATION TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
