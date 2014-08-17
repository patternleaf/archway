#include "cinder/Cinder.h"
#include "cinder/Rand.h"
#import "ArchSimDelegate.h"

@implementation ArchSimDelegate

@synthesize window;

- (void)dealloc
{
    [super dealloc];
}
	
- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
	mApp = new ArchSimApp;
	mApp->prepareLaunch();
	mApp->setupCinderView( cinderView, cinder::app::RendererGl::create() );
	mApp->launch();

	[window setAcceptsMouseMovedEvents:YES];
	
	colorWell.color = [NSColor colorWithCalibratedRed:mApp->mColor.r green:mApp->mColor.g blue:mApp->mColor.b alpha:1.0f]; 
}

- (IBAction)subdivisionSliderChanged:(id)sender
{
	mApp->mRadius = [sender intValue];
}

- (IBAction)colorChanged:(id)sender
{
	NSColor *color = [sender color];
	mApp->mColor = ci::Colorf( [color redComponent], [color greenComponent], [color blueComponent] );
}

@end
