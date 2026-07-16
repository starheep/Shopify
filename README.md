# 🛍️ Shopify - AI Powered E-Commerce Platform

An AI-powered full-stack e-commerce platform built with **React + TypeScript frontend** and **Django REST Framework backend**.  
The project combines modern web technologies with AI-based features to help users explore products, analyze ideas, communicate with AI assistants, and interact with vendors.

---

## 🚀 Features

### 🤖 AI Features
- AI-powered assistant for user interaction
- AI-based product exploration
- AI project/idea analysis
- Smart kit builder
- Price intelligence and recommendations
- AI tools integration

### 🛒 E-Commerce Features
- User authentication
- Vendor management
- Product exploration
- Vendor dashboard
- Project dashboard
- Product/service discovery

### 🔐 Security
- JWT-based authentication
- Environment variable based secret management
- CORS configuration
- Django security middleware

### 🏗️ Architecture

```
Shopify
│
├── Frontend
│   ├── React
│   ├── TypeScript
│   ├── Vite
│   └── Components
│
├── Backend
│   ├── Django
│   ├── Django REST Framework
│   ├── JWT Authentication
│   ├── AI Modules
│   └── MySQL Database
│
└── Docker
    └── Container Configuration
```

---

# 🛠️ Tech Stack

## Frontend
- React.js
- TypeScript
- Vite
- CSS
- REST API Integration

## Backend
- Python
- Django
- Django REST Framework
- JWT Authentication
- MySQL

## AI & Tools
- LLM Integration
- AI-powered recommendation systems
- Data processing tools

## DevOps
- Docker
- Git
- GitHub

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone https://github.com/starheep/Shopify.git

cd Shopify
```

---

# Backend Setup

Navigate to backend:

```bash
cd Backend/App
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

### Windows

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` file:

```
DJANGO_SECRET_KEY=your_secret_key

DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306
```

Run migrations:

```bash
python manage.py migrate
```

Start backend:

```bash
python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000/
```

---

# Frontend Setup

Navigate:

```bash
cd Frontend
```

Install packages:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:5173/
```

---

# 🐳 Docker Setup

Run:

```bash
docker-compose up --build
```

---

# 📂 Project Modules

## AI Lab Assistant
An intelligent assistant module for interacting with users and providing AI-driven responses.

## Product Explorer
Helps users discover and analyze products.

## Price Intelligence
Provides pricing insights and comparisons.

## Smart Kit Builder
Allows users to create customized product/project kits.

## Vendor Dashboard
Provides vendor-related management features.

---

# 🔑 Environment Variables

Sensitive information should never be stored directly in code.

Example:

```
.env
```

contains:

```
DJANGO_SECRET_KEY=
DATABASE_PASSWORD=
API_KEYS=
```

Make sure `.env` is included in `.gitignore`.

---

# 🔮 Future Improvements

- Cloud deployment
- Advanced recommendation engine
- More LLM integrations
- Payment gateway integration
- Real-time chat system
- Mobile application

---

# 👨‍💻 Author

**Akshat Garg**

B.Tech Computer Science Engineering

---

# ⭐ Contribution

Contributions, issues, and feature requests are welcome.

If you like this project, consider giving it a ⭐ on GitHub.
