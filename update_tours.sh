rm -rf ./map\ changes/tours &
./venv/bin/python3 ./coastline_finder.py
./venv/bin/python3 ./mountain_range_finder.py
./venv/bin/python3 ./generate_tour_start_changes.py
./venv/bin/python3 ./map_enhancer.py
rm -rf ./buttermap-ui/public/tours
mv ./map\ changes/tours buttermap-ui/public/