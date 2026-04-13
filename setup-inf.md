# TradeSet Platform - Developer Setup & Documentation

Assalam-o-Alaikum! This document serves as a complete guide for setting up, building, and managing the TradeSet application for new developers.

---

## 🛠 1. Basic Setup & Installation

Follow these steps to get the project running on your local machine:

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd trade_reactjs_website
    ```
2.  **Install Dependencies**:
    Make sure you have [Node.js](https://nodejs.org/) installed.
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## 🚀 2. Build & Deployment (Live)

To make the website live on Firebase Hosting:

1.  **Build the Project**:
    This generates a optimized production folder named `dist`.
    ```bash
    npm run build
    ```
2.  **Firebase Login**:
    If you haven't installed firebase tools: `npm install -g firebase-tools`.
    ```bash
    firebase login
    ```
3.  **Deploy**:
    ```bash
    firebase deploy
    ```

---

## 📂 3. Tech Stack & Controls

*   **Server**: Firebase Hosting (Static Frontend).
*   **Database**: **Firebase Firestore** (NoSQL).
*   **Storage**: Firebase Storage (for images/files).
*   **Framework**: React.js (Vite).
*   **State Management**: React Hooks (useState, useEffect, Context API).

---

## 🛡 4. Admin Panel & Controls

The Admin Panel is the "Brain" of the platform.

### How to Access:
Go to your domain followed by `/set` (e.g., `www.yourtradenam.com/set`).

### Default Credentials:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `super@gmail.com` | `sajo` |
| **Standard Admin** | `admin@gmail.com` | `12345678` |

### Key Admin Features:
*   **Deposits & Withdrawals**: Approve or reject user payment requests.
*   **User Management**: Edit user balances, block users, or verify KYC.
*   **News & Blogs**: Write and publish market updates.
*   **Home Banners**: Change the carousel images on the home screen.
*   **Market Signals**: **CRITICAL CONTROL.** Admin can set if a specific signal will result in a **Profit** or **Loss** for all active trades.
*   **System Settings**: Change the Website Name, Logo, USDT Wallet Address (TRC20), and EmailJS API keys.

---

## 📊 5. Demo Data & Content Upload

Since the platform is dynamic, "Demo Data" is uploaded through the Admin Panel:

1.  **Users**: Standard users can register via the `/signup` page.
2.  **Trading Data**: Use **"Market Signals"** in the Admin panel to create initial market trends.
3.  **Banners**: Upload 2-3 high-quality trading banners in **"Home Banners"** section to make the site look active.
4.  **Blogs**: Use **"News & Blogs"** to add 3-5 dummy articles so the site doesn't look empty.
5.  **Manual DB entry**: If needed, you can go to [Firebase Console](https://console.firebase.google.com/), open your project, and manually add data into the Collections.

---

## ⚙️ 6. Database Collections Structure

*   `users`: Stores user profiles, balances, and history.
*   `admin_set`: Stores platform configurations (Wallet, Logo, Admin Credentials).
*   `deposits`: PENDING/APPROVED/REJECTED deposit logs.
*   `withdrawals`: Withdrawal requests.
*   `signals`: Admin-set market results.
*   `blogs`: News items.

---

**Note:** Always ensure your `src/firebase-setup.js` contains the correct API keys for your own Firebase project before deployment.
