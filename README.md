# ✦ Loom & Jade | ShopKart MERN

### Thoughtfully Curated. Elegantly Experienced.

A full-stack e-commerce application that brings the elegance of a luxury boutique to a modern shopping experience. Built with the MERN stack, **Loom & Jade** combines an editorial-inspired storefront with customer authentication, product discovery, personalized wishlists, and a checkout experience integrated with Razorpay.

The design draws inspiration from archival fashion catalogues and private collections, pairing warm ivory surfaces, antique-gold detailing, deep burgundy accents, and elegant typography with practical e-commerce functionality.

---

## ✧ Application Preview

### The Homepage

An editorial-style storefront featuring curated product highlights, framed imagery, and an elegant shopping interface.

![Loom & Jade Homepage](screenshots/homepage.png)

### Product Catalogue

Explore products across categories with search, filtering, product details, and inventory information.

![Loom & Jade Product Catalogue](screenshots/products.png)

### The Private Collection — Wishlist

A personalized space where customers can save products and revisit their selections.

![Loom & Jade Wishlist](screenshots/wishlist.png)

> **Note:** Add your screenshots to a `screenshots/` folder in the repository using the filenames shown above, or update these paths to match your actual image files.

---

## ✧ Features

### 01. Authentication & Account Management

- Customer registration and login.
- Secure password hashing with bcrypt.
- JWT-based authentication using HTTP-only cookies.
- Authentication middleware for protected routes.
- Customer-specific data and account access.
- Logout functionality.

### 02. Product Discovery

- Browse the product catalogue.
- Search for products and filter by category.
- View individual product details.
- Display product prices, images, and available stock.
- Retrieve product information through backend API endpoints.

### 03. Personalized Wishlist

- Add products to a personal wishlist.
- Remove products from saved collections.
- Retrieve customer-specific wishlist items.
- Display saved product details, prices, categories, and availability.
- Maintain wishlist state through backend persistence.

### 04. Checkout & Payments

- Dedicated checkout experience.
- Razorpay payment gateway integration.
- Integration between the frontend checkout flow and backend payment endpoints.
- Payment processing through Razorpay's checkout interface.
- A consistent visual experience from product discovery through checkout.

*Payment verification and order confirmation depend on the backend implementation.*

### 05. Luxury-Inspired User Interface

- Editorial-style homepage and featured product presentation.
- Ivory, antique gold, and burgundy colour palette.
- Decorative gold frames and catalogue-inspired product cards.
- Typography designed to evoke a premium fashion-house aesthetic.
- Custom loading animation.
- Consistent navigation across the storefront, catalogue, wishlist, and account pages.

---

## ✧ Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based frontend |
| Vite | Frontend development and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| Node.js | JavaScript runtime for the backend |
| Express.js | REST API and server-side routing |
| MongoDB | Data persistence |
| Mongoose | Database schemas and models |
| JSON Web Tokens (JWT) | Authentication |
| bcrypt | Password hashing |
| Razorpay | Payment gateway integration |
| CORS | Cross-origin request configuration |
| cookie-parser | Cookie handling in Express |
| Nodemon | Backend development workflow |
| Git & GitHub | Version control and source hosting |

---

## ✧ Architecture

Loom & Jade follows a client-server architecture.

```text
                 CUSTOMER
                    |
                    v
          React + Vite Frontend
                    |
              HTTP / REST API
                    |
                    v
          Node.js + Express API
             /      |       \
            v       v        v
        MongoDB   JWT Auth  Razorpay
        Database  & Cookies Payments
```

- **Frontend:** Renders the storefront, manages user interactions, and communicates with backend endpoints.
- **Backend:** Handles API requests, authentication, product operations, and wishlist functionality.
- **Database:** Stores application data using MongoDB and Mongoose models.
- **Payments:** Integrates Razorpay into the checkout workflow.

---

## ✧ Project Structure

```text
COMMERCE/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── ...
│   └── package.json
│
├── .gitignore
└── README.md
```

*The folder layout is illustrative. Adjust it to match your actual repository structure.*

---

## ✧ Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following before proceeding:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- [MongoDB](https://www.mongodb.com/) or a configured MongoDB Atlas database
- A [Razorpay account](https://razorpay.com/) for payment integration testing

### 1. Clone the repository

```bash
git clone https://github.com/prachi-ps007/shopkart_mern.git
cd shopkart_mern
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure backend environment variables

Create a `.env` file inside the `server/` directory.

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
JWT_secret=your_jwt_secret
```

Add any additional environment variables required by your Razorpay implementation, using the exact names expected by your backend code.

For example, if your code uses these names:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Use Razorpay **test-mode credentials** for development. Never commit actual credentials or secret keys to GitHub.

### 4. Start the backend

```bash
npm start
```

The server is configured to use port `8080`, unless your environment or application configuration overrides it.

### 5. Install frontend dependencies

Open a second terminal at the repository root:

```bash
cd client
npm install
```

### 6. Configure the frontend

If your frontend uses an environment variable for its backend URL, create the appropriate environment file inside `client/`.

For a Vite application, an example might be:

```env
VITE_API_URL=http://localhost:8080
```

Use this only if your application reads `import.meta.env.VITE_API_URL`. Otherwise, configure the API URL according to your existing frontend code.

### 7. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal, typically:

`http://localhost:5173`

The backend and database must be running and configured correctly for authenticated and database-backed features to work.

---

## ✧ Security Considerations

- Passwords should be stored as hashes, never as plaintext.
- JWT secrets and database credentials belong in environment variables.
- Razorpay secret keys must remain on the backend.
- Payment signatures should be verified server-side before a payment is treated as successful.
- Order and payment status should be determined by trusted backend verification, not solely by frontend callbacks.
- CORS and cookie settings should match the intended frontend origin.
- Production deployments should use HTTPS and appropriately configured secure cookies.
- Environment files and dependency directories should be excluded from version control.

---

## ✧ Design Philosophy

Loom & Jade explores the intersection of e-commerce functionality and visual storytelling.

Rather than relying on a conventional retail layout, the interface uses the visual language of luxury catalogues, framed artwork, and curated collections. The result is a storefront designed to make product discovery feel deliberate and visually cohesive.

**Design language**
- **Ivory:** A warm, gallery-like canvas.
- **Antique gold:** Borders, accents, and ornamental details.
- **Burgundy:** A rich contrast for selected experiences, particularly the wishlist.
- **Editorial typography:** Elegant serif and script-inspired styling.
- **Framed imagery:** A consistent visual treatment for product presentation.

---

## ✧ Future Enhancements

Potential next steps for the application include:

- Order history and shipment tracking.
- Product reviews and ratings.
- Administrative product and inventory management.
- Automated testing for APIs and checkout workflows.
- Improved accessibility and responsive testing.
- Production deployment with monitoring and error handling.

---

## ✧ Author

**Prachi Shrivastav**

- GitHub: [@prachi-ps007](https://github.com/prachi-ps007)

---

<p align="center">
  <em>Loom & Jade — Thoughtfully Curated. Elegantly Experienced.</em>
</p>
