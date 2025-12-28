Hikar Webapp
============

### What is this?

*Hikar* is a web-based augmented reality application (a port of a [native Android version](https://gitlab.com/nickw1/hikar)) which aims to help you navigate while out walking. It will display the routes of footpaths and trails from [OpenStreetMap](https://openstreetmap.org) superimposed on the device's camera feed in addition to displaying virtual signposts showing the route and distance to nearby POIs.

The paths are not taken directly from the OpenStreetMap server, but from a local [OSM PostGIS database populated with osm2pgsql](https://wiki.openstreetmap.org/wiki/PostGIS/Installation).

Available as a working app at [https://hikar.org/webapp](https://hikar.org/webapp). Only works in Europe and the Asian parts of Turkey, due to the constraints of the server used. (The Geofabrik Europe extract was used to populate the database, which covers this area).

Please note that this publicly-available app is an *older* version which doesn't support iOS, and is based off the traditional location-based API of AR.js together with A-Frame. The source code for this version can be found in the [master branch](https://github.com/nickw1/hikar.js/tree/master).

Also available, a video [here](https://hikar.org/video/hikarweb.mp4) of this older version. This shows what can be done at the moment, including AR overlay of OpenStreetMap ways and virtual signposts - and also shows some of the limitations (e.g. the augmented overlay doesn't precisely fit the real world).


### New version using LocAR.js and RDK

However, Hikar is being rewritten to use [LocAR.js](https://github.com/AR-js-org/locar.js) and [RDK](https://github.com/omnidotdev/rdk). This can be found in the `locar` branch, which has been made the default branch as it is currently being actively worked on, unlike the old version which will almost certainly see no further work other than critical bugfixes.

Amongst other things this will allow Hikar to support iOS and will also allow it to incorporate the latest features of LocAR.js and RDK, both of which are actively being developed.

Currently however it is very early in development, if you want a working version please checkout the old version or access the hosted version of it [here](https://hikar.org/webapp). However note that this version is no longer actively maintained.

### Build

Please use `pnpm` rather than `npm` to build the new version.

To work locally, as stated above, Hikar (both the new version and the old) assume an [OSM PostGIS database populated with osm2pgsql](https://wiki.openstreetmap.org/wiki/PostGIS/Installation).
