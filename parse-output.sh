#!/bin/bash
cd out
rm -r png
mkdir png
for filename in *.svg; do
	rsvg-convert "$filename" > "png/${filename%%.*}.png";
done
