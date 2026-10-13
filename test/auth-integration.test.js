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
  console.log('🧪 Starting Authentication API integration tests...\n');

  // Test 1: Health check
  console.log('Test 1: Health check');
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.success, true);
  console.log('✅ Health check passed\n');

  // Test 2: Register renter
  const renterEmail = `renter_${Date.now()}@test.com`;
  console.log(`Test 2: Register renter (${renterEmail})`);
  const regRenter = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Nimal Silva',
      email: renterEmail,
      password: 'password123',
      phone: '0771234567',
      role: 'renter',
    },
  });
  assert.equal(regRenter.status, 201);
  assert.equal(regRenter.data.success, true);
  assert.equal(regRenter.data.data.user.email, renterEmail);
  assert.equal(regRenter.data.data.user.role, 'renter');
  assert.ok(regRenter.data.data.token, 'Token should be returned');
  console.log('✅ Renter registration passed\n');

  // Test 3: Register provider
  const providerEmail = `provider_${Date.now()}@test.com`;
  console.log(`Test 3: Register provider (${providerEmail})`);
  const regProvider = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Kamal Perera',
      email: providerEmail,
      password: 'password123',
      phone: '0719876543',
      role: 'provider',
      provider_type: 'business',
      business_name: 'Colombo Heavy Rentals',
    },
  });
  assert.equal(regProvider.status, 201);
  assert.equal(regProvider.data.data.user.business_name, 'Colombo Heavy Rentals');
  const providerToken = regProvider.data.data.token;
  console.log('✅ Provider registration passed\n');

  // Test 4: Duplicate registration should return 409
  console.log('Test 4: Duplicate registration rejection');
  const regDup = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Kamal Perera',
      email: providerEmail,
      password: 'password123',
    },
  });
  assert.equal(regDup.status, 409);
  assert.equal(regDup.data.success, false);
  console.log('✅ Duplicate registration rejected properly\n');

  // Test 5: Login with valid credentials
  console.log('Test 5: Login with valid credentials');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: providerEmail,
      password: 'password123',
    },
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.data.success, true);
  assert.ok(loginRes.data.data.token);
  console.log('✅ Valid login passed\n');

  // Test 6: Login with invalid credentials
  console.log('Test 6: Login with invalid password');
  const loginBad = await request('/auth/login', {
    method: 'POST',
    body: {
      email: providerEmail,
      password: 'wrong_password',
    },
  });
  assert.equal(loginBad.status, 401);
  assert.equal(loginBad.data.success, false);
  console.log('✅ Invalid password rejected properly\n');

  // Test 7: Get profile (/users/me)
  console.log('Test 7: Get profile (/api/users/me)');
  const meRes = await request('/users/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data.data.email, providerEmail);
  assert.equal(meRes.data.data.business_name, 'Colombo Heavy Rentals');
  console.log('✅ Get profile passed\n');

  // Test 8: Update profile (/users/me)
  console.log('Test 8: Update profile');
  const updateRes = await request('/users/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      name: 'Kamal Perera Updated',
      phone: '0711112222',
      business_name: 'Colombo Heavy Rentals & Logistics',
    },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.data.name, 'Kamal Perera Updated');
  assert.equal(updateRes.data.data.business_name, 'Colombo Heavy Rentals & Logistics');
  console.log('✅ Update profile passed\n');

  // Test 9: Change password
  console.log('Test 9: Change password');
  const changeRes = await request('/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      currentPassword: 'password123',
      newPassword: 'newpassword456',
    },
  });
  assert.equal(changeRes.status, 200);
  assert.equal(changeRes.data.success, true);
  console.log('✅ Change password passed\n');

  // Verify login with new password
  const loginNewPw = await request('/auth/login', {
    method: 'POST',
    body: {
      email: providerEmail,
      password: 'newpassword456',
    },
  });
  assert.equal(loginNewPw.status, 200);
  console.log('✅ Verified login with changed password\n');

  // Test 10: Forgot password
  console.log('Test 10: Forgot password request');
  const forgotRes = await request('/auth/forgot-password', {
    method: 'POST',
    body: {
      email: renterEmail,
    },
  });
  assert.equal(forgotRes.status, 200);
  assert.equal(forgotRes.data.success, true);
  const resetToken = forgotRes.data.data.devToken;
  assert.ok(resetToken, 'Dev reset token should be returned in development mode');
  console.log('✅ Forgot password token generated\n');

  // Test 11: Reset password using token
  console.log('Test 11: Reset password using token');
  const resetRes = await request('/auth/reset-password', {
    method: 'POST',
    body: {
      token: resetToken,
      newPassword: 'brandNewPassword789',
    },
  });
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.success, true);
  console.log('✅ Reset password passed\n');

  // Test 12: Verify login with reset password
  console.log('Test 12: Login with reset password');
  const loginResetPw = await request('/auth/login', {
    method: 'POST',
    body: {
      email: renterEmail,
      password: 'brandNewPassword789',
    },
  });
  assert.equal(loginResetPw.status, 200);
  assert.equal(loginResetPw.data.success, true);
  console.log('✅ Login with reset password succeeded!\n');

  // Test 13: Reuse of same reset token should fail
  console.log('Test 13: Reset token reuse rejection');
  const resetReuse = await request('/auth/reset-password', {
    method: 'POST',
    body: {
      token: resetToken,
      newPassword: 'anotherPassword999',
    },
  });
  assert.equal(resetReuse.status, 400);
  assert.equal(resetReuse.data.success, false);
  console.log('✅ Used token rejection passed\n');

  console.log('🎉 ALL 13 AUTHENTICATION TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
