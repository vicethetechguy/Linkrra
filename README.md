# ⚡ Linkrra: The Kinetic Fintech Platform

**High-Velocity Professionalism. Neonatal Charcoal Aesthetics. Future-Proof Finance.**

Linkrra is a premium fintech dashboard and landing page system designed for the "Kinetic Architect." It rejects traditional, clinical banking UI in favor of an editorial, high-contrast experience that feels like a premium dashboard from a near-future cockpit.

---

## 🎨 Design Philosophy: "The Kinetic Architect"

Linkrra's design language, centered on **nocturnal charcoal** (`#0b0f11`) and **vibrant light sources** (`#bc9eff` primary), emphasizes tonal depth and intentional asymmetry.

- **Surface Hierarchy:** Semi-transparent "glass" surfaces layered over nocturnal depths.
- **Editorial Typography:** High-contrast pairings of *Space Grotesk* for headlines and *Manrope* for UI.
- **Tonal Transitions:** No 1px borders; structure is defined through shifts in HEX values.
- **Ambient Glows:** Soft, tinted shadows and "neon filament" status chips.

---

## 🚀 Key Features

- **📊 Dynamic Dashboard:** A high-velocity command center for financial data and link management.
- **📄 Invoice Generation:** Automated and beautifully styled invoicing system for professional transactions.
- **🔐 Secure Authentication:** JWT-based auth with encrypted password storage (bcrypt).
- **🛍️ Integrated Shop & Pricing:** Seamlessly transition from onboarding to premium tiers.
- **👤 User Profile Management:** Fully customizable profiles and public-facing link pages.
- **🖊️ Blog Engine:** Built-in content management for announcements and updates.
- **📁 SQLite Database:** Lightweight, portable data storage using `sql.js`.

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express:** Core server architecture.
- **jsonwebtoken (JWT):** Secure session handling.
- **bcryptjs:** Industry-standard password hashing.
- **sql.js:** SQLite implementation for efficient, portable data management.

### Frontend
- **Vanilla HTML5/CSS3:** Maximum performance and control without heavy frameworks.
- **Modern JS:** Reactive UI updates and dynamic data fetching.
- **Glassmorphism:** Advanced CSS filtering for depth and blur effects.

---

## 📁 Project Structure

```text
Linkrra Final/
├── 📂 public/              # Main application (HTML, CSS, JS)
│   ├── index.html          # Landing Page
│   ├── dashboard.html      # Main App Interface
│   ├── login.html          # Authentication
│   └── ...                 # Pricing, Invoices, Profiles
├── 📂 api/                 # Backend API routes
│   ├── auth.js             # Authentication logic
│   ├── invoices.js         # Invoice management
│   └── ...                 # Links, Profile, Blog
├── 📂 Linkrra Landing Page # Extra landing page assets & design specs
├── 📄 server.js            # Main Express server entry point
├── 📄 database.js          # DB configuration & initialization
├── 📄 linkrra.db           # SQLite database file
└── 📄 package.json         # Dependencies and scripts
```

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)

### Installation
1. Clone or download the project folder.
2. Open a terminal in the project root.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
To start the server in production mode:
```bash
npm start
```

To start the server in development mode (with auto-reload):
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your environment).

---

## 📝 Author & License
Designed and developed for the future of finance.
