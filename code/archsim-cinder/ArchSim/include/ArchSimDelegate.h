
#include "cinder/app/CinderView.h"
#include "ArchSimApp.h"
#import <Cocoa/Cocoa.h>

@interface ArchSimDelegate : NSObject <NSApplicationDelegate>
{
	IBOutlet CinderView		*cinderView;
	IBOutlet NSWindow		*window;
	IBOutlet NSColorWell	*colorWell;
	
	ArchSimApp		*mApp;
}

@property (assign) IBOutlet NSWindow *window;

- (IBAction)subdivisionSliderChanged:(id)sender;
- (IBAction)colorChanged:(id)sender;

@end
