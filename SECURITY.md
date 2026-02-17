# Security Best Practices Checklist

## ✅ Implemented

### Authentication & Authorization
- [x] JWT token verification
- [x] User existence check after token decode
- [x] Role-based access control
- [x] Store-based authorization for vendors/drivers
- [x] Password hashing with bcrypt
- [x] Firebase Admin SDK for token verification

### Input Validation
- [x] Phone number validation (Indian format)
- [x] Email validation
- [x] MongoDB ObjectId validation
- [x] Quantity limits (1-99)
- [x] Coordinate validation
- [x] Order status validation
- [x] Required field validation

### Data Integrity
- [x] Server-side price recalculation
- [x] Product-store relationship validation
- [x] Store availability check
- [x] Variant availability check
- [x] Driver-store relationship validation

### Error Handling
- [x] Consistent error responses
- [x] Proper HTTP status codes
- [x] No sensitive data in error messages
- [x] Async error handling with express-async-handler

---

## 🔄 To Implement

### High Priority

#### 1. Rate Limiting
```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

#### 2. Helmet for Security Headers
```javascript
// Already installed, just add to server.js
const helmet = require('helmet');
app.use(helmet());
```

#### 3. CORS Restriction (Production)
```javascript
// In server.js, update CORS config
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : '*',
    credentials: true
};
app.use(cors(corsOptions));
```

#### 4. Environment Variable Validation
```javascript
// Add to server.js
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FIREBASE_SERVICE_ACCOUNT_KEY'
];

requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        process.exit(1);
    }
});
```

---

### Medium Priority

#### 5. Request Sanitization
```javascript
// Install: npm install express-mongo-sanitize xss-clean
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
```

#### 6. HTTP Parameter Pollution Protection
```javascript
// Install: npm install hpp
const hpp = require('hpp');
app.use(hpp());
```

#### 7. Logging with Winston
```javascript
// Install: npm install winston
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

#### 8. Database Connection Security
```javascript
// Add to config/db.js
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);
```

---

### Low Priority

#### 9. API Documentation with Swagger
```javascript
// Install: npm install swagger-ui-express swagger-jsdoc
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Mubarak API',
            version: '1.0.0',
        },
    },
    apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

#### 10. Content Security Policy
```javascript
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
    }
}));
```

---

## 🔐 Frontend Security

### Implemented
- [x] Token storage in localStorage
- [x] Automatic token attachment to requests
- [x] 401 error handling (auto logout)

### To Implement

#### 1. XSS Protection in React
```javascript
// Install: npm install dompurify
import DOMPurify from 'dompurify';

// Sanitize user input before rendering
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

#### 2. HTTPS Only (Production)
```javascript
// In vite.config.js for production
export default defineConfig({
    server: {
        https: true // Force HTTPS in production
    }
});
```

#### 3. Secure Cookie Storage (Alternative to localStorage)
```javascript
// Backend: Set httpOnly cookie
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
});

// Frontend: Axios will automatically send cookies
```

---

## 📊 Security Audit Checklist

### Before Production Deployment

- [ ] All environment variables are set and validated
- [ ] No sensitive data in error messages
- [ ] No console.logs in production code
- [ ] Rate limiting is enabled
- [ ] CORS is restricted to production domain
- [ ] HTTPS is enforced
- [ ] Security headers are set (Helmet)
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection (if using cookies)
- [ ] File upload validation (if applicable)
- [ ] Database indexes for performance
- [ ] Error tracking (Sentry) is configured
- [ ] Logging is configured
- [ ] Backup strategy is in place

---

## 🚨 Common Vulnerabilities to Avoid

### 1. **NoSQL Injection**
**Bad**:
```javascript
User.findOne({ email: req.body.email }); // ❌ Vulnerable
```

**Good**:
```javascript
// Use express-mongo-sanitize
app.use(mongoSanitize());
```

### 2. **Mass Assignment**
**Bad**:
```javascript
const user = await User.create(req.body); // ❌ User can set any field
```

**Good**:
```javascript
const { name, email, phone } = req.body;
const user = await User.create({ name, email, phone }); // ✅ Explicit fields
```

### 3. **Insecure Direct Object Reference (IDOR)**
**Bad**:
```javascript
const order = await Order.findById(req.params.id); // ❌ No ownership check
```

**Good**:
```javascript
const order = await Order.findOne({
    _id: req.params.id,
    customerId: req.user._id // ✅ Verify ownership
});
```

### 4. **Timing Attacks**
**Bad**:
```javascript
if (password === storedPassword) // ❌ Timing attack vulnerable
```

**Good**:
```javascript
const isMatch = await bcrypt.compare(password, storedPassword); // ✅ Constant time
```

---

## 📝 Security Testing

### Manual Testing
1. Try accessing protected routes without token
2. Try accessing other users' orders
3. Try invalid input (SQL injection, XSS)
4. Try excessive requests (rate limiting)
5. Try accessing vendor routes as customer

### Automated Testing
```bash
# Install OWASP ZAP or similar
npm install -g owasp-zap

# Run security scan
zap-cli quick-scan http://localhost:5000
```

---

## 🎯 Security Score

**Current**: 7/10 ⭐⭐⭐⭐⭐⭐⭐

**After Implementing High Priority**: 9/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐

**Production Ready**: 10/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
