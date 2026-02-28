# Database Migrations

This directory contains Sequelize CLI migrations.

## Usage

```bash
# Run pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create a new migration
npx sequelize-cli migration:generate --name migration-name
```

## Convention
- Migrations are run in order by timestamp prefix
- Each migration has `up` and `down` methods
- Never modify a migration that has been run in production
