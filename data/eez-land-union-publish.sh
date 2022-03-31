source ../../gp-workspace/.env

# Publish to s3.  Defaults to dry-run, remove to actually publish
AWS_REGION=${AWS_REGION} npx geoprocessing bundle-features ${DATASET_S3_BUCKET}-eez-land-union eez_land_union_final \
   --connection "postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}" \
   --points-limit 60000
   # --envelope-max-distance 200