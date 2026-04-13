# 🧪 Backend Testing Plan - Booking & Payment System

## Test Framework Setup

```bash
# Install dependencies
npm install --save-dev jest supertest mongodb-memory-server
```

### Jest Config (`jest.config.js`)
```js
export default {
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
```

### Test Database
- **Development**: Sử dụng `mongodb-memory-server` cho test isolation
- **Production**: Test trên staging database riêng

---

## Unit Tests

### 1. Booking Model Tests
**File**: `backend/tests/unit/booking.model.test.js`

```js
describe('Booking Model', () => {
  test('Should auto-generate bookingCode on save', async () => {
    // Verify: BK001, BK002...
  });

  test('Should validate required fields', async () => {
    // Test: date, customerName, customerPhone, courtId, userId, slots[]
  });

  test('Should validate phone format', async () => {
    // Test: VN format (0 + 9 digits)
  });

  test('Should have correct status enum', async () => {
    // pending, confirmed, completed, cancelled
  });

  test('Should have correct paymentStatus enum', async () => {
    // unpaid, paid
  });

  test('Should calculate finalPrice correctly', async () => {
    // finalPrice = totalPrice - discountAmount
  });
});
```

### 2. Payment Model Tests
**File**: `backend/tests/unit/payment.model.test.js`

```js
describe('Payment Model', () => {
  test('Should validate paymentMethod enum', async () => {
    // cash, momo, vnpay
  });

  test('Should track paidAt date', async () => {
    // Verify timestamps
  });

  test('Should require createdBy (admin reference)', async () => {
    // Verify admin assignment
  });
});
```

### 3. Booking Controller Unit Tests
**File**: `backend/tests/unit/booking.controller.test.js`

```js
describe('Booking Controller', () => {
  describe('POST /api/bookings - createBooking', () => {
    test('Should reject without required fields', () => {
      // Missing: courtId, date, slots, customerName, customerPhone
    });

    test('Should validate Vietnamese phone format', () => {
      // Accept: 0901234567
      // Reject: 1234567890, 090123456
    });

    test('Should reject invalid court ID', () => {
      // HTTP 404
    });

    test('Should detect slot conflict with existing booking', () => {
      // Create booking 09:00-10:00
      // Try booking 09:30-10:30 → Should fail
      // HTTP 409 Conflict
    });

    test('Should allow multiple non-conflicting slots per booking', () => {
      // Booking with slots: [09:00-10:00, 14:00-15:00]
      // Should create successfully
    });

    test('Should accept discount code', () => {
      // totalPrice: 200, discount: 50, finalPrice: 150
    });

    test('Should create Payment record on booking creation', () => {
      // Payment should NOT auto-create yet (Phase 1: Manual by Admin)
    });
  });

  describe('GET /api/bookings/my - getMyBookings', () => {
    test('Should return only user\'s bookings', () => {
      // User 1 sees only their bookings
      // User 2 doesn't see User 1's bookings
    });

    test('Should populate court and user data', () => {
      // Response includes court details
    });

    test('Should sort by newest first', () => {
      // createdAt DESC
    });

    test('Should require authentication', () => {
      // HTTP 401 without token
    });
  });

  describe('GET /api/bookings/:id - getBookingById', () => {
    test('Should verify user ownership', () => {
      // User 1 can see their own booking
      // User 2 gets HTTP 403
      // Admin can see any booking
    });

    test('Should return full booking details', () => {
      // Includes all fields + populated court/user
    });

    test('Should return 404 if booking not found', () => {
      // Invalid ID
    });
  });
});
```

### 4. Payment Controller Unit Tests
**File**: `backend/tests/unit/payment.controller.test.js`

```js
describe('Payment Controller', () => {
  describe('POST /api/admin/payments - createPayment', () => {
    test('Should validate required fields', () => {
      // bookingId, amount, paymentMethod
    });

    test('Should reject duplicate payment for same booking', () => {
      // 2nd payment on same booking → HTTP 409
    });

    test('Should set paidAt timestamp', () => {
      // Verify default Date.now()
    });

    test('Should require admin role', () => {
      // User role → HTTP 403
    });
  });

  describe('GET /api/admin/payments/booking/:bookingId', () => {
    test('Should return payment records for specific booking', () => {
      // Verify foreignKey relationship
    });
  });
});
```

### 5. Admin Controller Unit Tests
**File**: `backend/tests/unit/admin.controller.test.js`

```js
describe('Admin Booking Management', () => {
  describe('GET /api/admin/bookings - getAllBookings', () => {
    test('Should return all bookings with pagination', () => {
      // ?page=1&limit=10
    });

    test('Should filter by status', () => {
      // ?status=pending
    });

    test('Should filter by date', () => {
      // ?date=2026-04-10
    });

    test('Should filter by courtId', () => {
      // ?courtId=...
    });

    test('Should require admin role', () => {
      // User → HTTP 403
    });

    test('Should populate user and court data', () => {
      // Include user name, phone, court name
    });
  });

  describe('PATCH /api/admin/bookings/:id/status - updateBookingStatus', () => {
    test('Should validate status value', () => {
      // Enum: pending, confirmed, completed, cancelled
    });

    test('Should prevent status change from completed/cancelled', () => {
      // HTTP 409
    });

    test('Should allow: pending → confirmed', () => {
      // Valid transition
    });

    test('Should allow: confirmed → completed', () => {
      // Valid transition
    });

    test('Should allow: pending → cancelled', () => {
      // Valid transition
    });

    test('Should allow: confirmed → cancelled', () => {
      // Valid transition
    });
  });

  describe('PATCH /api/admin/bookings/:id/payment - updatePaymentStatus', () => {
    test('Should update payment status to paid', () => {
      // unpaid → paid
    });
  });

  describe('GET /api/admin/dashboard - getDashboardStats', () => {
    test('Should count total bookings', () => {
      // All bookings regardless of status
    });

    test('Should group bookings by status', () => {
      // pending, confirmed, completed, cancelled counts
    });

    test('Should calculate total revenue', () => {
      // Sum of all paid bookings
    });
  });
});
```

---

## Integration Tests

### 1. Booking Workflow Integration
**File**: `backend/tests/integration/booking.workflow.test.js`

```js
describe('Booking Workflow (E2E)', () => {
  let userId, courtId, bookingId;

  beforeEach(async () => {
    // Setup: Create test user and court
  });

  test('USER: Should create booking → PENDING status', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        courtId,
        date: '2026-04-10',
        slots: [
          { startTime: '09:00', endTime: '10:00', price: 100 },
          { startTime: '14:00', endTime: '15:00', price: 100 }
        ],
        customerName: 'Nguyen Van A',
        customerPhone: '0901234567',
        totalPrice: 200,
        finalPrice: 200,
        preferredPaymentMethod: 'cash',
        notes: 'Request morning + afternoon'
      });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe('pending');
    expect(res.body.booking.bookingCode).toMatch(/^BK\d{3}$/);
    bookingId = res.body.booking._id;
  });

  test('USER: Should not see cancelled/completed bookings as available slots', async () => {
    // Create booking 1 (pending)
    // Admin confirms → confirmed
    // Try to create booking 2 same slot → Should fail
    // Admin completes booking 1
    // Try to create booking 2 same slot → Should succeed now
  });

  test('ADMIN: Should fetch all pending bookings', async () => {
    const res = await request(app)
      .get('/api/admin/bookings?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings).toContainEqual(
      expect.objectContaining({ _id: bookingId })
    );
  });

  test('ADMIN: Should mark payment as received', async () => {
    const res = await request(app)
      .post('/api/admin/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingId,
        amount: 200,
        paymentMethod: 'cash',
        notes: 'Customer paid at desk'
      });

    expect(res.status).toBe(201);
    expect(res.body.payment.status).toBe('paid');
    expect(res.body.payment.paidAt).toBeDefined();
  });

  test('ADMIN: Should confirm booking', async () => {
    const res = await request(app)
      .patch(`/api/admin/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('confirmed');
  });

  test('ADMIN: Should mark booking as completed', async () => {
    const res = await request(app)
      .patch(`/api/admin/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('completed');
  });

  test('USER: Should see booking in history', async () => {
    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toContainEqual(
      expect.objectContaining({ _id: bookingId })
    );
  });
});
```

### 2. Conflict & Validation Integration
**File**: `backend/tests/integration/booking.conflicts.test.js`

```js
describe('Booking Conflicts & Validation', () => {
  test('Should reject overlapping slots', async () => {
    // Booking 1: 09:00-11:00 (confirmed)
    // Booking 2: 10:00-12:00 (same court, same day) → Should fail
  });

  test('Should allow adjacent slots', async () => {
    // Booking 1: 09:00-10:00 (confirmed)
    // Booking 2: 10:00-11:00 (same court, same day) → Should succeed
  });

  test('Should allow cancelled bookings to be rebooked', async () => {
    // Booking 1: 09:00-10:00 (cancelled)
    // Booking 2: 09:00-10:00 (pending) → Should succeed
  });

  test('Should validate discount code applied', async () => {
    // Test: totalPrice 200, discount 50 → finalPrice 150
  });

  test('Should reject invalid phone numbers', async () => {
    // Test various formats: 123456789, 090123456, 1-234-567-89
  });
});
```

    // test('Should calculate finalPrice correctly', async () => {
    //   // Note: Remove tests corresponding to refunded / payment.refund.test.js
    // });
  });
});
```

### 3. Admin Dashboard Integration
**File**: `backend/tests/integration/admin.dashboard.test.js`

```js
describe('Admin Dashboard', () => {
  test('Should return statistics summary', async () => {
    // totalBookings, totalPaid, totalCourts, totalUsers
  });

  test('Should group bookings by status', async () => {
    // pending: X, confirmed: Y, completed: Z, cancelled: W
  });

  test('Should require admin role', async () => {
    // User → HTTP 403
  });
});
```

---

## API Testing with Postman/Thunder Client

### Postman Collection
**File**: `backend/tests/postman/Booking_Payment_API.postman_collection.json`

#### Test Scenarios

**1. User Books a Court**
```
POST /api/bookings
Body:
{
  "courtId": "{{courtId}}",
  "date": "2026-04-10",
  "slots": [
    { "startTime": "09:00", "endTime": "10:00", "price": 100 }
  ],
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "totalPrice": 100,
  "finalPrice": 100,
  "preferredPaymentMethod": "cash",
  "notes": ""
}

Expected: 201, bookingCode: BK001
```

**2. Admin Views Pending Bookings**
```
GET /api/admin/bookings?status=pending

Expected: 200, array of pending bookings
```

**3. Admin Marks Payment as Received**
```
POST /api/admin/payments
Body:
{
  "bookingId": "{{bookingId}}",
  "amount": 100,
  "paymentMethod": "cash",
  "notes": "Paid by customer"
}

Expected: 201, Payment record created
```

**4. Admin Confirms Booking**
```
PATCH /api/admin/bookings/{{bookingId}}/status
Body:
{
  "status": "confirmed"
}

Expected: 200, status updated
```

---

## Performance Testing

### Load Testing (Optional - Phase 2)
- Tool: Apache JMeter or k6
- Scenario: 100 concurrent users creating bookings
- Target: Response time < 500ms, Success rate > 99%

### Database Indexing
```js
// Booking.model.js
bookingSchema.index({ date: 1, courtId: 1, status: 1 }); // For conflict check
bookingSchema.index({ userId: 1, createdAt: -1 }); // For user's bookings

// Payment.model.js
paymentSchema.index({ bookingId: 1 }); // Already unique
paymentSchema.index({ status: 1, createdAt: -1 }); // For admin list
```

---

## Test Coverage Goals

| Component | Target Coverage | Current |
|-----------|-----------------|---------|
| Booking Controller | 90% | ⏳ |
| Payment Controller | 90% | ⏳ |
| Admin Controller | 85% | ⏳ |
| Booking Model | 95% | ⏳ |
| Payment Model | 95% | ⏳ |

---

## Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific suite
npm test booking.controller.test.js

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm test tests/integration
```

---

## Common Test Data

```js
// Test User
const testUser = {
  _id: new ObjectId(),
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '0901234567',
  role: 'user'
};

// Test Admin
const testAdmin = {
  _id: new ObjectId(),
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'admin'
};

// Test Court
const testCourt = {
  _id: new ObjectId(),
  name: 'Sân bóng rổ số 1',
  address: '123 Street',
  pricePerHour: 100
};

// Test Booking
const testBooking = {
  _id: new ObjectId(),
  courtId: testCourt._id,
  userId: testUser._id,
  date: '2026-04-10',
  customerName: 'Test User',
  customerPhone: '0901234567',
  slots: [{ startTime: '09:00', endTime: '10:00', price: 100 }],
  totalPrice: 100,
  finalPrice: 100,
  status: 'pending'
};
```

---

## Next Steps

1. **Phase 1 (Current)**:
   - ✅ Unit tests for all controllers & models
   - ✅ Integration tests for booking workflow
   - ✅ API tests via Postman

2. **Phase 2 (Future)**:
   - [ ] VNPay/MoMo payment callback tests
   - [ ] Load testing
   - [ ] E2E tests with Cypress
   - [ ] CI/CD integration (GitHub Actions)
