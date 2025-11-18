import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const metadata = {
  title: "Vox | Dashboard",
  description: "AI-powered call management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Vox | Dashboard</title>
        <meta
          name="description"
          content="AI-powered call management dashboard"
        />
        <link rel="icon" href="/vox-logo.svg" type="image/svg+xml" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
