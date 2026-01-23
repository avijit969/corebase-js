# CoreBase JS Client

A JavaScript/TypeScript client for CoreBase.

## Installation

```bash
npm install corebase-js
```

## Initialization

Initialize the client with your project URL and API Key.

```javascript
import { createClient } from 'corebase-js';

const corebase = createClient('https://your-project-url.com', 'your-public-api-key');
```

## Authentication

### Sign Up

```javascript
const { data, error } = await corebase.auth.signUp({
  email: 'avi@gmail.com',
  password: 'password123',
  name: 'Avi Pradhan'
});

if (error) {
  console.error('Signup failed:', error.message);
} else {
  console.log('User created:', data.user);
}
```

### Sign In

```javascript
const { data, error } = await corebase.auth.signIn({
  email: 'avi@gmail.com',
  password: 'password123'
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Logged in user:', data.user);
  console.log('Access token:', data.access_token);
}
```

### Get Current User

```javascript
const { data, error } = await corebase.auth.getUser();

if (data) {
  console.log('Current user:', data.user);
}
```

### Sign Out

```javascript
await corebase.auth.signOut();
```
