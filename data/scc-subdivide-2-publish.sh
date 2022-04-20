source ../.env
source ./_config.sh

# Publish to s3.  Defaults to dry-run, remove to actually publish
AWS_REGION=us-west-1 npx geoprocessing bundle-features ${DATASET_S3_BUCKET}-habitat habitat_final \
   --connection "postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}" \
   --points-limit 10000 \
   --envelope-max-distance 200
   # --dry-run