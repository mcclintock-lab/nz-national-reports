#!/bin/bash

  SRC_PATH=src
  DST_PATH=dist
  LAYER=coastline
  declare -a ATTRIBS_TO_KEEP=(
  "OBJECTID"
)
  
  # For subdivide
  ogr2ogr -t_srs "EPSG:4326" -nlt POLYGON -explodecollections "${DST_PATH}/${LAYER}.shp" "${SRC_PATH}/${LAYER}.shp"

  psql -t <<SQL
  DROP TABLE land;
SQL

  # Import
  shp2pgsql -D -s 4326 "${DST_PATH}/coastline.shp" land | psql

  # Create spatial index
  psql -t <<SQL
  CREATE INDEX ON land USING gist(geom);
SQL

  # Subdivide into new table
  psql -f ./land-subdivide.sql
