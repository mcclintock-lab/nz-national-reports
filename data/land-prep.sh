#!/bin/bash

  # Import
  shp2pgsql -D -s 4326 src/coastline.shp land | psql

  # Create spatial index
  psql -t <<SQL
  CREATE INDEX ON land USING gist(geom);
SQL

  # Subdivide into new table
  psql -f ./land-subdivide.sql
