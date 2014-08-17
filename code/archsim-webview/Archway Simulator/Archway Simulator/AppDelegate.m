//
//  AppDelegate.m
//  Archway Simulator
//
//  Created by Eric Miller on 7/20/14.
//  Copyright (c) 2014 Eric Miller. All rights reserved.
//

#import "AppDelegate.h"
#import <WebKit/WebKit.h>

@implementation AppDelegate


- (void) applicationDidFinishLaunching:(NSNotification *)aNotification {
	WebPreferences *preferences = [self.webView preferences];
	if([preferences respondsToSelector:@selector(setWebGLEnabled:)]){
		[preferences performSelector:@selector(setWebGLEnabled:) withObject:[NSNumber numberWithBool:YES]];
	}
	
    NSURLRequest *request = [NSURLRequest requestWithURL:
							 [NSURL URLWithString:@"http://archway.patternleaf.local/test.php"]];
    [self.webView.mainFrame loadRequest:request];
}

@end
