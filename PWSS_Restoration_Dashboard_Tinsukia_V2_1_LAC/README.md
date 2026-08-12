# PWSS Restoration War Room — V2

## Technology
HTML + CSS + JavaScript, Chart.js and Papa Parse.

## Monitoring universe
The dashboard filters the source data to:
- Column O / JJM Brain Work Status = `HANDED_OVER`
- Column Q / Field Operational Status = `Non Operative` or `Partially Operative`

## V2 improvements
- Government-style command-centre layout
- Persistent global filters for Sub-Division, SO and Field Status
- Executive War Room with action queue
- Restoration pipeline and exception register
- Dedicated SO Name-wise accountability page with drill-down
- Sub-Division comparison
- LAC Report based on Column D / New LAC [ After De-limitation ]
- Responsibility / Agency analysis
- Searchable Action Register with CSV export
- Data Quality and reconciliation checks
- Print-ready Reports page
- Live published Google Sheet CSV + local CSV fallback

## Run
### Simplest
Open `index.html` in a browser.

### Recommended
Use VS Code + Live Server and open `index.html`.

### GitHub Pages
Upload the complete folder structure to a repository and enable GitHub Pages.

## Live data
The Google Sheets published CSV URL is configured in `js/app.js`.
If live fetching fails, `data/pwss.csv` is used as a local snapshot.

## Next suggested V3
- Target / projected completion date
- Days pending and ageing buckets
- Priority engine (Critical / High / Moderate / Monitoring)
- Scheme-level detail modal
- PDF generation
- user roles and write-back database
- audit trail
