# Umoja P.A.G Church Website & Admin Dashboard

A church website with a public registration form and a password-protected admin
dashboard for managing registrations, built with plain PHP, MySQL, and vanilla
JavaScript. Runs locally on Laragon.

## Features

- **Public site** — church info, ministries, gallery, and an online registration
  form (with QR code sharing)
- **Admin dashboard** — sign in, view/search/filter registrations, update status,
  delete entries, view stats, and export data to CSV
- **JWT-based auth** — protects all admin API endpoints

## Tech Stack

- **Backend:** PHP 8.3 (PDO + MySQL), JWT for auth
- **Frontend:** Vanilla HTML/CSS/JS (no framework/build step)
- **Database:** MySQL (via Laragon)
- **Local server:** Laragon (Apache + PHP + MySQL)

## Project Structure

```
Umoja/
├── api/
│   ├── auth/
│   │   └── login.php              # POST — admin login, returns JWT
│   ├── admin/
│   │   ├── registrations.php      # GET  — list/search/filter registrations
│   │   ├── stats.php              # GET  — dashboard totals & breakdowns
│   │   ├── registration_status.php# PATCH — update a registration's status
│   │   ├── registration_delete.php# DELETE — remove a registration
│   │   └── export.php             # GET  — download all registrations as CSV
│   └── register.php               # POST — public registration form submission
├── images/                        # Site images
├── admin.html / admin.css / admin.js   # Admin dashboard
├── index.html / index.css / index.js   # Public site
├── db.php                         # Shared PDO database connection
├── jwt.php                        # JWT encode/decode + auth helper
└── .htaccess                      # URL rewriting for clean API routes
```

## Setup (Local Development with Laragon)

1. **Clone the repo into Laragon's www folder:**
   ```
   cd C:/laragon/www
   git clone https://github.com/smiling-cmd/umoja-pag-website.git Umoja
   ```

2. **Create the database.** In HeidiSQL (bundled with Laragon), create a database
   named `umoja_church`, then create the `registrations` table:
   ```sql
   CREATE TABLE registrations (
     id INT AUTO_INCREMENT PRIMARY KEY,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     email VARCHAR(150) NULL,
     phone VARCHAR(30) NOT NULL,
     area VARCHAR(100) NOT NULL,
     reg_for VARCHAR(100) NOT NULL,
     age_group VARCHAR(50) NOT NULL,
     notes TEXT NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'pending',
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Check `db.php`** — default Laragon credentials (`root` / no password) are
   already set. Update `$DB_HOST`, `$DB_NAME`, `$DB_USER`, `$DB_PASS` if yours differ.

4. **Start Laragon**, then visit:
   - Public site: `http://umoja.test/index.html`
   - Admin dashboard: `http://umoja.test/admin.html`

## API Reference

| Method | Endpoint                                   | Auth | Description                          |
|--------|---------------------------------------------|------|---------------------------------------|
| POST   | `/api/auth/login`                           | No   | Admin login, returns JWT              |
| POST   | `/api/register`                             | No   | Public registration form submission   |
| GET    | `/api/admin/registrations`                  | Yes  | List/search/filter registrations      |
| GET    | `/api/admin/stats`                          | Yes  | Dashboard totals & ministry/area stats|
| PATCH  | `/api/admin/registrations/{id}/status`      | Yes  | Update a registration's status        |
| DELETE | `/api/admin/registrations/{id}`             | Yes  | Delete a registration                 |
| GET    | `/api/admin/export`                         | Yes  | Download all registrations as CSV     |

Authenticated requests must include:
```
Authorization: Bearer <token>
```

## Status Values

`pending` · `contacted` · `active` · `inactive`

## Notes for Future Deployment

When moving to a live host (e.g. Hostafrica), update the four connection
variables at the top of `db.php` to match the production database credentials.
No other code changes should be required.

## Development Workflow

Edit files directly inside `C:\laragon\www\Umoja` (open this folder in VS Code).
Laragon serves it live — no separate copy/deploy step needed. Commit and push
from this same folder:

```
git add -A
git commit -m "Describe your change"
git push
```
