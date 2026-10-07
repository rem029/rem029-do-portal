#!/bin/bash

git checkout production && git pull origin dev && git push origin production;
git checkout dev