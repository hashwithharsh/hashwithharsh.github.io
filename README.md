# 🌐 hashwithharsh — DevOps Portfolio

Personal portfolio website documenting my journey to becoming a **DevOps & Cloud Engineer**.

This project demonstrates a **secure, serverless architecture** combining **GitHub Pages** and **Vercel serverless functions**.
It allows me to publish projects and blogs while keeping authentication and sensitive tokens secure.

The website is built using **pure HTML, CSS, and JavaScript** without frameworks to keep deployment simple and lightweight.

---

# 🚀 Live Website

https://hashwithharsh.github.io

---

# 🧠 Architecture

```
Visitors
   │
   ▼
GitHub Pages (Static Frontend)
   │
   │ API Requests
   ▼
Vercel Serverless Backend
   │
   ▼
GitHub Repository (Content Storage)
```

### Explanation

**GitHub Pages**

* Hosts the static frontend (`index.html`)
* Serves the portfolio UI

**Vercel**

* Runs serverless backend APIs
* Handles authentication and GitHub operations

**GitHub Repository**

* Stores projects and blog data
* Updated through the backend API

This architecture separates **frontend, backend, and data storage** for better security and scalability.

---

# 🧰 Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Responsive Design
* Dark / Light Theme

## Backend

* Node.js
* Vercel Serverless Functions

## Security

* bcrypt password hashing
* JWT authentication
* Environment variables

## Infrastructure

* GitHub Pages
* Vercel
* GitHub API

---

# 📂 Project Structure

```
.
├── index.html
│
├── vercel/api/
│   ├── login.js (password for admin)
│   ├── push.js (to push blogs and projects or any admin updates)
│   └── status.js (site health checkups - backend)
│
├── scripts/
│   └── generate-hash.js ( my passward = $2$......... hash )
│
├── data/ (it makes my index.html always tiny so landing page requires like internet to load it, and when clicked on a speficific blog then only it fetchs data to website)
│   ├── content.json
│   ├── blogs/
│   └── projects/
│
├── package.json
├── vercel.json
```

---

# 🔐 Security Features

The project implements multiple security best practices.

### Password Hashing

Passwords are not stored directly.

They are hashed using **bcrypt**.

```
bcrypt(password) → hash
```

Only the hash is stored in environment variables.

---

### JWT Authentication

After login, the server generates a **JWT token** used for authenticated API requests.

Advantages:

* Stateless authentication
* Secure session handling
* Token expiration for safety

---

### Environment Variables

Sensitive data is stored in **Vercel environment variables** instead of the frontend.

Examples:

* `ADMIN_PASSWORD_HASH`
* `JWT_SECRET`
* `GITHUB_TOKEN`
* `GITHUB_USERNAME`
* `GITHUB_REPO`
* `ALLOWED_ORIGIN`

This prevents secrets from being exposed in the browser.

---

### Rate Limiting

Login endpoint includes protection against brute-force attacks.

Example policy:

```
5 failed attempts → temporary lockout
```

---

# 🧑‍💻 Admin Panel

The website includes a **hidden admin CMS**.

It allows publishing:

* Blog posts
* Projects
* Screenshots
* Project updates

Admin panel is intentionally hidden from normal visitors.

### Access Method 1

```
https://hashwithharsh.github.io/#admin
```

### Access Method 2

Type the keyboard sequence:

```
H A R S H
```

This opens the login modal.

---

# ✍️ Features

### Portfolio

* Project showcase
* Screenshots and videos
* Project descriptions
* Technology tags

### Blog System

* Blog groups
* Featured posts
* Blog viewer

### UI/UX

* Dark / Light theme
* Smooth animations
* Responsive layout
* Reading progress bar
* Scroll navigation

### Admin CMS

* Create and edit posts
* Pin projects
* Manage blog groups
* Upload media

---

# ⚙️ Deployment

## Frontend

Hosted using **GitHub Pages**

```
https://hashwithharsh.github.io
```

Deployment happens automatically after pushing commits.

---

## Backend

Hosted using **Vercel Serverless Functions**

Endpoints:

```
POST /api/login
POST /api/push
GET  /api/status
```

The backend securely communicates with the GitHub API.

---

# 🔄 Content Publishing Flow

```
Admin writes blog/project
        │
        ▼
Frontend sends API request
        │
        ▼
Vercel API authenticates request
        │
        ▼
GitHub API creates commit
        │
        ▼
GitHub Pages rebuilds site
        │
        ▼
New content goes live
```

This workflow mimics a **CI/CD publishing pipeline**.

---

# 🎯 Purpose of This Project

This portfolio documents my **DevOps learning journey**.

I believe in **building in public** and sharing:

* projects
* experiments
* lessons learned
* mistakes and improvements

The goal is to develop a strong understanding of **Linux, infrastructure, automation, and cloud systems**.

---
# 📬 Contact

GitHub
https://github.com/hashwithharsh

Portfolio
https://hashwithharsh.github.io

---

⭐ If you find this project interesting, consider giving it a star.
