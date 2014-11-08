# Archway Project

Currently there are two things happening in this repo:

1. A Chrome App which displays a model of Luminescence including ~2000 LEDs and acts as an [OPC server](https://github.com/zestyping/openpixelcontrol). Luminescence is an interactive installation at the Dairy Center in Boulder, CO. It will be opening in November 2014. This app has been used in the development of the installation. There aren't really any plans to improve upon it. 
2. A more general-purpose WebGL OPC Server app which will be able to load a model, an OPC pixel layout, and save and restore camera states. Eventually I'd like to see this become a test/development environment for OPC-powered installations, if not an authoring environment.

The first app is in /code/chrome-opc-server while the second app is in /code/archway. Which is weird, considering the second is general purpose and the first is project-specific, but oh well. :) I think the general-purpose OPC app will be called "Archway". Maybe.

## Other Stuff

There's also a bunch of Luminescence-specific stuff in here: server configuration, design docs, utility scripts, and so on.

## Useful or potentially useful links

- **Fadecandy**: https://github.com/scanlime/fadecandy/
- **OpenPixelControl**: https://github.com/zestyping/openpixelcontrol
- **FC WebSocket protocol**: https://github.com/scanlime/fadecandy/blob/master/doc/fc_protocol_websocket.md
- **0MQ**: http://zeromq.org
- **Fadecandy Google Group**: https://groups.google.com/forum/#!forum/fadecandy
- **Cinder-Friendly FadeCandy Client**: https://github.com/jhurlbut/FadeCandyCinderClient