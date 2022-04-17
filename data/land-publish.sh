source ../.env
source ./_config.sh

# Publish to s3.  Defaults to dry-run, remove to actually publish
AWS_REGION=${AWS_REGION} npx geoprocessing bundle-features gp-nz-national-reports-datasets-land land_subdivided \
   --connection "postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}" \
   --points-limit 4500 \
   --envelope-max-distance 200
   #--dry-run