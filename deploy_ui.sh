#!/bin/bash

cd android
fastlane internal

cd ../ios
fastlane beta
