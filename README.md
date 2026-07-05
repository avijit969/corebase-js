# CoreBase JS Client

A robust JavaScript/TypeScript client for communicating with your CoreBase backend. This library provides a simple, Supabase-like interface for authentication and database operations.

## Installation

```bash
npm install corebase-js

# If using React/React Native hooks (Optioanal peer dependency)
npm install --save-dev react @types/react
```

## Initialization

Initialize the client with your CoreBase project URL and API Key.

```typescript
import { createClient } from 'corebase-js';

const CLIENT_URL = 'https://corebase.trivyaa.in'; // Your CoreBase API URL
const API_KEY = 'pk_...'; // Your Project Public API Key

const corebase = createClient(CLIENT_URL, API_KEY);
```

## Authentication

Manage user sessions securely.

### Sign Up

Register a new user in your project.

```typescript
const { data, error } = await corebase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe'
});

if (error) console.error('Signup error:', error);
else console.log('Welcome!', data.user);
```

### Sign In

Log in an existing user. The session is automatically persisted (in localStorage for browsers).

```typescript
const { data, error } = await corebase.auth.signIn({
  email: 'user@example.com',
  password: 'securePassword123'
});

if (error) console.error('Login error:', error);
else console.log('Logged in:', data.user);
```

### Get Current User

Retrieve the currently authenticated user's details.

```typescript
const { data, error } = await corebase.auth.getUser();

if (data) console.log('Current user:', data.user);
```

### Sign Out

Clear the current session.

```typescript
await corebase.auth.signOut();
```

### OAuth (Google / GitHub)

```typescript
// Redirect the browser to start the flow
window.location.href = corebase.auth.getOAuthUrl('google', projectId);

// On your configured success page, read the tokens off the query string
const params = new URLSearchParams(window.location.search);
corebase.auth.setSessionFromTokens({
  access_token: params.get('access_token')!,
  refresh_token: params.get('refresh_token') ?? undefined,
  user: { id: params.get('user_id')!, email: '' },
});
```

### Refresh a Session

```typescript
const { data, error } = await corebase.auth.refreshSession();
```

## specific Database Operations

Perform CRUD operations on your tables using a fluent, chainable API.

### Select Data (Read)

**Get all rows:**

```typescript
const { data, error, count } = await corebase
  .from('posts')
  .select('*');
```

**Select specific columns:**

```typescript
const { data } = await corebase
  .from('users')
  .select('id, name, email');
```

**Filtering (Where clause):**

```typescript
const { data } = await corebase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .match({ author_id: 'user_123', category: 'tech' });
```

**Pagination & Sorting:**

```typescript
const { data, count } = await corebase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false }) // Sort by newest
  .limit(10)                                 // Take 10
  .page(1);                                  // Page 1
```

**Get a Single Record:**

```typescript
const { data: user, error } = await corebase
  .from('users')
  .select('*')
  .eq('id', 1)
  .single();
```

### Insert Data (Create)

Insert one or multiple rows.

```typescript
// Single insert
const { data, error } = await corebase
  .from('posts')
  .insert({ 
    title: 'My New Post', 
    content: 'Hello World', 
    user_id: 'user_123' 
  });

// Bulk insert
const { data, error } = await corebase
  .from('posts')
  .insert([
    { title: 'Post 1', user_id: 'user_123' },
    { title: 'Post 2', user_id: 'user_123' }
  ]);
```

### Update Data

Update rows matching specific criteria.

```typescript
const { data, error } = await corebase
  .from('posts')
  .update({ status: 'archived' })
  .eq('status', 'draft')
  .match({ user_id: 'user_123' });
```

### Delete Data

Delete rows matching specific criteria.

```typescript
const { data, error } = await corebase
  .from('posts')
  .delete()
  .eq('id', 123);
```

## File Storage

Upload files to your project buckets.

### Upload File

Upload a file directly from the browser (e.g., from an `<input type="file" />`).

```typescript
// Assuming you have an input element: <input type="file" id="fileInput" />
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const { data, error } = await corebase.storage.upload(file, 'avatars');

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('File uploaded successfully!');
    console.log('File Key:', data.key);
    console.log('Upload URL:', data.url);
  }
}
```

### Buckets & Files

```typescript
await corebase.storage.createBucket({ name: 'avatars', public: true });
const { data: buckets } = await corebase.storage.listBuckets();
const { data: files } = await corebase.storage.listFiles({ bucket: 'avatars' });
const { data: blob } = await corebase.storage.downloadFile(fileId);
await corebase.storage.deleteFile(fileId);
```

## Database Schema Management

For creating/altering tables, use `corebase.db` — `corebase.from()` is for row data.

```typescript
await corebase.db.createTable({
  table: 'posts',
  columns: [
    { name: 'id', type: 'text', primary: true },
    { name: 'title', type: 'text', notNull: true },
  ],
});

const { data: tables } = await corebase.db.listTables();
await corebase.db.addColumn('posts', { name: 'published', type: 'boolean' });
```

## Edge Functions

```typescript
const { data: fn } = await corebase.functions.create({
  name: 'hello',
  trigger_type: 'http',
  code: 'export default { fetch: () => new Response("Hello!") }',
});

await corebase.functions.deploy(fn.function.id); // requires the Workers for Platforms add-on

// invoke() returns a raw Fetch Response, not {data, error} — the gateway forwards
// your deployed Worker's response byte-for-byte.
const res = await corebase.functions.invoke('hello');
console.log(await res.text());
```

## Cron Jobs & Custom Email

```typescript
await corebase.cron.create({ name: 'nightly-sync', cron_expression: '0 0 * * *', url: 'https://example.com/webhook' });

await corebase.customEmail.create({ name: 'welcome', subject: 'Hi {{name}}', body: '...' });
```

## Realtime Data (React / React Native)

Subscribe to live data changes using the `useQuery` hook. Rows are always scoped to the
connected user automatically; on top of that, the query supports column selection,
equality/operator filters, sorting, limiting, and joins.

```typescript
import { useQuery } from 'corebase-js/react';

const query = {
  from: 'posts',
  select: ['id', 'title', 'likes'],
  where: { status: 'published', likes: { gt: 10 } },
  orderBy: 'created_at',
  order: 'DESC',
  limit: 20,
};

const MyComponent = () => {
  // Subscribe to realtime updates
  const { data, loading, error } = useQuery(corebase, query);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title} ({post.likes} likes)</li>
      ))}
    </ul>
  );
};
```

**Filter operators:** `eq`, `gt`, `lt`, `in` — e.g. `{ status: { in: ['draft', 'review'] } }`.
Bare values (`{ status: 'published' }`) are treated as equality.

**Joins** (up to 3 levels deep) attach related data under a nested key named after the
joined table. Joined tables need their own explicit `select`:

```typescript
const query = {
  from: 'products',
  select: ['id', 'name', 'price', 'category_id'],
  join: [
    { table: 'categories', on: { 'products.category_id': 'categories.id' }, select: ['name'] },
  ],
};
// => { id, name, price, category_id, categories: { name } }
```

Outside React, use the client directly:

```typescript
const subId = corebase.realtime.subscribe({ from: 'posts' }, (rows) => console.log(rows));
corebase.realtime.unsubscribe(subId);
```

## TypeScript Support

This library is written in TypeScript and exports types for all responses.

```typescript
import { User, AuthSession, ClientResponse } from 'corebase-js';

// You can also provide a generic type to .from() for typed results
interface Post {
  id: number;
  title: string;
  content: string;
}

const { data } = await corebase.from<Post>('posts').select('*');
// data is typed as Post[] | null
```
