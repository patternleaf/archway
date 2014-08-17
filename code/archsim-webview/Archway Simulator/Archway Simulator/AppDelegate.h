//
//  AppDelegate.h
//  Archway Simulator
//
//  Created by Eric Miller on 7/20/14.
//  Copyright (c) 2014 Eric Miller. All rights reserved.
//

#import <Foundation/Foundation.h>

@class WebView;

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (weak) IBOutlet WebView *webView;
@property (assign) IBOutlet NSWindow *window;

@end
