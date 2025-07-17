# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuring API Base URL for Tunnels/Dev

If you are using a public tunnel (like devtunnels.ms) or want to point your frontend to a remote backend, create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_API_BASE_URL=https://your-tunnel-url.inc1.devtunnels.ms
```

This will ensure all API requests from the frontend go to the correct backend URL, avoiding CORS and network errors.
