from __future__ import division
import time
import math
import sys

import opc
#import color_utils


#-------------------------------------------------------------------------------
# handle command line

if len(sys.argv) == 1:
    IP_PORT = '127.0.0.1:7890'
elif len(sys.argv) == 2 and ':' in sys.argv[1] and not sys.argv[1].startswith('-'):
    IP_PORT = sys.argv[1]
else:
    print
    print '    Usage: raver_plaid.py [ip:port]'
    print
    print '    If not set, ip:port defauls to 127.0.0.1:7890'
    print
    sys.exit(0)


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


n_pixels = 2280
fps = 30
blip_time = 30
last_blip_start = 0

start_time = time.time()
while True:
    t = time.time() - start_time
    
    blip_loc = math.floor((t - last_blip_start) / blip_time * n_pixels)
    blip_start = max(blip_loc - 5, 0)
    blip_end = min(blip_loc + 5, n_pixels - 1)
    
    #for ii in range(n_pixels):
    #    print '%d : %d' % (ii, opcAddressToPhysicalAddress(ii))
    
    opcPixels = [(0, 0, 0)]*n_pixels
    for ii in range(n_pixels):
        if (ii > blip_start and ii < blip_end) :
            opcPixels[ii] = (256, 127, 127);
        else :
            opcPixels[ii] = (0, 0, 0);
            #opcPixels.append((256, 127, 127))
        #else :
            #opcPixels.append((0, 0, 0))

    client.put_pixels(opcPixels, channel=0)
    
    if (t > last_blip_start + blip_time) :
        last_blip_start = t
    
    time.sleep(1 / fps)

