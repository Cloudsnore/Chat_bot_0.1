# Build UpliftMate Chatbot

We will build a workplace wellness Next.js chatbot called "UpliftMate" using the Vercel AI SDK with the Google provider, along with shadcn/ui components.

## Proposed Changes
### Scaffolding
- Initialize Next.js app in the current directory (`npx -y create-next-app@latest .`)
- Install required dependencies.
- Initialize and configure `shadcn/ui`.

### Backend
- `lib/prompt.ts`: System prompt and persona definition.
- `lib/safety.ts`: Crisis detection utility.
- `app/api/chat/route.ts`: Vercel AI SDK chat endpoint.

### Frontend
- `components/CrisisModal.tsx`: Modal for displaying crisis contacts.
- `components/Chat.tsx`: Chat interface with framer-motion animations and crisis logic interceptor.
- `app/page.tsx`: Application entry point to render the Chat component.

## Verification Plan
### Automated Tests
- Build verification step (`npm run build`).
### Manual Verification
- Start dev server, check rendering and ensure crisis logic intercepts trigger keywords correctly.
