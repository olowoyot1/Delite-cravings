# Delite Cravings

## Version 2 cloud upgrade

The app now supports:
- Cloud persistence across phones, tablets and computers
- Daily sales and stock records stored centrally
- Debtor/customer register
- Credit sales
- Customer payments
- Customer ledger with running balance
- Outstanding debtor summary
- Existing browser data migration to the cloud

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run the complete contents of supabase.sql.
3. In Supabase Project Settings → API, copy the Project URL and service-role key.
4. In Vercel, open the Delite Cravings project and add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the Production environment. Add them to Preview/Development too if required.
5. Redeploy the project.

Never put the service-role key in browser JavaScript or commit it to GitHub.

## First-run migration

1. Open the new app on the device that currently contains the old Delite Cravings records.
2. Log in with the existing Delite Cravings username/PIN.
3. Leave the app open briefly until the status shows Cloud saved.
4. Open the same URL on another device and log in with the same username/PIN.
5. Products, daily sales and debtor records should load from the cloud.

If the cloud database is empty, the first authenticated device seeds it with its existing local records.

## Credit & Debtors

Use the Credit & Debtors button to:
- Add customers/debtors
- Record credit sales
- Record customer payments
- View outstanding balances
- Open an individual customer ledger

Credit sales support product, quantity, selling price, amount paid, due date and notes.

## Architecture

Browser UI → Vercel /api/cloud → Supabase PostgreSQL

The service-role credential is used only inside the Vercel serverless function. The browser never receives it.

## Runtime

The project is pinned to Node.js 24.x for current Vercel deployments.