# ERP-Lite: Offline Inventory & Invoicing System

A production-grade, fully offline ERP system built with **Python FastAPI**, **React 18 + TypeScript**, **SQLite**, and **ReportLab**. No cloud dependencies, no external APIs — complete local operation.

---

## 🚀 Quick Start

### Default Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Customer | (sign up via the registration page) | — |

### Backend
```bash
cd erp_lite_backend
pip install -r requirements.txt
python seed_data.py              # Optional: populate demo data
uvicorn app.main:app --reload    # http://127.0.0.1:8000
```

### Frontend
```bash
cd erp_lite_frontend
npm install
npm run dev                      # http://localhost:3001
```

Swagger API docs: `http://127.0.0.1:8000/docs`

---

## 🎯 Features

### Admin Portal
| Page | Description |
|------|-------------|
| **Dashboard** | KPIs (revenue, orders, inventory), daily sales chart, recent sales with PDF download |
| **Products** | Full CRUD, category filter, stock levels, cost & selling prices |
| **Categories** | Organize products into groups |
| **Inventory** | Stock quantities, reorder alerts, stock adjustments |
| **Stock Transactions** | Complete audit trail (IN/OUT/ADJUSTMENT) |
| **Sales Orders** | Create, confirm (auto-generates invoice & deducts stock), mark paid, cancel |
| **Purchases** | Supplier purchase orders, receive stock, cost tracking |
| **Customers** | Contact management, order history |
| **Suppliers** | Supplier directory with contact details |
| **Payments** | Record and track customer & supplier payments |
| **Reports** | Sales analytics, inventory valuation, revenue breakdown, supplier performance |
| **CSV Import/Export** | Bulk data operations for products, customers, sales, inventory |

### Customer Portal
| Page | Description |
|------|-------------|
| **Dashboard** | Order summary cards, total spent, recent orders |
| **Browse Products** | Product catalog with search, add-to-cart |
| **Shopping Cart** | Quantity controls, order summary, place order |
| **My Orders** | Order history with status tracking, Pay button for confirmed orders |
| **Invoices** | View invoices and download PDFs |
| **Profile** | Account settings |

### Order Lifecycle
```
Customer places order → DRAFT
      ↓
Admin confirms → CONFIRMED  (stock deducted, invoice number generated)
      ↓
Customer pays → PAID
```
Admin can also cancel orders at any stage (stock restored if already confirmed).

### Technical Features
- **JWT Authentication** with role-based access (ADMIN, CUSTOMER)
- **Clean Architecture** — repositories → services → API routers → schemas
- **SQLAlchemy ORM** with type-safe models
- **Redux Toolkit** state management with localStorage cart persistence
- **APScheduler** background jobs (invoice reminders)
- **ReportLab** automatic PDF invoice generation
- **Recharts** dashboard visualizations
- **MUI 5** component library with custom navy/blue theme
- **Real-time notifications** — bell icon with popover (low stock, pending orders, order status)
- **Pytest** test suite (11 test files)
- **CORS** configured for frontend–backend communication
- **SQLite** portable, zero-configuration database

---

## 📁 Project Structure

### Backend
```
erp_lite_backend/
├── app/
│   ├── api/               # REST API routers (auth, products, sales, purchases, etc.)
│   ├── core/              # Configuration, security (JWT), database engine
│   ├── models/            # SQLAlchemy models (User, Product, SalesOrder, etc.)
│   ├── schemas/           # Pydantic request/response DTOs
│   ├── services/          # Business logic (sales, invoice, inventory, reports)
│   ├── repositories/      # Data access layer
│   ├── utils/             # PDF generation (ReportLab), CSV handler
│   ├── scheduler/         # APScheduler background jobs
│   └── main.py            # FastAPI application entry point
├── tests/                 # Pytest test suite
├── data/                  # SQLite database, generated invoices, CSV exports
├── seed_data.py           # Demo data script
└── requirements.txt
```

### Frontend
```
erp_lite_frontend/
├── src/
│   ├── api/               # Axios API client with JWT interceptor
│   ├── layouts/           # AdminLayout, CustomerLayout (sidebar, topbar, notifications)
│   ├── pages/
│   │   ├── admin/         # 12 admin pages (Dashboard, Products, Sales, etc.)
│   │   └── customer/      # 6 customer pages (Dashboard, Cart, Orders, etc.)
│   ├── store/             # Redux slices (auth, products, orders, cart)
│   ├── App.tsx            # Route definitions
│   └── main.tsx           # React entry point
├── package.json
└── vite.config.ts
```

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Authenticate, returns JWT |
| POST | `/register` | Create new account (customer self-signup) |
| GET | `/me` | Current user info |

### Products (`/api/v1/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all products |
| POST | `/` | Create product |
| GET | `/low-stock` | Products below reorder level |
| GET | `/{id}` | Get product details |
| PUT | `/{id}` | Update product |
| DELETE | `/{id}` | Soft-delete product |
| POST | `/{id}/adjust-stock` | Manual stock adjustment |
| GET | `/{id}/stock-history` | Stock transaction history |

### Categories (`/api/v1/categories`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / Create |
| GET/PUT/DELETE | `/{id}` | Read / Update / Delete |

### Customers (`/api/v1/customers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / Create |
| GET | `/search` | Search by name/email |
| GET/PUT/DELETE | `/{id}` | Read / Update / Delete |

### Suppliers (`/api/v1/suppliers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / Create |
| GET | `/search` | Search by name/email |
| GET/PUT/DELETE | `/{id}` | Read / Update / Delete |

### Sales Orders (`/api/v1/sales`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create sales order (admin) |
| GET | `/` | List all sales orders |
| POST | `/customer-order` | Customer places order (auto-creates customer record) |
| POST | `/{id}/confirm` | Admin confirms order (deducts stock, generates invoice) |
| POST | `/{id}/pay` | Customer marks order as paid |
| PUT | `/{id}/costs` | Update tax/discount |
| GET | `/{id}/invoice` | Download invoice PDF |
| GET | `/customer/{customer_id}` | Orders by customer |
| DELETE | `/{id}` | Cancel order (restores stock if confirmed) |

### Purchases (`/api/v1/purchases`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create purchase order |
| GET | `/` | List all purchases |
| POST | `/{id}/receive` | Receive stock from supplier |
| PUT | `/{id}/costs` | Update purchase costs |
| GET | `/supplier/{supplier_id}` | Purchases by supplier |
| DELETE | `/{id}` | Delete purchase |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/` | List / Record payment |
| GET | `/{id}` | Payment details |

### Reports (`/api/v1/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | KPIs, daily sales, recent activity |
| GET | `/sales` | Sales analytics |
| GET | `/inventory` | Stock valuation & status |
| GET | `/suppliers` | Supplier performance |
| GET | `/revenue` | Revenue breakdown |
| GET | `/stock-transactions` | Audit trail |

### Stock Transactions (`/api/v1/stock_transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Full transaction history |

---

## 🗃️ Database Schema

| Table | Key Fields |
|-------|------------|
| **Users** | id, username, email, hashed_password, role (ADMIN/CUSTOMER), is_active |
| **Products** | id, sku, name, category_id, cost_price, selling_price, stock_quantity, reorder_level |
| **Categories** | id, name, description |
| **Customers** | id, name, email, phone, address |
| **Suppliers** | id, name, email, phone, address |
| **Sales Orders** | id, customer_id, invoice_number, status (DRAFT/CONFIRMED/PAID/CANCELLED), totals |
| **Sales Order Items** | id, order_id, product_id, quantity, unit_price, subtotal |
| **Purchases** | id, supplier_id, status (DRAFT/RECEIVED/CANCELLED), total_cost |
| **Purchase Items** | id, purchase_id, product_id, quantity, unit_cost |
| **Stock Transactions** | id, product_id, type (IN/OUT/ADJUSTMENT), quantity, reference_type, reference_id |
| **Payments** | id, sales_order_id, payment_type, amount, reference_note |

---

## 🧪 Testing

```bash
cd erp_lite_backend
pytest tests/                    # Run all tests
pytest --cov=app tests/          # With coverage report
```

**Test suites:** API endpoints, authentication, security, products, customers, suppliers, inventory, invoices, payments (11 files).

---

## 📄 Invoice Generation

- Invoice numbers follow `INV-YYYY-XXXX` format (e.g., `INV-2026-1013`)
- Auto-generated when admin confirms a sales order
- PDF includes: company header, customer details, itemized list, tax, discount, totals
- Saved locally in `data/invoices/`
- Downloadable via admin dashboard and customer invoices page

---

## ⏰ Background Jobs

| Job | Description |
|-----|-------------|
| **Invoice Reminders** | Logs reminders for unpaid orders older than 7 days |

---

## 🔧 Configuration

Edit `.env` in the backend folder:
- `DATABASE_URL` — SQLite path
- `SECRET_KEY` — JWT signing key
- `APP_NAME` / `APP_VERSION`
- CORS origins are configured in `main.py`

---

## 🚨 Business Rules

- Stock is deducted only when a sales order is **CONFIRMED**
- Stock is restored if a confirmed order is **CANCELLED**
- Invoice numbers are sequential and unique per year
- Purchases add stock only when marked **RECEIVED**
- Monetary values use `Decimal` precision (never float)
- Every stock change creates an auditable transaction record
- Customers are auto-created from user email on first order

---

## 📦 Offline Deployment

The entire system runs with zero internet dependency:
1. No cloud services or external APIs
2. Portable SQLite database
3. Build frontend for production: `npm run build` → static files in `dist/`

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic |
| Frontend | React 18, TypeScript, Vite, MUI 5, Redux Toolkit, Recharts |
| Database | SQLite |
| Auth | JWT (python-jose + passlib) |
| PDF | ReportLab |
| Scheduler | APScheduler |
| Testing | Pytest |

---

**Built for offline inventory management** 📦
