# Full-Stack Express App — What I Learned

> **Milestone:** I finished my Full-Stack Express course and built my first Express application.
>
> This document records the mistakes I made, the concepts I learned, the mental models that finally clicked, and the things I do not want to forget.

---

# 1. The Big Picture

The biggest thing I learned is that backend development is largely about moving data through a predictable flow:

```text
Frontend
   ↓
HTTP Request
   ↓
Express Router
   ↓
Middleware
   ↓
Controller
   ↓
Database
   ↓
Controller
   ↓
HTTP Response
   ↓
Frontend
```

For authenticated features:

```text
Browser
   ↓
Request + session cookie
   ↓
Express session middleware
   ↓
req.session.userId
   ↓
Controller
   ↓
Database query using that userId
   ↓
Response
```

I should think about the **flow of data**, not just individual lines of code.

---

# 2. Express Fundamentals

## Creating an Express app

```js
import express from 'express'

const app = express()

app.listen(8000, () => {
  console.log('Server running')
})
```

`app` is the Express application.

---

## Middleware

Middleware sits in the request/response pipeline.

```js
app.use(express.json())
```

This allows Express to parse JSON request bodies.

Without it, this:

```js
req.body
```

may not contain the JSON data sent by the frontend.

### Mental model

```text
Request
   ↓
Middleware
   ↓
More middleware
   ↓
Route
   ↓
Controller
   ↓
Response
```

---

# 3. Routing

I learned to separate routes from controller logic.

Example:

```js
import express from 'express'
import { loginUser } from '../controllers/authController.js'

export const authRouter = express.Router()

authRouter.post('/login', loginUser)
```

And in the main app:

```js
app.use('/api/auth', authRouter)
```

Therefore:

```text
POST /api/auth/login
```

reaches `loginUser`.

### Important

Pass the function:

```js
authRouter.post('/login', loginUser)
```

not:

```js
authRouter.post('/login', loginUser())
```

The first tells Express:

> Run this function when a matching request arrives.

---

# 4. req.body, req.params, req.query and req.session

This was one of the most important things I learned.

## `req.body`

Data sent in the request body.

Example:

```js
const { username, password } = req.body
```

Used for things like:

```json
{
  "username": "test",
  "password": "test"
}
```

---

## `req.params`

Data contained in the URL path.

Example:

```text
/cart/42
```

Route:

```js
router.delete('/cart/:itemId', deleteItem)
```

Then:

```js
req.params.itemId
```

is:

```text
42
```

---

## `req.query`

Data after `?`.

Example:

```text
/products?search=lo
```

Then:

```js
req.query.search
```

is:

```text
lo
```

---

## `req.session`

Data stored on the user's session.

Example:

```js
req.session.userId
```

I used this to remember which user is logged in.

Mental model:

```text
req.body
→ data submitted

req.params
→ resource identifier from URL

req.query
→ filtering/searching information

req.session
→ information about the current user's session
```

---

# 5. Express Responses

I learned that:

```js
res.status(400)
```

sets the HTTP status.

```js
res.json(...)
```

sends JSON.

They can be chained:

```js
return res.status(400).json({
  error: 'Invalid credentials'
})
```

### Why `return`?

Because sending a response does not automatically stop JavaScript execution.

Without `return`:

```js
if (!user) {
  res.status(401).json({ error: 'Invalid credentials' })
}

res.json({ message: 'Logged in' })
```

the function may attempt to send two responses.

With:

```js
return res.status(401).json(...)
```

the function stops there.

Mental model:

```text
return
   ↓
stop this function here
```

---

# 6. HTTP Status Codes I Used

## 200 — OK

The request succeeded.

```js
res.status(200).json({
  message: 'Logged in'
})
```

Express also allows:

```js
res.json({
  message: 'Logged in'
})
```

because 200 is the default successful response.

---

## 201 — Created

Used after successfully creating something.

```js
res.status(201).json({
  message: 'User registered'
})
```

This was appropriate after creating a new user.

---

## 204 — No Content

Used when an operation succeeded but there is no response body to send.

For example, deleting a cart item:

```js
res.status(204).send()
```

Do not use `.json()` for a 204 response.

---

## 400 — Bad Request

The client sent invalid/incomplete data.

```js
return res.status(400).json({
  error: 'All fields are required'
})
```

---

## 401 — Unauthorized

Used when authentication is required or credentials are invalid.

```js
return res.status(401).json({
  error: 'Unauthorized'
})
```

---

## 409 — Conflict

Useful when something conflicts with existing data.

For example:

```text
Username already in use
Email already in use
```

---

## 500 — Server Error

Used when something unexpected happens on the server.

```js
res.status(500).json({
  error: 'Internal server error'
})
```

---

# 7. JavaScript Scope — One of My Biggest Lessons

I initially thought that because functions were in the same file, they could reference each other's variables.

Wrong.

```js
function getAll() {
  const userId = 5
}

function deleteItem() {
  console.log(userId) // ❌
}
```

`userId` belongs to `getAll()`.

It does not exist inside `deleteItem()`.

### Mental model

Every function has its own scope.

```text
getAll()
┌────────────────────┐
│ const userId = ... │
└────────────────────┘

deleteItem()
┌────────────────────┐
│ userId doesn't     │
│ exist here         │
└────────────────────┘
```

Even if both functions are in the same file.

### Important

The database is different.

The data stored in the database persists.

So another function can query the database again.

---

# 8. Async/Await

Database operations are asynchronous.

I learned to use:

```js
const user = await db.get(...)
```

instead of:

```js
const user = db.get(...)
```

Without `await`, I may be holding a Promise instead of the actual result.

Mental model:

```text
async operation
      ↓
Promise
      ↓
await
      ↓
actual result
```

---

# 9. SQLite and Database Operations

I learned the basic CRUD operations.

```text
CREATE
READ
UPDATE
DELETE
```

## SELECT one row

```js
const user = await db.get(
  'SELECT * FROM users WHERE username = ?',
  [username]
)
```

Use `db.get()` when I expect one row.

---

## SELECT multiple rows

```js
const items = await db.all(
  'SELECT * FROM cart_items WHERE user_id = ?',
  [userId]
)
```

Use `db.all()` when I want multiple rows.

---

## INSERT

```js
await db.run(
  `INSERT INTO users (name, email, username, password)
   VALUES (?, ?, ?, ?)`,
  [name, email, username, hashed]
)
```

---

## UPDATE

```js
await db.run(
  `UPDATE cart_items
   SET quantity = quantity + 1
   WHERE id = ?`,
  [itemId]
)
```

---

## DELETE

```js
await db.run(
  `DELETE FROM cart_items
   WHERE id = ?`,
  [itemId]
)
```

### Important rule

```text
SELECT → db.get() / db.all()
INSERT → db.run()
UPDATE → db.run()
DELETE → db.run()
```

I initially tried to use:

```js
db.all()
```

for DELETE.

That was wrong because DELETE performs an operation rather than retrieving rows.

---

# 10. SQL Placeholders

I learned that:

```sql
WHERE id = ?
```

uses a parameter placeholder.

Then:

```js
[userId]
```

provides the value.

Example:

```js
await db.get(
  'SELECT name FROM users WHERE id = ?',
  [req.session.userId]
)
```

The `?` is not something I have to manually replace.

The database library binds the value.

This is also important for safely handling user input.

---

# 11. UPDATE and DELETE — Always Think About WHERE

This is extremely important.

Bad:

```sql
UPDATE cart_items
SET quantity = quantity + 1
```

That could update every row.

Good:

```sql
UPDATE cart_items
SET quantity = quantity + 1
WHERE id = ?
```

Likewise:

```sql
DELETE FROM cart_items
WHERE id = ? AND user_id = ?
```

Before using `UPDATE` or `DELETE`, ask:

> Which exact rows am I modifying?

---

# 12. SQL JOINs

This confused me at first.

A cart item might contain:

```text
cart_items
----------------
id
user_id
product_id
quantity
```

But the product information lives in:

```text
products
----------------
id
title
artist
price
```

The cart only knows the product's ID.

So I use:

```sql
JOIN products p
ON p.id = ci.product_id
```

This means:

> Connect the cart item's `product_id` to the product's `id`.

Example:

```js
const items = await db.all(`
  SELECT
    ci.id AS cartItemId,
    ci.quantity,
    p.title,
    p.artist,
    p.price
  FROM cart_items ci
  JOIN products p
    ON p.id = ci.product_id
  WHERE ci.user_id = ?
`, [req.session.userId])
```

Mental picture:

```text
cart_items                     products
-----------                    --------
product_id = 7  ───────────→   id = 7
                               title
                               artist
                               price
```

The JOIN lets me retrieve information from both tables.

---

# 13. SQL Aliases

I learned that:

```sql
cart_items ci
```

means:

> Call `cart_items` `ci` for this query.

And:

```sql
products p
```

means:

> Call `products` `p`.

So:

```sql
ci.quantity
```

means:

```text
quantity from cart_items
```

and:

```sql
p.title
```

means:

```text
title from products
```

This makes larger SQL queries easier to read.

---

# 14. SUM and NULL

For the cart count:

```js
const result = await db.get(`
  SELECT SUM(quantity) AS totalItems
  FROM cart_items
  WHERE user_id = ?
`, [req.session.userId])
```

Then:

```js
res.json({
  totalItems: result.totalItems || 0
})
```

Why `|| 0`?

If the user has no cart items, `SUM()` can return `NULL`.

So:

```js
result.totalItems || 0
```

means:

> If there isn't a usable total, use 0.

---

# 15. Sessions

I learned Express sessions using:

```js
import session from 'express-session'
```

and:

```js
app.use(session({
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}))
```

The session allows the server to remember the user across requests.

After registration:

```js
req.session.userId = result.lastID
```

After login:

```js
req.session.userId = user.id
```

Now later requests can use:

```js
req.session.userId
```

to identify the logged-in user.

---

# 16. The Session Mental Model

Think of it like:

```text
User logs in
     ↓
Server verifies credentials
     ↓
Server stores:
req.session.userId = user.id
     ↓
Browser keeps session cookie
     ↓
Future requests include the session
     ↓
Server can access:
req.session.userId
```

The frontend does not need to keep sending:

```json
{
  "userId": 17
}
```

for every authenticated operation.

The server already knows who the session belongs to.

---

# 17. Authentication

Registration:

```text
name
email
username
password
      ↓
validate
      ↓
check existing user
      ↓
hash password
      ↓
INSERT user
      ↓
req.session.userId = result.lastID
```

Login:

```text
username
password
      ↓
find user
      ↓
bcrypt.compare()
      ↓
password correct?
      ↓
req.session.userId = user.id
```

Logout:

```js
req.session.destroy(() => {
  res.json({ message: 'Logged out' })
})
```

---

# 18. Password Hashing with bcrypt

I learned that passwords should not be stored directly.

Bad:

```js
password
```

Good:

```js
const hashed = await bcrypt.hash(password, 10)
```

Then store:

```js
hashed
```

During login:

```js
const isValid = await bcrypt.compare(
  password,
  user.password
)
```

Important:

> I do not decrypt the password hash.

I compare the submitted password against the stored hash.

---

# 19. Registration Validation

I learned to validate:

### Required fields

```js
if (!name || !email || !username || !password) {
  return res.status(400).json({
    error: 'All fields are required.'
  })
}
```

### Trim input

```js
name = name.trim()
email = email.trim()
username = username.trim()
```

### Username validation

```js
/^[a-zA-Z0-9_-]{1,20}$/
```

### Email validation

```js
validator.isEmail(email)
```

### Check for duplicate username/email

```js
const existing = await db.get(
  'SELECT id FROM users WHERE email = ? OR username = ?',
  [email, username]
)
```

---

# 20. Login Mistakes I Made

One mistake was trying to do:

```js
if (req.session.userId = user.id)
```

That is assignment, not comparison.

`=` means:

```text
assign
```

`===` means:

```text
compare
```

But in this case I didn't need an `if` at all.

Correct:

```js
req.session.userId = user.id

res.status(200).json({
  message: 'Logged in'
})
```

Once login has been validated, simply assign the ID and continue.

---

# 21. Middleware

I learned that middleware can check something before allowing the request to continue.

Example:

```js
export function requireAuth(req, res, next) {

  if (!req.session.userId) {
    console.log('Access blocked')

    return res.status(401).json({
      error: 'Unauthorized'
    })
  }

  next()
}
```

Mental model:

```text
Request
   ↓
requireAuth
   ↓
Logged in?
  /    \
NO      YES
↓        ↓
401     next()
         ↓
      controller
```

---

# 22. `next()`

`next()` means:

> The current middleware has finished. Continue to the next middleware/handler.

Example:

```js
router.get('/cart', requireAuth, getAll)
```

Flow:

```text
GET /cart
   ↓
requireAuth
   ↓
next()
   ↓
getAll
```

If authentication fails:

```js
return res.status(401).json(...)
```

and `next()` is never called.

---

# 23. Middleware Functions Receive `req`, `res`, `next`

I learned why middleware is written like:

```js
function requireAuth(req, res, next) {
```

`req`:

> Information about the incoming request.

`res`:

> Used to send the response.

`next`:

> Pass control forward.

---

# 24. `GET` vs `POST`

I learned that the HTTP method communicates the purpose of the request.

Examples:

```text
GET    → retrieve data
POST   → create/send data
DELETE → delete data
PUT/PATCH → update data
```

Logout can be implemented with GET in a simple course application, but in a more deliberate API design, state-changing actions are commonly handled with POST/DELETE depending on the API design.

The important thing is understanding that the method describes the operation.

---

# 25. Cart System

I built a cart system.

### Add to cart

First get:

```js
const productId = parseInt(req.body.productId, 10)
const userId = req.session.userId
```

Then check whether the product already exists in that user's cart:

```js
const existing = await db.get(
  'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
  [userId, productId]
)
```

If it exists:

```js
await db.run(
  'UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?',
  [existing.id]
)
```

Otherwise:

```js
await db.run(
  `INSERT INTO cart_items
   (user_id, product_id, quantity)
   VALUES (?, ?, 1)`,
  [userId, productId]
)
```

---

# 26. Cart Security

A very important lesson:

Never rely on the frontend to tell me which user owns something.

Instead of trusting:

```js
req.body.userId
```

use:

```js
req.session.userId
```

And when deleting:

```sql
DELETE FROM cart_items
WHERE id = ? AND user_id = ?
```

This protects against deleting another user's data.

---

# 27. Cart Deletion

Delete one specific cart row:

```js
const itemId = parseInt(req.params.itemId, 10)

await db.run(
  `DELETE FROM cart_items
   WHERE id = ? AND user_id = ?`,
  [itemId, req.session.userId]
)
```

Then:

```js
res.status(204).send()
```

---

# 28. Mistakes I Made During the Course

## Mistake 1 — Thinking same file means same scope

I tried to reference variables created inside another function.

Lesson:

> Same file does NOT mean same scope.

---

## Mistake 2 — Incorrect SQL UPDATE

I wrote things like:

```sql
UPDATE cart_items
SET quantity + 1
```

Correct:

```sql
UPDATE cart_items
SET quantity = quantity + 1
```

SQL needs the assignment:

```text
column = new value
```

---

## Mistake 3 — Incorrect WHERE clause

I wrote something like:

```sql
WHERE id = user_id
```

when I actually needed:

```sql
WHERE user_id = ? AND product_id = ?
```

Lesson:

> Read SQL literally. Make sure the columns and values represent exactly what I mean.

---

## Mistake 4 — Incomplete INSERT

I initially wrote:

```sql
INSERT INTO cart_items
```

without specifying the values.

Correct:

```sql
INSERT INTO cart_items
(user_id, product_id, quantity)
VALUES (?, ?, 1)
```

---

## Mistake 5 — Thinking `?` placeholders were optional decoration

They are parameter placeholders.

Example:

```sql
WHERE id = ?
```

and:

```js
[userId]
```

provides the value.

---

## Mistake 6 — Using `db.all()` for DELETE

Wrong:

```js
db.all(`DELETE ...`)
```

Correct:

```js
db.run(`DELETE ...`)
```

Remember:

```text
get → one row
all → multiple rows
run → INSERT / UPDATE / DELETE
```

---

## Mistake 7 — Writing `DELETE * FROM`

I initially wrote:

```sql
DELETE * FROM cart_items
```

Correct:

```sql
DELETE FROM cart_items
```

`*` is used with SELECT.

---

## Mistake 8 — Forgetting to return an error response

I learned to use:

```js
return res.status(400).json(...)
```

instead of just:

```js
res.status(400).json(...)
```

when the function must stop there.

---

## Mistake 9 — Confusing assignment and comparison

```js
=
```

assignment.

```js
===
```

strict comparison.

---

## Mistake 10 — Trying to use `if` when nothing needed checking

I wrote:

```js
if (req.session.userId = user.id) {
  return res.status(200).json(...)
}
```

The `if` was unnecessary.

Correct:

```js
req.session.userId = user.id

return res.status(200).json({
  message: 'Logged in'
})
```

---

## Mistake 11 — Forgetting where request data comes from

I had to learn the difference between:

```js
req.body
req.params
req.query
req.session
```

This is one of the most important Express concepts.

---

## Mistake 12 — Not immediately understanding JOIN

I initially found:

```sql
JOIN products p
ON p.id = ci.product_id
```

confusing.

The important idea is:

```text
cart_items.product_id
        ↓
products.id
```

The JOIN connects the related rows so I can get product details alongside cart details.

---

# 29. Common Beginner JavaScript Mistakes to Remember

## `=` vs `===`

```js
x = 5      // assignment
x === 5    // comparison
```

---

## Calling a function too early

Wrong:

```js
button.addEventListener('click', login())
```

Correct:

```js
button.addEventListener('click', login)
```

---

## Forgetting await

Wrong:

```js
const user = db.get(...)
```

Usually:

```js
const user = await db.get(...)
```

---

## Accessing properties on undefined

Danger:

```js
console.log(user.name)
```

if `user` doesn't exist.

Safer flow:

```js
if (!user) {
  return ...
}

console.log(user.name)
```

---

# 30. Common Frontend Mistakes

## Forgetting `.value`

```js
const input = document.querySelector('#username')
```

gets the element.

```js
const username = input.value
```

gets what the user typed.

---

## Forgetting `preventDefault()`

For forms:

```js
form.addEventListener('submit', (event) => {
  event.preventDefault()
})
```

This prevents the browser's default form submission.

---

## Forgetting `await response.json()`

```js
const response = await fetch('/api/products')

const data = await response.json()
```

`response` is the HTTP response object.

`data` is the parsed JSON body.

---

## Assuming fetch throws for HTTP errors

A response such as 401 or 500 does not automatically mean `fetch()` throws.

Check:

```js
if (!response.ok) {
  // handle HTTP error
}
```

---

# 31. The Full Authentication Flow

## Register

```text
POST /api/auth/register
        ↓
req.body
        ↓
validate fields
        ↓
trim input
        ↓
validate username
        ↓
validate email
        ↓
check duplicate user
        ↓
bcrypt.hash()
        ↓
INSERT user
        ↓
result.lastID
        ↓
req.session.userId = result.lastID
        ↓
201 response
```

---

## Login

```text
POST /api/auth/login
        ↓
req.body
        ↓
validate fields
        ↓
find user by username
        ↓
bcrypt.compare()
        ↓
valid?
   /         \
 no           yes
 ↓             ↓
401       req.session.userId
              ↓
             200
```

---

## Get current user

```text
GET /api/auth/current-user
        ↓
req.session.userId
        ↓
exists?
   /       \
 no         yes
 ↓           ↓
logged out   SELECT name
             ↓
          logged in
```

---

## Logout

```text
GET/POST /api/auth/logout
        ↓
req.session.destroy()
        ↓
response
```

---

# 32. The Full Cart Flow

## Add

```text
productId
   ↓
req.body.productId
   ↓
session userId
   ↓
check cart_items
   ↓
exists?
 /     \
yes     no
 ↓       ↓
UPDATE  INSERT
   \     /
    response
```

---

## Count

```text
session userId
      ↓
SUM(quantity)
      ↓
totalItems
      ↓
JSON
```

---

## Get cart

```text
session userId
      ↓
cart_items
      ↓
JOIN products
      ↓
cart + product information
      ↓
JSON { items: [...] }
```

---

## Delete

```text
itemId from req.params
      ↓
session userId
      ↓
DELETE WHERE id = ? AND user_id = ?
      ↓
204
```

---

# 33. Security Lessons

I should never assume the frontend is trustworthy.

The backend must validate and authorize operations.

Important rules:

```text
Validate input
↓
Authenticate user
↓
Authorize access to the resource
↓
Use parameterized SQL
↓
Hash passwords
↓
Do not trust client-supplied user IDs
```

Especially:

```js
req.session.userId
```

is more trustworthy for identifying the logged-in user than:

```js
req.body.userId
```

---

# 34. Things I Should NEVER Forget

### JavaScript

```text
Scope matters.
=
assignment.
===
comparison.
return stops the function.
await gets the asynchronous result.
```

### Express

```text
req.body   → body
req.params → URL parameters
req.query  → query string
req.session → session data

next() → continue middleware chain
return res... → respond and stop
```

### Database

```text
db.get() → one row
db.all() → multiple rows
db.run() → INSERT / UPDATE / DELETE

? → SQL parameter placeholder
```

### SQL

```text
SELECT → retrieve
INSERT → create
UPDATE → modify
DELETE → remove

Always think carefully about WHERE.
```

### Authentication

```text
bcrypt.hash() → registration
bcrypt.compare() → login
req.session.userId → identify logged-in user
req.session.destroy() → logout
```

### Security

```text
Never trust the frontend.
Never store plaintext passwords.
Always validate input.
Always restrict database operations to the authenticated user.
```

---

# 35. My Biggest Mental Upgrade

Before this course, I mostly thought about code as individual lines.

Now I should think about **systems**.

For example:

```js
req.session.userId
```

isn't just a random property.

It connects:

```text
LOGIN
  ↓
SESSION
  ↓
CURRENT USER
  ↓
CART
  ↓
DATABASE QUERIES
  ↓
AUTHORIZATION
```

Likewise:

```js
req.body.productId
```

connects:

```text
FRONTEND BUTTON
  ↓
FETCH REQUEST
  ↓
req.body
  ↓
CONTROLLER
  ↓
DATABASE
  ↓
CART
```

This is the real foundation of backend development.

---

# 36. What I Built

During this course I worked through:

- Express application setup
- Express middleware
- Static files
- JSON request parsing
- Express routers
- Controllers
- Query parameters
- SQLite
- Database tables
- SQL CRUD
- Parameterized queries
- SQL JOINs
- Aggregate queries with SUM
- User registration
- Input validation
- Email validation
- Username validation
- Password hashing
- bcrypt
- User login
- Sessions
- Current-user authentication
- Logout
- Authentication middleware
- Protected routes
- Shopping cart creation
- Cart quantities
- Cart counts
- Cart retrieval
- Cart deletion
- User-specific database operations

---

# 37. The Most Important Lesson

I don't need to know every piece of Express from memory.

I need to be able to reason through:

```text
What request came in?
        ↓
Where is the data?
        ↓
What user is making the request?
        ↓
What does the database need?
        ↓
What SQL operation should happen?
        ↓
What should happen if it fails?
        ↓
What should I send back?
```

If I can answer those questions, I can usually figure out the code.

---

# 38. Milestone

## First Full-Stack Express Application

I finished my Full-Stack Express course and built my first Express application.

This course taught me more than Express syntax.

It taught me how the pieces of a full-stack application communicate:

```text
Frontend
   ↕
HTTP
   ↕
Express
   ↕
Controllers
   ↕
Sessions / Authentication
   ↕
Database
```

This is the foundation I'm going to build on as I continue learning backend and full-stack development.

---

# Quick Reference

```text
REQUEST
────────────────────────────────────

req.body
→ data sent in request body

req.params
→ values from /users/:id

req.query
→ values from ?search=hello

req.session
→ session data


EXPRESS
────────────────────────────────────

app.use(...)
→ middleware

router.get(...)
→ GET route

router.post(...)
→ POST route

router.delete(...)
→ DELETE route

next()
→ continue


RESPONSE
────────────────────────────────────

res.status(200)
→ set status

res.json(...)
→ send JSON

res.send(...)
→ send response

res.status(204).send()
→ successful response with no content


DATABASE
────────────────────────────────────

db.get()
→ one row

db.all()
→ multiple rows

db.run()
→ INSERT / UPDATE / DELETE


SQL
────────────────────────────────────

SELECT
INSERT
UPDATE
DELETE
JOIN
WHERE
SUM


AUTH
────────────────────────────────────

bcrypt.hash()
→ hash password

bcrypt.compare()
→ verify password

req.session.userId
→ logged-in user's ID

req.session.destroy()
→ destroy session


JAVASCRIPT
────────────────────────────────────

const / let
→ variables

=
→ assignment

===
→ comparison

return
→ stop/return from function

await
→ wait for Promise result

scope
→ determines where a variable exists
```

---

# Final Reminder

**Don't just memorize the solutions from the course.**

When I get stuck, first ask:

1. What am I trying to accomplish?
2. What information do I already have?
3. Where is the information I need?
4. Is it in `req.body`, `req.params`, `req.query`, `req.session`, or the database?
5. Do I need one database row or many?
6. Am I reading data or changing data?
7. What should happen if the operation fails?
8. Who is allowed to perform this operation?
9. What response should the frontend receive?

If I can answer those, the code becomes much easier to write.
