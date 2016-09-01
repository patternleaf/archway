from __future__ import division
import time
import math
import sys

import opc
#import color_utils

# light-opc-range --start <opc-address> --end <opc-address> [--blip] [--color r:ubyte g:ubyte b:ubyte]

#-------------------------------------------------------------------------------
# handle command line

#IP_PORT = '10.0.2.2:7890'
IP_PORT = '127.0.0.1:7890'
start_pixel = 1080
end_pixel = 1200
should_blip = False
color = (256, 256, 256)

for i, arg in enumerate(sys.argv):
    if ':' in arg:
        IP_PORT = arg
    if '--start' in arg:
        start_pixel = int(sys.argv[i + 1])
    if '--end' in arg:
        end_pixel = int(sys.argv[i + 1])
    if '--blip' in arg:
        should_blip = True
    if '--color' in arg:
        r = int(sys.argv[i + 1])
        g = int(sys.argv[i + 2])
        b = int(sys.argv[i + 3])
        color = (r, g, b)


#-------------------------------------------------------------------------------
# connect to server

client = opc.Client(IP_PORT)
if client.can_connect():
    print '    connected to %s' % IP_PORT
else:
    # can't connect, but keep running in case the server appears later
    print '    WARNING: could not connect to %s' % IP_PORT
print


#-------------------------------------------------------------------------------
# send pixels

print '    sending pixels forever (control-c to exit)...'
print

def opcAddressToPhysicalAddress(opcAddress):
    return opcAddress
    # physicalAddress = 0
    # stripN = math.floor(opcAddress / 60);
    # lightIndexOnStrip = opcAddress - (stripN * 60);
    # if (stripN % 2 == 0) :
    #     # if floor(i / 60) is even, the strip address is physically reversed
    #     physicalAddress = (stripN * 60) + (60 - (lightIndexOnStrip % 60)) - 1
    #
    # return physicalAddress


fps = 30
blip_time = 5
last_blip_start = 0
n_blip_pixels = end_pixel - start_pixel
n_total_pixels = 2280

start_time = time.time()
while True:
    t = time.time() - start_time
    
    blip_loc = math.floor((t - last_blip_start) / blip_time * n_blip_pixels) + start_pixel
    blip_range_start = max(blip_loc - 5, 0)
    blip_range_end = min(blip_loc + 5, n_total_pixels - 1)
    
    #for ii in range(n_pixels):
    #    print '%d : %d' % (ii, opcAddressToPhysicalAddress(ii))
    
    # black all
    opcPixels = [(0, 0, 0)] * n_total_pixels
    # print(blip_range_start + " " + blip_range_end)
    
    for ii in range(n_total_pixels):
        if should_blip:
            if (ii > blip_range_start and ii < blip_range_end) :
                opcPixels[ii] = color
        else:
            if (ii >= start_pixel and ii <= end_pixel) :
                opcPixels[ii] = color;

    client.put_pixels(opcPixels, channel=0)
    
    if (t > last_blip_start + blip_time) :
        last_blip_start = t
    
    time.sleep(1 / fps)
