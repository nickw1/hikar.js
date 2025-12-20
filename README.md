Hikar Webapp
============

### What is this?

*Hikar* is a web-based augmented reality application (a port of a [native Android version](https://gitlab.com/nickw1/hikar)) which aims to help you navigate while out walking. It will display the routes of footpaths and trails superimposed on the device's camera feed in addition to displaying virtual signposts showing the route and distance to nearby POIs.

Only available in Europe and the Asian parts of Turkey, due to the constraints of the server used. (The Geofabrik Europe extract was used to populate the database, which covers this area).

Available at [https://hikar.org/webapp](https://hikar.org/webapp).

Also available, a video [here](https://hikar.org/video/hikarweb.mp4) of the old version.

Please note that this is an *old* version which doesn't support iOS, and is based off the location-based part of AR.js and A-Frame. The source code for this version can be found in the [master branch](https://github.com/nickw1/hikar.js/tree/master).

### New version using LocAR.js and RDK

However, Hikar is being rewritten to use [LocAR.js](https://github.com/AR-js-org/locar.js) and [RDK](https://github.com/omnidotdev/rdk). This can be found in the `locar` branch, which has been made the default branch as it is currently being worked on.

Amongst other things this will allow Hikar to support iOS and will also allow it to incorporate the latest features of LocAR.js and RDK, both of which are actively being developed.

Currently however it is very early in development, if you want a working version please use the old one or access the hosted version [here](https://hikar.org/webapp). However note the old version is no longer actively maintained.

### Build

Please use `pnpm` rather than `npm` to build the new version.

To work locally, Hikar (both the new version and the old) assume an [OSM PostGIS database populated with osm2pgsql](https://wiki.openstreetmap.org/wiki/PostGIS/Installation).
