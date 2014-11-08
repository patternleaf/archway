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

n_pixels = 2280
fps = 30


start_time = time.time()
while True:
    t = time.time() - start_time
    pixels = []
    for ii in range(n_pixels):
        #offset = math.fabs(math.cos(t * 2)) * 60
        offset = 60
        level = math.floor(((ii % offset) / offset) * 256)
        if (math.floor(ii / 60) % 2 == 0) : 
            pixels.append((256, 127, 127))
        else:
            pixels.append((127, 127, 256))
    client.put_pixels(pixels, channel=0)
    time.sleep(1 / fps)

