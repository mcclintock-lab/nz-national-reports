#!/bin/bash

psql -t <<SQL
  DROP TABLE habitat;
  DROP TABLE habitat_final;
  DROP TABLE habitat_final_bundles;
SQL

# Import, keeping column name casing intact, and setting the SRID field to 4326
shp2pgsql -D -k -s 4326 dist/SCC_GF75_250m_merged.shp habitat | psql

# Create spatial index
psql -t <<SQL
  CREATE INDEX ON habitat USING gist(geom);
SQL

# Subdivide into new table land_subdivided
psql -f scc-subdivide.sql
