# CoreBase JS Client

A robust JavaScript/TypeScript client for communicating with your CoreBase backend. This library provides a simple, Supabase-like interface for authentication and database operations.

## Installation

```bash
npm install corebase-js
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
  const { data, error } = await corebase.storage.upload(file);

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('File uploaded successfully!');
    console.log('File Key:', data.key);
    console.log('Upload URL:', data.url);
  }
}
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
