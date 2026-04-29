require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bq = new BigQuery({ keyFilename: './service-account.json', projectId: 'data-proj-470202' });

// Try view_high_csat_details instead
const query = `
  SELECT *
  FROM \`data-proj-470202.ds_growth_culture.view_high_csat_details\`
  LIMIT 3
`;

bq.query({ query, location: 'US' })
  .then(([rows]) => {
    if (rows.length > 0) {
      console.log('=== view_high_csat_details 컬럼 ===', Object.keys(rows[0]));
      console.log('첫번째 행:', JSON.stringify(rows[0], null, 2));
    } else {
      console.log('데이터 없음');
    }
  })
  .catch(e => {
    console.error('view_high_csat_details 오류:', e.message);
    // Try csat_raw_staging
    const q2 = `SELECT * FROM \`data-proj-470202.ds_growth_culture.csat_raw_staging\` LIMIT 2`;
    return bq.query({ query: q2, location: 'US' }).then(([r2]) => {
      if (r2.length > 0) {
        console.log('csat_raw_staging 컬럼:', Object.keys(r2[0]));
        console.log('첫번째:', JSON.stringify(r2[0], null, 2));
      }
    }).catch(e2 => console.error('csat_raw_staging 오류:', e2.message));
  });
