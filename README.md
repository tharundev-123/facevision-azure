# 🔍 FaceVision — Azure Face Detection

![GitHub last commit](https://img.shields.io/github/last-commit/your-username/facevision-azure)
![GitHub repo size](https://img.shields.io/github/repo-size/your-username/facevision-azure)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Azure](https://img.shields.io/badge/Azure-Cognitive_Services-0078D4?logo=microsoftazure&logoColor=white)

> A sleek, dark-themed web application for real-time human face detection powered by **Microsoft Azure Cognitive Services Face API**. Upload any image or provide a URL — let AI map every face it finds with attributes, emotions, and bounding boxes.

---

## 🌐 Live Demo

**[👉 View Live Site](https://your-username.github.io/facevision-azure/)**

> ⚠️ You need your own Azure Face API credentials to use the live demo. See [Getting Started](#-getting-started) below.

---

## 📸 Preview

| Dashboard | Detection Results |
|-----------|------------------|
| Configure Azure credentials, upload images, toggle detection options | Annotated image with bounding boxes, per-face attribute cards, raw JSON output |

---

## ✨ Features

- 🔑 **Secure Credential Dashboard** — Enter your Azure endpoint & API key directly in the browser; credentials saved locally in `localStorage`, never sent anywhere else
- 📸 **Flexible Image Input** — Drag-and-drop file upload, browse from disk, or paste a public image URL
- 🧠 **Multiple Detection Models** — Choose between `detection_01`, `detection_02`, or the latest `detection_03`
- 🎛️ **Toggleable Attributes** — Selectively detect: Age, Gender, Emotions, Smile, Glasses, Facial Hair, Head Pose, Blur Level
- 🖼️ **Canvas Bounding Boxes** — Annotates the uploaded image with colored face rectangles and corner accents drawn directly on an HTML5 Canvas
- 📊 **Emotion Bar Charts** — Visual percentage bars for all detected emotions per face
- 📋 **Raw JSON Viewer** — Full Azure API response displayed with a one-click copy button
- ⚡ **Connection Validation** — Pings Azure on save to verify your credentials before detection
- 🌑 **Dark Industrial UI** — Electric cyan accent on a deep dark theme with animated scan rings and CSS grid layout
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🗂️ Project Structure

```
facevision-azure/
│
├── index.html       # Main HTML — layout, sections, component markup
├── styles.css       # All styling — dark theme, animations, responsive grid
└── app.js           # Azure API logic, canvas drawing, UI interactions
```

> Pure vanilla HTML/CSS/JavaScript — **zero dependencies**, no build tools, no frameworks required.

---

## 🚀 Getting Started

### Prerequisites

- A free or paid **Microsoft Azure account**
- A **Face API** resource created in Azure Portal

### Step 1 — Create Azure Face API Resource

1. Go to [portal.azure.com](https://portal.azure.com)
2. Click **"Create a resource"** → search for **"Face"**
3. Select **Face** under Azure AI Services → Click **Create**
4. Fill in:
   - **Subscription:** Your Azure subscription
   - **Resource Group:** Create new or use existing
   - **Region:** Choose nearest to you (e.g. `East US`)
   - **Name:** Any unique name (e.g. `my-face-api`)
   - **Pricing Tier:** `Free F0` (10,000 transactions/month free)
5. Click **Review + Create** → **Create**
6. Once deployed, go to the resource → **Keys and Endpoint**
7. Copy **Key 1** and the **Endpoint URL**

### Step 2 — Run the App

**Option A — Open locally:**
```bash
# Clone the repo
git clone https://github.com/your-username/facevision-azure.git

# Navigate into the folder
cd facevision-azure

# Open in browser (just double-click index.html, or use a local server)
open index.html
```

**Option B — Use the live GitHub Pages site:**

Visit: `https://your-username.github.io/facevision-azure/`

### Step 3 — Configure Credentials

1. In the **Azure Credentials** card, enter:
   - **API Endpoint:** your endpoint without `https://` (e.g. `my-face-api.cognitiveservices.azure.com`)
   - **Subscription Key:** your 32-character Key 1
2. Choose a detection model
3. Click **"Save & Validate Connection"** — a green ✓ confirms success

### Step 4 — Detect Faces

1. Drag & drop an image or paste a public URL
2. Toggle any attributes you want analyzed
3. Click **"Detect Faces"**
4. Results appear below with annotated image, per-face cards, and raw JSON

---

## 🧩 How It Works

```
User uploads image / provides URL
        ↓
app.js reads Azure credentials from the dashboard
        ↓
POST request → Azure Face API v1.0/detect
  - image/octet-stream (file) OR application/json (URL)
  - Headers: Ocp-Apim-Subscription-Key
  - Query params: detectionModel, returnFaceAttributes
        ↓
Azure returns array of face objects with:
  - faceRectangle (left, top, width, height)
  - faceAttributes (age, gender, emotion, smile, etc.)
        ↓
app.js draws bounding boxes on HTML5 Canvas
app.js renders per-face attribute cards
app.js displays raw JSON in code viewer
```

---

## 🎛️ Detectable Attributes

| Attribute | Description |
|-----------|-------------|
| `age` | Estimated age in years |
| `gender` | Male / Female |
| `emotion` | Anger, contempt, disgust, fear, happiness, neutral, sadness, surprise — each as 0–1 probability |
| `smile` | Smile intensity score (0.0 – 1.0) |
| `glasses` | NoGlasses / ReadingGlasses / Sunglasses / SwimmingGoggles |
| `facialHair` | Beard, moustache, sideburns scores |
| `headPose` | Yaw, pitch, roll in degrees |
| `blur` | Blur level (low / medium / high) + numeric value |

---

## 🛡️ Security & Privacy

- **Your API key is never sent to any third-party server.** It is stored only in your own browser's `localStorage` and sent directly to Microsoft Azure.
- **Images are sent directly from your browser to Azure** — they do not pass through any intermediate server.
- ⚠️ **Never hardcode your API key** in the source files before pushing to GitHub. The dashboard design intentionally keeps credentials user-entered at runtime.
- To clear saved credentials, open your browser's Developer Tools → Application → Local Storage → delete the `faceVisionCreds` entry.

---

## 🌐 API Reference

This project uses the **Azure Face API v1.0 Detect** endpoint:

```
POST https://{endpoint}/face/v1.0/detect
  ?detectionModel={model}
  &recognitionModel=recognition_04
  &returnFaceId=false
  &returnFaceLandmarks=false
  &returnFaceAttributes={comma-separated-attrs}
```

Official docs: [Azure Face API Documentation](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-identity)

---

## 🖥️ Browser Compatibility

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | ✅ |
| Firefox 90+ | ✅ |
| Edge 90+ | ✅ |
| Safari 14+ | ✅ |
| Opera 80+ | ✅ |

---

## 📦 Deployment

### GitHub Pages (Recommended)

1. Push your code to a GitHub repository
2. Go to **Settings → Pages**
3. Set Source: **Deploy from branch** → `main` → `/ (root)`
4. Click **Save** — your site will be live at:
   ```
   https://your-username.github.io/facevision-azure/
   ```

### Local Development Server

If you need CORS headers or plan to extend the app:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code — install "Live Server" extension and click "Go Live"
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add: your feature description"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request**

### Ideas for Contributions
- [ ] Add face comparison / verification feature
- [ ] Support webcam/live video detection
- [ ] Export results as PDF report
- [ ] Add i18n / multilanguage support
- [ ] Implement Azure Face Identify (recognize known faces)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — free to use, modify, and distribute with attribution.
```

---

## 👤 Author

**Your Name**
- GitHub: [@your-username](https://github.com/tharundev-123)
- LinkedIn: [your-linkedin](https://www.linkedin.com/in/tharundevmc/)

---

## 🙏 Acknowledgements

- [Microsoft Azure Cognitive Services](https://azure.microsoft.com/en-us/products/ai-services/) — Face API

---

<p align="center">Made with ❤️ and Azure AI</p>