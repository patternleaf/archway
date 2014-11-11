# Archway Project

![Rendering of Luminescence](https://raw.github.com/patternleaf/archway/assets/video-images/night-closeup.png)

Currently there are two things happening in this repo:

1. A Chrome App which displays a 3D model of the site-specific illuminated installation "Luminescence", including its ~2000 LEDs, and acts as an [OPC server](https://github.com/zestyping/openpixelcontrol) for visualization and testing. Luminescence is opening at the Dairy Center for the Arts in Boulder, CO in November 2014. This app has been used in the development of the installation. It's messy. There aren't really any plans to improve upon it.
2. A more general-purpose WebGL OPC Server app which will be able to load a model, an OPC pixel layout, and save and restore camera states. Eventually I'd like to see this become a test/development environment for OPC-powered installations, if not an authoring environment. It's being built with [Ember](https://github.com/ember).

The first app is in /code/chrome-opc-server while the second app is in /code/archway. Which is weird, considering the second is general purpose and the first is project-specific, but oh well. :) I think the general-purpose OPC app will be called "Archway". Maybe.

## Running

To run either app, fire up Chrome, go to the Preferences page, and show the Extensions tab. Click "Load Unpacked Extension" and point at the desired directory. If Archway moves along, perhaps it'll be available in the Chrome app store someday.

## Udder

Luminescence is being driven by partner project [udder](https://github.com/coil-lighting/udder), a flexible and lightweight OPC show renderer written in Java. I hope to integrate Archway with it: controls, a scripting environment ... who knows.

## Other Stuff

There's also a bunch of Luminescence-specific stuff in here: server configuration, design docs, utility scripts, and so on.

## Useful or potentially useful links

- **Fadecandy**: https://github.com/scanlime/fadecandy/
- **OpenPixelControl**: https://github.com/zestyping/openpixelcontrol
- **FC WebSocket protocol**: https://github.com/scanlime/fadecandy/blob/master/doc/fc_protocol_websocket.md
- **0MQ**: http://zeromq.org
- **Fadecandy Google Group**: https://groups.google.com/forum/#!forum/fadecandy
- **Cinder-Friendly FadeCandy Client**: https://github.com/jhurlbut/FadeCandyCinderClient