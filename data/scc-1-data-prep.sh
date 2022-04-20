#!/bin/bash
# Run in workspace

SRC_PATH=src
DST_PATH=dist

LAYER=SCC_GF75_250m_merged

rm dist/${LAYER}*

# gdal_translate -r nearest -of COG -stats "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
# # warp to 4326 first so that cuts are clean
gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_4326.tif"


# Split along antimeridian
# -projwin ulx uly lrx lry
# # left
gdal_translate -r nearest -of COG -stats -projwin 160.59 -25.5424051277679460 180 -56.0694036312742625 "${DST_PATH}/${LAYER}_4326.tif" "${DST_PATH}/${LAYER}_west180_cog.tif"
# #right
gdal_translate -r nearest -of COG -stats -projwin -180 -25.5424051277679460 -171.19 -56.0694036312742625 "${DST_PATH}/${LAYER}_4326.tif" "${DST_PATH}/${LAYER}_east180_cog.tif"
rm "${DST_PATH}/${LAYER}_4326.tif"

# VECTOR_LAYER=SCC_GF75_250m
# <xmin> <ymin> <xmax> <ymax>
# ogr2ogr -t_srs "EPSG:4326" "${DST_PATH}/${VECTOR_LAYER}_4326.shp" "${SRC_PATH}/${VECTOR_LAYER}.shp"
# ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DST_PATH}/${VECTOR_LAYER}_left.fgb" "${DST_PATH}/${VECTOR_LAYER}_4326.shp"

# Polygonize the split rasters
# gdal_polygonize.py dist/SCC_GF75_250m_merged_west180_cog.tif -f Flatgeobuf  dist/SCC_GF75_250m_merged_west180.fgb
gdal_polygonize.py dist/SCC_GF75_250m_merged_west180_cog.tif -f GeoJSON  dist/SCC_GF75_250m_merged_west180.json
# gdal_polygonize.py dist/SCC_GF75_250m_merged_east180_cog.tif -f Flatgeobuf  dist/SCC_GF75_250m_merged_east180.fgb
gdal_polygonize.py dist/SCC_GF75_250m_merged_east180_cog.tif -f GeoJSON  dist/SCC_GF75_250m_merged_east180.json

# Merge split features back into one JSON
ogrmerge.py -single -overwrite_ds -f GeoJSON -o dist/SCC_GF75_250m_merged.json dist/SCC_GF75_250m_merged_west180.json dist/SCC_GF75_250m_merged_east180.json
ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DST_PATH}/SCC_GF75_250m_merged.fgb" "${DST_PATH}/SCC_GF75_250m_merged.json"

# For subdivide
ogr2ogr -t_srs "EPSG:4326" -nlt POLYGON -explodecollections -dialect SQLite -sql "select DN, st_buffer(geom)" "dist/SCC_GF75_250m_merged.shp" "dist/SCC_GF75_250m_merged.fgb"

rm dist/SCC_GF75_250m_merged_west180*
rm dist/SCC_GF75_250m_merged_east180*