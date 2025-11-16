# Supabase Setup for VOX Restaurant Dashboard

## Step 1: Create Supabase Account & Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Create a new project
4. Wait for the project to be ready (~2 minutes)

## Step 2: Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

3. Add to your environment variables:

**For local development** - Create `.env` file in `/home/user/dashboardv2/web/`:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

**For Render deployment** - Add these in Render Dashboard → Environment:
- `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...your-key-here`

**Important:** The `VITE_` prefix is required for Vite/React Router to expose these variables to the browser. This is safe because Supabase's anon key is designed to be public (it has Row Level Security policies protecting your data).

## Step 3: Create Database Table

1. Go to **SQL Editor** in Supabase
2. Run this SQL to create the `calls` table:

```sql
-- Create calls table
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_sid TEXT UNIQUE NOT NULL,
  restaurant_id TEXT NOT NULL,
  customer_name TEXT,
  phone_number TEXT,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  call_duration INTEGER, -- in seconds
  audio_url TEXT, -- URL from Supabase Storage
  transcript JSONB DEFAULT '[]'::jsonb, -- Array of {speaker, text, timestamp}
  order_items JSONB DEFAULT '[]'::jsonb, -- Array of {item, quantity, price, notes}
  total_price TEXT,
  payment_method TEXT,
  delivery_address TEXT,
  delivery_time TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by restaurant
CREATE INDEX idx_calls_restaurant_id ON calls(restaurant_id);

-- Create index for faster queries by call_sid
CREATE INDEX idx_calls_call_sid ON calls(call_sid);

-- Create index for faster queries by date
CREATE INDEX idx_calls_call_date ON calls(call_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're not using auth)
-- You can make this more restrictive later
CREATE POLICY "Allow all operations on calls" ON calls
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Step 4: Create Storage Bucket for Audio Files

1. Go to **Storage** in Supabase
2. Click **New bucket**
3. Name it: `call-recordings`
4. Make it **Public** (so audio URLs work without auth)
5. Click **Create bucket**

### Set Storage Policy

1. Click on the `call-recordings` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization**
5. Policy name: `Allow public read and insert`
6. For **SELECT** policy:
   - Target roles: `public`
   - Policy definition: `true`
7. For **INSERT** policy:
   - Target roles: `public`
   - Policy definition: `true`
8. Click **Create policy**

Or run this SQL in SQL Editor:

```sql
-- Storage policy for public read
CREATE POLICY "Allow public read on call recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-recordings');

-- Storage policy for public insert
CREATE POLICY "Allow public insert on call recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-recordings');
```

## Step 5: Test Your Setup

After adding the env vars and restarting your app, it should automatically connect to Supabase!

## What Data Gets Saved

Every time a call ends, the dashboard will automatically save:

- ✅ Call metadata (customer name, phone, duration, date)
- ✅ Full call transcript (AI + Caller messages)
- ✅ Order details (items, quantities, prices, total)
- ✅ Delivery information (address, time, payment method)
- ✅ Audio recording (uploaded to Supabase Storage)

## Viewing Your Data

### In Supabase Dashboard:
- **Table Editor** > `calls` - View all call records
- **Storage** > `call-recordings` - Listen to audio files

### In VOX Dashboard:
- Go to **History** tab
- Search by customer name or phone number
- Click any call to see full details and play audio

## Database Schema

```typescript
interface Call {
  id: string;                    // UUID
  call_sid: string;              // Unique call identifier from Twilio
  restaurant_id: string;         // Which restaurant this call belongs to
  customer_name?: string;
  phone_number?: string;
  call_date: string;             // ISO timestamp
  call_duration?: number;        // Seconds
  audio_url?: string;            // Public URL to Supabase Storage
  transcript: Array<{            // Full conversation
    speaker: 'AI' | 'Caller' | 'Human';
    text: string;
    timestamp?: string;
  }>;
  order_items: Array<{           // Ordered items
    item: string;
    quantity: number;
    price?: number;
    notes?: string;
  }>;
  total_price?: string;          // e.g., "PKR 1,500"
  payment_method?: string;       // e.g., "cash", "card"
  delivery_address?: string;
  delivery_time?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}
```

## Troubleshooting

### "Failed to save call" error:
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in `.env`
- Restart the app after adding env vars
- Check Supabase project is not paused (free tier auto-pauses after 1 week of inactivity)

### "Failed to upload audio" error:
- Make sure `call-recordings` bucket exists
- Make sure bucket is set to **Public**
- Check storage policies are created

### Audio not playing in history:
- Check the `audio_url` field in Supabase Table Editor
- Make sure the URL is accessible (try opening in browser)
- Check browser console for CORS errors

## Cost

Supabase **Free Tier** includes:
- 500MB database storage (thousands of calls)
- 1GB file storage (~30 hours of audio at 8kHz)
- Unlimited API requests

This should be more than enough for a restaurant dashboard!
