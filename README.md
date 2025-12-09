# ProsePolish: AI-Powered Writing Assistant

**ProsePolish** is a modern, web-based writing studio designed to help users refine their writing. Leveraging the power of the Google Gemini API, it provides intelligent feedback, corrections, and stylistic enhancements in real-time.

## ✨ Features

-   **✍️ Advanced Grammar & Phrasing Analysis:** Get detailed corrections for grammar and suggestions for better phrasing to improve clarity and style.
-   **🎨 Multiple Writing Styles:** Tailor the feedback to your needs with styles like Formal, Casual, Technical, Storytelling, and more.
-   **⚡ Live Mode:** Receive instant suggestions and corrections as you type, streamlining your writing process.
-   **🎓 IELTS Assessment:** Get an estimated IELTS band score for your text, with a breakdown of different criteria.
-   **📖 Built-in Dictionary:** Select any word to get its definition and context.
-   **📚 Personal Dictionary:** Save word definitions to your personal collection for future reference.
-   **🌓 Light & Dark Mode:** Switch between light and dark themes for a comfortable writing experience.
-   **⚙️ Admin Dashboard:** A dedicated section for administrative users.

## 🛠️ Tech Stack

-   **Frontend:** [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **AI:** [Google Gemini API](https://ai.google.dev/)
-   **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

**Prerequisites:**
*   [Node.js](https://nodejs.org/en) (v18 or later recommended)
*   An active [Google Gemini API key](https://ai.google.dev/).

**Installation & Setup:**

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd prosepolish
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env.local` in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Usage

-   **Enter Text:** Type or paste your text into the main editor.
-   **Select Style:** Choose a writing style that matches your audience and purpose.
-   **Analyze:** Click "Polish Writing" to get a full analysis. The results will appear in the panel on the right.
-   **Live Mode:** Toggle "Live Mode" to get suggestions as you write.
-   **Define Words:** Highlight any word in the output panel to bring up a definition. You can save definitions to your personal dictionary.
-   **View Dictionary:** Access your saved words by clicking the book icon in the header.

## Project Structure

```
/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   ├── services/         # API service for Gemini
│   ├── App.tsx           # Main app component
│   └── index.tsx         # Entry point
├── .env.local            # Environment variables (untracked)
├── package.json
├── DESIGN.md             # Detailed design documentation
└── README.md
```

## Documentation

For detailed technical documentation, architecture overview, and design decisions, see [DESIGN.md](DESIGN.md).