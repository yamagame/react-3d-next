#!/bin/bash
./scripts/gltf-to-json.sh ./assets/gltf/buildings.gltf
./scripts/gltf-to-json.sh ./assets/gltf/cubes.gltf
./scripts/gltf-to-json.sh ./assets/gltf/uec-all.gltf
./scripts/cp-glb-to-public.sh
