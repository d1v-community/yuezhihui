#!/bin/sh

set -e

# Xcode Cloud starts this script from ios/ci_scripts.
cd "$CI_PRIMARY_REPOSITORY_PATH"

if [ ! -d "$HOME/flutter" ]; then
  git clone https://github.com/flutter/flutter.git --depth 1 -b stable "$HOME/flutter"
fi

export PATH="$PATH:$HOME/flutter/bin"

flutter --version
flutter precache --ios
flutter pub get

HOMEBREW_NO_AUTO_UPDATE=1 brew install cocoapods

cd ios
pod install

exit 0
