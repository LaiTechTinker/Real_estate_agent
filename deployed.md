# Deployment guide

This guide deploys the three parts of this repository separately:

| Part | Hosting | Repository directory |
|---|---|---|
| Public landing page | Vercel static site | `landingpage/` |
| Chat widget app | Vercel Vite app | `frontend/` |
| Python API and WebSocket server | Render web service | `backend/` |

Deploy the backend first. The widget must use its public WebSocket URL, and
the public landing page can then link to or embed the deployed widget.

## 1. Prepare the repository

1. Push the project to a GitHub repository that Vercel and Render can access.
2. Make sure the branch you want to deploy contains the latest changes.
3. **Do not commit secrets.** Keep `.env`, Google OAuth credentials, access
   tokens, and API keys out of Git. Enter secrets in the hosting provider's
   environment-variable settings instead.
4. Check that the property database will be available to the deployed backend.
   The application queries `backend/data/real_estate_data.db`, but the
   repository's `.gitignore` excludes that database (and the source CSV).
   Render only checks out committed files, so a database that exists only on
   your computer will not be present in the deployed service.

   For a small, non-sensitive database, generate it locally from the CSV and
   commit only the database file:

   ```powershell
   cd backend
   .\venv\Scripts\python.exe data\csv_to_sql.py
   cd ..
   ```

   Remove the `/backend/data/real_estate_data.db` ignore rule from `.gitignore`,
   then add and commit `backend/data/real_estate_data.db`. Check its size and
   data licensing/privacy before committing it. Do not commit the CSV if it
   contains data you should not publish.

   If the database should not be in Git, arrange another way to place it at
   `backend/data/real_estate_data.db` in the Render service. A Render disk
   mounted at a different path will require a code/configuration change because
   the database path is currently constructed relative to the Python source.

## 2. Deploy the backend to Render

1. Sign in to [Render](https://render.com/) and choose **New + → Web Service**.
2. Connect the GitHub repository.
3. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3; use Python 3.11 to match the project's current
     local environment.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:**

     ```bash
     uvicorn app-retell.server:app --host 0.0.0.0 --port $PORT
     ```

   - **Health Check Path:** `/`
4. Add the following environment variables under the service's **Environment**
   settings. Enter the actual secret values in Render; do not put them in this
   guide or in Git.

   | Variable | Required? | Purpose |
   |---|---|---|
   | `GEMINI_API_KEY` | Yes | Gemini model provider |
   | `OPENAI_API_KEY` | Yes | OpenAI model provider |
   | `GROQ_API_KEY` | Yes | Groq model provider |
   | `RETELL_API_KEY` | Only for Retell voice/webhook features | Retell integration |

   All three model-provider keys are required by the current code: it creates
   the Gemini, OpenAI, and Groq clients during application startup, even though
   the resilient model may not call every provider on a given request. Without
   all three keys the backend may fail while importing/initializing the app.
   The Retell key is not needed for browser chat or property searches.
5. Create the service and wait for the first deploy to finish. Render will show
   a public URL similar to `https://your-service.onrender.com`.
6. Open that URL in a browser. The `/` route should return a short “Hello
   World!” message. This checks that the server started; it does not check
   that model keys or the property database work.
7. Save the URL. The browser chat needs its secure WebSocket base URL, which is
   the same hostname with `wss://` instead of `https://`, for example
   `wss://your-service.onrender.com`.

### Backend capabilities and hosting notes

- A database file must exist before testing a property search. A successful
  `/` response does not prove that `real_estate_data.db` was included.
- Calendar appointment actions also need the Google Calendar OAuth setup used
  by the backend. The local `credentials.json` and `token.json` files are
  ignored by Git and should not be committed. The current code reads/writes
  those files, so configure secure file storage and persistence before relying
  on calendar actions in production. Chat and basic property search do not
  require those files.
- Conversation checkpointing currently uses an in-memory SQLite connection.
  Conversation state can be lost when the Render process restarts, and
  separate service instances will not share that memory. Start with one
  instance for a demo; durable or multi-instance conversations need a
  persistent shared checkpoint store.
- A free or sleeping service can take time to wake after inactivity. For a
  live client demo, check the current Render plan's sleep/availability limits
  and consider an always-on instance.

## 3. Point the widget at the Render WebSocket

The current widget source connects directly to
`ws://127.0.0.1:8000/ws/...`. That only works on the developer's computer. It
must use the Render WebSocket URL before the Vercel build.

1. Edit `frontend/src/components/chatbot-widget.tsx`. Replace the hard-coded
   WebSocket URL with an environment-based URL:

   ```tsx
   const websocketBaseUrl = import.meta.env.VITE_WS_URL
   if (!websocketBaseUrl) {
     throw new Error('VITE_WS_URL is not configured')
   }

   const newSocket = new WebSocket(
     `${websocketBaseUrl.replace(/\/$/, '')}/ws/${websiteId}/${threadId}`,
   )
   ```

   Place this where `new WebSocket(...)` is currently created. Do not include
   `/ws` in `VITE_WS_URL`; the code above appends the endpoint path.
2. Add the Vite type to `frontend/src/vite-env.d.ts` so TypeScript recognizes
   the variable:

   ```ts
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_WS_URL: string
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv
   }
   ```

3. For local development, you can create `frontend/.env.local` (do not commit
   it) with:

   ```dotenv
   VITE_WS_URL=ws://127.0.0.1:8000
   ```

4. Build the frontend locally to catch TypeScript or build errors:

   ```powershell
   cd frontend
   npm ci
   npm run build
   ```

   The repository currently contains both `package-lock.json` and
   `pnpm-lock.yaml`. Use one package manager consistently. The commands above
   use npm and `package-lock.json`; if that lockfile is not current, update it
   locally and commit the lockfile before deploying.

## 4. Deploy the chat widget app to Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub
   repository.
2. Set **Root Directory** to `frontend`.
3. Use these build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci` (or let Vercel use its detected npm install
     command if that is how the project is configured)
4. Add this environment variable in Vercel's project settings for **Production**
   (and Preview too, if you want preview deployments to connect):

   ```dotenv
   VITE_WS_URL=wss://your-service.onrender.com
   ```

   Replace the example hostname with the Render URL from step 2. `VITE_`
   variables are embedded into the public browser bundle at build time. They
   must not contain API keys or other secrets.
5. Deploy. When the build completes, Vercel gives you a URL such as
   `https://your-chat-widget.vercel.app`.
6. Open the widget URL, click the chat button, and send a message. Check the
   browser developer console and the Render logs if it does not connect. If you
   change `VITE_WS_URL`, redeploy so Vite builds the new value into the app.

The app currently passes `websiteId="website1"` in `frontend/src/App.tsx`.
That is fine for a single demo. It is not a protected customer/tenant identity:
the backend accepts the ID from the WebSocket URL and does not currently
enforce per-customer authorization or data isolation. Do not treat different
`websiteId` strings as a security boundary.

## 5. Use the widget on another landing page

The current React component is not published as an embeddable JavaScript
package or `<script>` widget. The quickest way to test it on another site is
to embed the deployed Vercel app in an iframe. This is suitable for a basic
demo, but a production-grade integration would need a small widget loader and
better iframe sizing/visibility behavior.

### Prepare the Vercel app for an iframe

The starter `#root` CSS adds page padding, a maximum width, and a white
background. For a floating iframe, update `frontend/src/App.css` and
`frontend/src/index.css` so the app background is transparent and the widget
is positioned against the iframe viewport:

```css
/* frontend/src/App.css */
#root {
  width: 100%;
  height: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
}
```

Add this after the existing base rules in `frontend/src/index.css`:

```css
html,
body,
#root {
  width: 100%;
  min-height: 100%;
  margin: 0;
  background: transparent;
}
```

Commit and push the CSS changes, then let Vercel redeploy the widget project.
Check that the deployed app still displays and operates correctly on its own.

### Add an iframe to a demo page

Add this markup to the other site's HTML, replacing the URL with your Vercel
widget URL:

```html
<style>
  #realtor-chat-frame {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483000;
    width: 420px;
    height: 700px;
    border: 0;
    background: transparent;
  }

  @media (max-width: 480px) {
    #realtor-chat-frame {
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100dvh;
    }
  }
</style>

<iframe
  id="realtor-chat-frame"
  src="https://your-chat-widget.vercel.app"
  title="Real estate chat assistant"
  loading="lazy"
></iframe>
```

Replace `https://your-chat-widget.vercel.app` with the actual deployment URL.
The iframe is a separate browser origin; its storage and app runtime are
separate from the host landing page. In this simple version, the transparent
iframe still occupies a 420-by-700-pixel clickable area, even while the chat
is closed. If that interferes with the host page, use the standalone widget
URL for demos or build a loader that resizes/hides the iframe when the chat
opens and closes.

## 6. Deploy the public landing page to Vercel

1. In Vercel, create another project from the same GitHub repository. Use a
   separate Vercel project from the React widget.
2. Set **Root Directory** to `landingpage`.
3. The landing page is plain HTML, CSS, and JavaScript. Choose **Other** (or
   no framework) and deploy it as a static site:
   - No install command is required.
   - No build command is required.
   - If Vercel requests an output directory, set it to `.` (the project root).
4. Deploy and open the assigned URL. Confirm images, navigation, and dialogs
   work on the deployed domain. The page loads Google Fonts and Unsplash
   images from their public hosts, so those external services must be reachable
   by visitors.
5. To show the chat on this landing page, add the iframe markup from section 5
   to `landingpage/index.html` (or the shared page markup where appropriate).
   Replace the sample Vercel URL with the actual widget app URL, commit the
   change, and wait for Vercel to redeploy the landing-page project.
6. Optionally add a custom domain in each Vercel project's **Settings →
   Domains**, follow Vercel's DNS instructions, and wait for DNS/TLS setup to
   complete.

## 7. Final end-to-end checks

Run through these checks after all three services are deployed:

1. Landing-page Vercel URL loads over HTTPS and its page assets appear.
2. Widget Vercel URL loads directly.
3. Render's `/` route returns its greeting.
4. The chat opens from the widget app or embedded landing page.
5. Send a simple question and confirm a response arrives. In the browser
   network tools, the connection should use `wss://.../ws/website1/...`, not
   `ws://127.0.0.1:8000`.
6. Ask for a property search and confirm the Render service has the database
   file and returns search results.
7. Review Vercel build logs and Render runtime logs for missing environment
   variables, WebSocket disconnects, model API errors, or missing database
   files.

## Troubleshooting

| Symptom | Check |
|---|---|
| Browser tries `127.0.0.1:8000` | Replace the hard-coded URL, set Vercel's `VITE_WS_URL`, and redeploy. |
| Mixed-content or WebSocket security error | The production WebSocket URL must start with `wss://`, not `ws://`. |
| Render deploy fails at startup with missing model key | Add all three required model keys: `GEMINI_API_KEY`, `OPENAI_API_KEY`, and `GROQ_API_KEY`. |
| Chat connects but property lookup errors | Confirm `backend/data/real_estate_data.db` exists in the deployed service and has the `real_estate` table. |
| Chat works only on your machine | Check that the Vercel project has the correct production `VITE_WS_URL` and that its latest build completed. |
| Chat disconnects after inactivity | The Render service may be waking from sleep; check its plan and runtime logs. |
| Chat iframe covers/captures page clicks | The simple iframe occupies its full dimensions while transparent; reduce its size or add open/close resize messaging. |
| Calendar actions fail | Configure Google Calendar OAuth securely; local ignored credential/token files are not deployed by Git. |
