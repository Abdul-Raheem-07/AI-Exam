# Production Deployment

## Backend

Use a PHP 8.2+ Laravel-compatible service such as Laravel Forge, a managed VPS, or a PHP App Service. The backend document root must point to `server/public`.

1. Deploy the repository and set the working directory to `server`.
2. Run `composer install --no-dev --optimize-autoloader`.
3. Create `.env` from `server/.env.example`.
4. Set `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY`, production `APP_URL`, MySQL credentials, `GEMINI_API_KEY`, and the deployed frontend in `CORS_ALLOWED_ORIGINS`.
5. Run:

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

6. Run a separate persistent worker:

```bash
php artisan queue:work --tries=3 --timeout=120
```

Configure the host process manager to restart the worker after failure and deploys. The database queue requires the migrated `jobs` and `failed_jobs` tables.

## Frontend

Deploy `client/` as a Vite project.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://api.example.com/api`

Do not put `GEMINI_API_KEY`, MySQL credentials, or Laravel secrets in Vercel variables.

## MySQL

Create a production MySQL database and set:

```env
DB_CONNECTION=mysql
DB_HOST=your-host
DB_PORT=3306
DB_DATABASE=ai_exam
DB_USERNAME=your-user
DB_PASSWORD=your-password
```

Run migrations only from the backend release environment with `php artisan migrate --force`.

## Storage and uploads

Answer-sheet files are stored on Laravel's private local disk and are not exposed through a public storage symlink. Use a persistent encrypted disk or replace the disk implementation with private object storage for multi-instance production deployments.

Accepted answer files are JPG, JPEG, PNG, and PDF, up to 20 MB each, with a maximum of 10 files per submission.

## CORS and Sanctum

This application uses Sanctum personal-access-token authentication. The React app sends the returned bearer token in the `Authorization` header. Set `CORS_ALLOWED_ORIGINS` to the exact frontend origins, comma-separated. Never use `*` with credentials.

## Health check

`GET /api/health` returns the API health response. Verify it after deployment before testing authenticated flows.
