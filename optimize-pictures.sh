#!/bin/bash
rm -r data/pictures
mkdir data/pictures
cd pictures
for f in *.jpg; do
	convert -strip -interlace Plane -gaussian-blur 0.05 -quality 95% "$f" "../data/pictures/$f"
done
