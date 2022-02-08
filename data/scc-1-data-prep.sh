#!/bin/bash
# Run in workspace

SRC_PATH=src
DST_PATH=dist

LAYER=SCC_GF75_250m_merged
# gdal_translate -r nearest -of COG -stats "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
# # warp to 4326 first so that cuts are clean
gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_4326.tif"

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


