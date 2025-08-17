#!/bin/bash

# Inicia Xvfb en segundo plano
Xvfb :99 -screen 0 1024x768x16 &

# Exporta variable DISPLAY
export DISPLAY=:99

# Inicia Flask
exec flask run --host=0.0.0.0 --port=8000