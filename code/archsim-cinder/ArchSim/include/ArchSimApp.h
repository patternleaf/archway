#pragma once

#include "cinder/app/AppCocoaView.h"

class ArchSimApp : public cinder::app::AppCocoaView {
  public:
	void				setup();
	void				draw();

	float				mRadius;
	cinder::Colorf		mColor;
};
