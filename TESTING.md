# Testing Guide

## 🧪 Running Tests

### Install Dependencies (Already Done)
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

---

## 📋 Test Coverage

### Current Test Suite (`tests/api.test.js`)

#### Authentication Tests
- ✅ Send OTP for valid phone number
- ✅ Reject invalid phone number
- ✅ Reject invalid OTP

#### Store Tests
- ✅ Find nearby store with valid coordinates
- ✅ Return 404 when no store nearby
- ✅ Find store by pincode

#### Order Tests
- ✅ Create order with valid data
- ✅ Reject order without storeId
- ✅ Reject order with invalid quantity
- ✅ Reject order without authentication
- ✅ Return customer order history

#### Authorization Tests
- ✅ Reject customer accessing vendor routes
- ✅ Allow vendor accessing vendor routes

---

## 🎯 Test Environment Setup

### 1. Create Test Environment File
Create `.env.test` in backend directory:

```env
NODE_ENV=test
MONGO_URI_TEST=mongodb://localhost:27017/mubarak_test
JWT_ACCESS_SECRET=test_secret_key
JWT_REFRESH_SECRET=test_refresh_secret
```

### 2. Update Test Configuration
The `package.json` already includes Jest configuration:

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

---

## ✅ Manual Testing Checklist

### Authentication
- [ ] Register new customer via email
- [ ] Login with Google Sign-In
- [ ] Send OTP to phone number
- [ ] Verify OTP and get token
- [ ] Access protected route with token
- [ ] Try accessing with invalid token

### Location & Stores
- [ ] Enter valid location (Rajahmundry)
- [ ] Enter location outside service area
- [ ] Verify nearest store is assigned
- [ ] Check "Service Unavailable" message

### Products & Cart
- [ ] Browse products
- [ ] Select different variants
- [ ] Add to cart (quantity 1-99)
- [ ] Try adding quantity > 99 (should fail)
- [ ] Remove from cart
- [ ] Cart persists on refresh

### Orders (Customer)
- [ ] Place order with valid data
- [ ] Try placing order without address (should fail)
- [ ] Try placing order with closed store (should fail)
- [ ] View order history
- [ ] View single order details
- [ ] Try viewing another user's order (should fail)

### Orders (Vendor)
- [ ] Login as vendor
- [ ] View store orders
- [ ] Accept order
- [ ] Reject order
- [ ] Assign delivery boy
- [ ] Try assigning driver from different store (should fail)

### Orders (Delivery)
- [ ] Login as delivery boy
- [ ] View assigned orders only
- [ ] Update order status (cutting → ready → out → delivered)
- [ ] Try accessing orders from different store (should fail)

---

## 🐛 Debugging Failed Tests

### MongoDB Connection Issues
```bash
# Ensure MongoDB is running
mongod --version

# Check if test database exists
mongo mubarak_test --eval "db.stats()"
```

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000
```

### JWT Secret Not Found
```bash
# Ensure .env file exists
cat .env | grep JWT_ACCESS_SECRET
```

---

## 📊 Expected Test Output

```
PASS  tests/api.test.js
  Authentication Tests
    POST /api/auth/send-otp
      ✓ should send OTP for valid phone number (123ms)
      ✓ should reject invalid phone number (45ms)
    POST /api/auth/verify-otp
      ✓ should reject invalid OTP (67ms)
  Store Tests
    GET /api/stores/nearby
      ✓ should find nearby store with valid coordinates (89ms)
      ✓ should return 404 when no store nearby (56ms)
      ✓ should find store by pincode (78ms)
  Order Tests
    POST /api/orders
      ✓ should create order with valid data (234ms)
      ✓ should reject order without storeId (45ms)
      ✓ should reject order with invalid quantity (52ms)
      ✓ should reject order without authentication (34ms)
    GET /api/orders/history
      ✓ should return customer order history (98ms)
  Authorization Tests
    ✓ should reject customer accessing vendor routes (67ms)
    ✓ should allow vendor accessing vendor routes (89ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        3.456 s
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example
Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          MONGO_URI_TEST: mongodb://localhost:27017/mubarak_test
          JWT_ACCESS_SECRET: test_secret
          JWT_REFRESH_SECRET: test_refresh_secret
```

---

## 📝 Writing New Tests

### Example: Test New Endpoint

```javascript
describe('New Feature Tests', () => {
    let token;
    
    beforeEach(async () => {
        // Setup: Create test user and get token
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            role: 'customer'
        });
        token = generateToken(user._id, 'customer');
    });
    
    it('should do something', async () => {
        const res = await request(app)
            .get('/api/new-endpoint')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
```

---

## ✅ Test Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterEach` to clean up test data
3. **Descriptive Names**: Test names should describe what they test
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Mock External Services**: Don't rely on external APIs in tests
6. **Fast Tests**: Keep tests fast by using test database

---

## 🎯 Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Current coverage: ~60% (15 tests)
Target: 80%+ (30+ tests)
