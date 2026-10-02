#!/bin/bash
STYLE="Minimalist thin black ink line art on pure white background, elegant single-weight contour drawing, refined vintage engraving spirit, perfectly centered with generous white space, no text, no color, no shading, high quality"
z-ai image -p "$STYLE. A graceful ringed planet with a thin elliptical orbit ring passing behind it and one tiny four-point star nearby" -o "public/images/ai/scope-art-interplanetary.png" -s 1024x1024
z-ai image -p "$STYLE. A serene all-seeing eye at the center of a fine radiant triangle with delicate rays of light" -o "public/images/ai/scope-art-metaphysics.png" -s 1024x1024
z-ai image -p "$STYLE. An atom with three intersecting elliptical electron orbits around a small nucleus dot and one tiny wave curve" -o "public/images/ai/scope-art-quantum.png" -s 1024x1024
z-ai image -p "$STYLE. A heart outline crossed by a gentle heartbeat pulse line with one small leaf beside it" -o "public/images/ai/scope-art-healing.png" -s 1024x1024
echo DONE_ALL
