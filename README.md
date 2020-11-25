# SRTM_Viewer
Viewer for NASA's Shuttle Radar Topography Mission

https://www.youtube.com/watch?v=8g2tqN070OM&feature=youtu.be

#To Install,

Download this map: https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO1/data/bedrock/grid_registered/georeferenced_tiff/

Unzip

Move the map to: SRTM_Viewer/resources/app/components/planet/maps

rename the map to: ETOPO1_Bedrock_grid_registered_geotiff.tif

#To Run

click electron.exe | cd resources/app/ && npm run prod | cd resources/app/ && npm run dev




*note, I would include the entire tif file in source, however github permits me from uploading anything above 100mb. Take it up with Mr. Git.





Main resource for the project was '3D Engine Design for Virtual Globes', by Patrick Cozzi and Kevin Ring.



-Improvements that could be made...
  -convert to wgs84 ( chapter 2 )
  -handle LOD better at the poles ( chapter 4 )
