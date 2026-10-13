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
  console.log('🧪 Starting End-to-End Payment & Rental Request Workflow Tests...\n');

  // Step 1: Provider login
  console.log('Step 1: Provider login (Colombo Heavy Rentals)');
  const provLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'provider_colombo@rentright.lk',
      password: 'password123',
    },
  });
  assert.equal(provLogin.status, 200);
  const providerToken = provLogin.data.data.token;
  const providerUser = provLogin.data.data.user;
  console.log(`✅ Provider logged in: ${providerUser.name}\n`);

  // Step 2: Renter registration & login
  const renterEmail = `renter_pay_${Date.now()}@rentright.lk`;
  console.log(`Step 2: Renter registration (${renterEmail})`);
  const renterReg = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Sunil Weerasinghe',
      email: renterEmail,
      password: 'password123',
      phone: '0773344556',
      role: 'renter',
    },
  });
  assert.equal(renterReg.status, 201);
  const renterToken = renterReg.data.data.token;
  const renterUser = renterReg.data.data.user;
  console.log(`✅ Renter registered: ${renterUser.name}\n`);

  // Step 3: Find an item owned by provider
  console.log('Step 3: Browse items owned by provider');
  const itemsRes = await request('/items?keyword=Hammer Drill');
  assert.equal(itemsRes.status, 200);
  const rentalItem = itemsRes.data.data.find((i) => i.provider_id === providerUser.id);
  assert.ok(rentalItem, 'Provider item not found');
  console.log(`✅ Found item: "${rentalItem.name}" (ID ${rentalItem.id}, Provider ${rentalItem.provider_id}) at Rs. ${rentalItem.price_per_day}/day\n`);

  // Step 4: Provider cannot rent own item
  console.log('Step 4: Verify provider cannot submit rental request for own item');
  const selfRent = await request('/rental-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      item_id: rentalItem.id,
      start_date: '2026-10-20',
      end_date: '2026-10-23',
    },
  });
  assert.equal(selfRent.status, 400);
  assert.equal(selfRent.data.success, false);
  console.log('✅ Self-rental properly rejected\n');

  // Step 5: Renter submits a rental request (4 days)
  console.log('Step 5: Renter submits 4-day rental request (2026-10-20 to 2026-10-23)');
  const createReqRes = await request('/rental-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${renterToken}` },
    body: {
      item_id: rentalItem.id,
      start_date: '2026-10-20',
      end_date: '2026-10-23',
    },
  });
  assert.equal(createReqRes.status, 201);
  assert.equal(createReqRes.data.success, true);
  const createdRequest = createReqRes.data.data;
  assert.equal(createdRequest.status, 'pending');
  assert.equal(createdRequest.payment_status, 'unpaid');
  console.log(`✅ Rental request created with ID #REQ-${createdRequest.id} (Status: pending)\n`);

  // Step 6: Renter checks my requests
  console.log('Step 6: Renter fetches submitted requests (/api/rental-requests/mine)');
  const renterReqs = await request('/rental-requests/mine', {
    headers: { Authorization: `Bearer ${renterToken}` },
  });
  assert.equal(renterReqs.status, 200);
  assert.ok(renterReqs.data.data.some((r) => r.id === createdRequest.id));
  console.log(`✅ Renter verified incoming request listed in their dashboard\n`);

  // Step 7: Provider checks incoming requests
  console.log('Step 7: Provider fetches incoming requests (/api/rental-requests/provider)');
  const provReqs = await request('/rental-requests/provider', {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert.equal(provReqs.status, 200);
  const targetReq = provReqs.data.data.find((r) => r.id === createdRequest.id);
  assert.ok(targetReq, 'Request should appear in provider incoming requests');
  assert.equal(targetReq.renter_name, 'Sunil Weerasinghe');
  console.log(`✅ Provider received request from renter "${targetReq.renter_name}"\n`);

  // Step 8: Renter attempts to pay while request is still pending
  console.log('Step 8: Verify payment attempt on pending request is rejected');
  const earlyPay = await request('/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${renterToken}` },
    body: {
      rental_request_id: createdRequest.id,
    },
  });
  assert.equal(earlyPay.status, 400);
  assert.equal(earlyPay.data.success, false);
  console.log('✅ Unapproved payment blocked correctly\n');

  // Step 9: Provider accepts the rental request
  console.log('Step 9: Provider accepts the rental request');
  const acceptRes = await request(`/rental-requests/${createdRequest.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: { status: 'accepted' },
  });
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.data.data.status, 'accepted');
  console.log(`✅ Request #REQ-${createdRequest.id} accepted by provider\n`);

  // Step 10: Unauthorized user attempts to pay
  const intruderEmail = `intruder_${Date.now()}@rentright.lk`;
  const intruderReg = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Intruder User',
      email: intruderEmail,
      password: 'password123',
    },
  });
  const intruderToken = intruderReg.data.data.token;
  console.log('Step 10: Verify third-party cannot pay for someone else’s request');
  const intruderPay = await request('/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${intruderToken}` },
    body: { rental_request_id: createdRequest.id },
  });
  assert.equal(intruderPay.status, 403);
  console.log('✅ Third-party payment attempt blocked (403 Forbidden)\n');

  // Step 11: Renter processes simulated payment
  console.log('Step 11: Renter makes simulated payment');
  const payRes = await request('/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${renterToken}` },
    body: {
      rental_request_id: createdRequest.id,
      payment_method: 'card',
    },
  });
  assert.equal(payRes.status, 201);
  assert.equal(payRes.data.success, true);
  const paymentReceipt = payRes.data.data;
  assert.ok(paymentReceipt.payment_id);
  assert.ok(paymentReceipt.transaction_id);
  assert.equal(paymentReceipt.days, 4); // 4 days inclusive
  const expectedTotal = 4 * rentalItem.price_per_day;
  assert.equal(paymentReceipt.amount, expectedTotal);
  console.log(`✅ Payment completed! Receipt ID: #PAY-${paymentReceipt.payment_id}, TXN: ${paymentReceipt.transaction_id}, Amount: Rs. ${paymentReceipt.amount}\n`);

  // Step 12: Duplicate payment prevention
  console.log('Step 12: Verify duplicate payment on same request is rejected');
  const dupPay = await request('/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${renterToken}` },
    body: {
      rental_request_id: createdRequest.id,
    },
  });
  assert.equal(dupPay.status, 400);
  assert.equal(dupPay.data.success, false);
  console.log('✅ Duplicate payment prevented\n');

  // Step 13: Renter checks Payment History
  console.log('Step 13: Renter checks Payment History (/api/payments/mine)');
  const myPaymentsRes = await request('/payments/mine', {
    headers: { Authorization: `Bearer ${renterToken}` },
  });
  assert.equal(myPaymentsRes.status, 200);
  assert.ok(myPaymentsRes.data.data.length >= 1);
  const myReceipt = myPaymentsRes.data.data[0];
  assert.equal(myReceipt.payment_id, paymentReceipt.payment_id);
  assert.equal(myReceipt.amount, expectedTotal);
  assert.ok(myReceipt.item_name);
  assert.ok(myReceipt.provider_name);
  console.log(`✅ Renter receipt verified in history: "${myReceipt.item_name}" - Rs. ${myReceipt.amount}\n`);

  // Step 14: Provider checks Earnings Dashboard
  console.log('Step 14: Provider checks Earnings Dashboard (/api/payments/earnings)');
  const earningsRes = await request('/payments/earnings', {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert.equal(earningsRes.status, 200);
  const earningsData = earningsRes.data.data;
  assert.ok(earningsData.total_earnings >= expectedTotal);
  assert.ok(earningsData.completed_rentals_count >= 1);
  assert.ok(earningsData.avg_booking_value > 0);
  assert.ok(earningsData.payments.some((p) => p.payment_id === paymentReceipt.payment_id));
  console.log(`✅ Provider earnings updated: Total: Rs. ${earningsData.total_earnings}, Completed Rentals: ${earningsData.completed_rentals_count}, Avg: Rs. ${earningsData.avg_booking_value}\n`);

  // Step 15: Rental request reflects payment status in requests list
  console.log('Step 15: Verify request reflects payment status in requests list');
  const updatedReqs = await request('/rental-requests/mine', {
    headers: { Authorization: `Bearer ${renterToken}` },
  });
  assert.equal(updatedReqs.status, 200);
  const paidReq = updatedReqs.data.data.find((r) => r.id === createdRequest.id);
  assert.equal(paidReq.payment_status, 'completed');
  assert.equal(paidReq.payment_id, paymentReceipt.payment_id);
  console.log(`✅ Request #REQ-${createdRequest.id} is now marked as paid (payment_id: ${paidReq.payment_id})\n`);

  console.log('🎉 ALL 15 END-TO-END WORKFLOW TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
