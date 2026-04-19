# 🇲🇾 SenangGov

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Powered%20By-Google%20Gemini-orange?logo=google-gemini)](https://ai.google.dev/)

**SenangGov** is an intelligent assistant designed to simplify Malaysian government renewal workflows. Built with a chat-first approach, it provides clear, step-by-step guidance for essential citizen services, ensuring you are "ready" before you visit the counter or portal.

[**🌐 Live Demo**](https://senanggov-817098333774.europe-west1.run.app/)

---

## ✨ Key Features

* **Smart Guidance:** Interactive flows for:
    * 🛂 **Passport Renewal** (via myPasport)
    * 🚗 **Road Tax Renewal** (via MyJPJ/MyEG)
    * 🪪 **Driving Licence Renewal**
* **Eligibility Engine:** Automated status checks (`Ready`, `Blocked`, or `Pending`) based on user input.
* **AI-Powered Insights:** Uses Google Gemini with a lightweight RAG (Retrieval-Augmented Generation) system to provide context-aware answers from local knowledge snippets.
* **Modern UI:** A responsive, sleek chat interface built with React 19 and Tailwind CSS 4.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4
- **Backend:** Node.js, Express 4
- **AI Integration:** Google Gemini API (2.0 Flash)
- **Deployment:** Docker, Google Cloud Run

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/))

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/ChongBingQian/SenangGov.git](https://github.com/ChongBingQian/SenangGov.git)
   cd SenangGov
   ```
2. Instal Dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a .env file in the root directory:
   ```bash
   GEMINI_API_KEY=your_actual_key_here
   PORT = 8080
   GEMINI_MODEL=gemini-2.0-flash
   ```
---

## 🏃 Running the App
Option 1: Full Stack (Recommended)
This builds the frontend and serves it through the Express backend.
``` bash
npm run build
npm run start
```
Access the app at: http://localhost:8080

Option 2: Development Mode
Run both processes for hot-reloading during development.
- Terminal A (Backend): ``` npm run start ```
- Terminal B (Frontend): ``` npm run dev ``` (Runs on port 3000 with proxy to 8080)

---

## 🐳 Docker Support
To run the application in a containerized environment:
``` bash
# Build the image
docker build -t senanggov .

# Run the container
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here senanggov
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/healthz` | `GET` | System health check |
| `/api/ai/status` | `GET` | Check AI model configuration status |
| `/api/ai` | `POST` | Main assistant chat endpoint |

---

## 🔗 Official Portals Referenced

The assistant provides guidance and workflows based on the following official Malaysian service portals:

| Service | Portal Name | URL |
| :--- | :--- | :--- |
| **Immigration** | myPasport | [Visit Portal](https://imigresen-online.imi.gov.my/eservices/myPasport) |
| **Transport** | JPJ / MyJPJ | [Visit Portal](https://www.jpj.gov.my/myjpj/) |
| **General** | MyEG | [Visit Portal](https://www.myeg.com.my) |

---

## 📜 License
Distributed under the Apache-2.0 License. See ``` LICENSE ``` for more information.

---

Developed with ❤️ BingQian
