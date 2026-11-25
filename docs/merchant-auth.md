# Merchant authentication setup

The portal calls the existing Express API routes under `/api/merchant-auth` using Fetch with `credentials: "include"`. The `merchantToken` is an HttpOnly cookie managed by the server; the frontend never reads or stores it.

The frontend uses the public variable `NEXT_PUBLIC_API_URL` as the API origin. For local development, create or update the frontend `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Restart the Next.js development server after changing this value. The frontend origin must be allowed by backend CORS; the backend currently allows `http://localhost:3000`.

The login and registration pages are `/login` and `/register`. Other application routes require a restored merchant session. The shared auth provider calls `GET /api/merchant-auth/me` on load and makes only the safe merchant profile fields available to client UI. This client-side route gate improves navigation but does not authorize backend data access; every future protected API request must still be authorized by the server.

Local end-to-end verification requires the backend API and its own required runtime configuration to be available. The frontend setup does not start the backend or configure its database.
